// frontend/context/DataContext.jsx

import React, { createContext, useState, useContext, useEffect, useMemo, useRef } from 'react';
import { Role } from '../types';
import apiClient from '../api';
import { useAuth } from './AuthContext';

const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [applications, setApplications] = useState([]);
  const [bills, setBills] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [studentAttempts, setStudentAttempts] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [batches, setBatches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  const fetchedRef = useRef(false);
  const safetyTimerRef = useRef(null);

  if (typeof window !== 'undefined') {
    window.__dataDebug = {
      get state() { return { isLoading, users: users.length, materials: materials.length, schedules: schedules.length, colleges: colleges.length, applications: applications.length, fetchedRef: fetchedRef.current }; },
    };
  }

  useEffect(() => {
    let cancelled = false;
    const fetchAllData = async () => {
      if (!user) {
        setUsers([]); setMaterials([]); setSchedules([]); setColleges([]); setApplications([]); setBills([]); setLeaderboard([]); setStudentAttempts([]); setAssessments([]); setCourses([]); setBatches([]); fetchedRef.current = false; setIsLoading(false); return;
      }
      if (fetchedRef.current) {
        if (isLoading) {
          console.log('[DataContext] StrictMode duplicate effect: clearing stale loading state');
          setIsLoading(false);
        }
        return; 
      }
      setIsLoading(true);
      console.log('[DataContext] setIsLoading(true)');
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      safetyTimerRef.current = setTimeout(() => {
        if (isLoading) {
          console.warn('[DataContext] Safety timeout fired; forcing loading false');
          setIsLoading(false);
          setError(e => e || 'Data load timed out.');
          fetchedRef.current = false;
        }
      }, 8000);
      try {
        console.log('[DataContext] Fetching initial data for role', user.role);
        const authHdr = apiClient.defaults?.headers?.common?.['Authorization'];
        console.log('[DataContext] Authorization header before batch:', authHdr || '(none)');

        const endpoints = [
          { key: 'users', url: '/users/' },
          { key: 'materials', url: '/materials/' },
          { key: 'schedules', url: '/schedules/' },
          { key: 'colleges', url: '/colleges/' },
          { key: 'applications', url: '/applications/' },
          { key: 'bills', url: '/bills/' },
          { key: 'reporting', url: '/reporting/' },
          { key: 'assessments', url: '/assessments/' },
          { key: 'courses', url: '/courses/' },
          { key: 'batches', url: '/batches/' },
        ];

        const withTimeout = (p, ms, key) => Promise.race([
          p,
          new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout '+key+' '+ms+'ms')), ms))
        ]);

        const start = performance.now();
        const results = await Promise.allSettled(endpoints.map(ep => {
          console.log('[DataContext] GET', ep.url);
          return withTimeout(apiClient.get(ep.url), 10000, ep.key);
        }));
        const elapsed = (performance.now() - start).toFixed(0);
        console.log('[DataContext] Fetch batch settled in', elapsed,'ms');
        if (cancelled) return;

        let had401 = false;
        results.forEach((res, idx) => {
          const { key } = endpoints[idx];
            if (res.status === 'fulfilled') {
              const data = res.value.data;
              switch (key) {
                case 'users': setUsers(data); break;
                case 'materials': setMaterials(data); break;
                case 'schedules': setSchedules(data.map(s => ({ ...s, startDate: new Date(s.start_date), endDate: new Date(s.end_date) }))); break;
                case 'colleges': setColleges(data); break;
                case 'applications': setApplications(data); break;
                case 'bills':
                  setBills(data.map(b => ({ ...b, date: new Date(b.date) })));
                  break;
                case 'assessments': setAssessments(data); break;
                case 'courses': setCourses(data); break;
                case 'batches': setBatches(data); break;
                case 'reporting':
                  setLeaderboard(data.leaderboard || []);
                  setStudentAttempts(data.student_attempts.map(a => ({ ...a, timestamp: new Date(a.timestamp) })) || []);
                  break;
              }
            } else {
              const respStatus = res.reason?.response?.status;
              if (respStatus === 401) had401 = true;
              console.warn('[DataContext] Failed', key, res.reason?.message || respStatus, 'status:', respStatus);
            }
        });
        if (had401) {
          setError('Session expired. Refreshing token...');
          fetchedRef.current = false;
        } else if (results.every(r => r.status === 'rejected')) {
          setError('All data requests failed.');
          fetchedRef.current = false;
        } else {
          setError(null);
          fetchedRef.current = true;
        }
      } catch (error) {
        const status = error?.response?.status;
        const detail = error?.response?.data;
        if (status === 401) {
          console.warn('[DataContext] 401 while fetching protected resources. Detail:', detail);
          fetchedRef.current = false;
          setError('Your session is invalid or expired. Please log in again.');
        } else {
          console.error('[DataContext] Failed fetching data:', { status, detail, error });
          setError('Failed loading data.');
        }
      } finally { if (!cancelled) { setIsLoading(false); console.log('[DataContext] setIsLoading(false)'); if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current); } }
    };
    fetchAllData();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    const handler = () => {
      if (user) {
        if (import.meta.env.DEV) console.debug('[DataContext] authTokensUpdated event -> allowing refetch');
        fetchedRef.current = false;
        Promise.resolve().then(() => {
          setIsLoading(l => l); 
        });
      }
    };
    window.addEventListener('authTokensUpdated', handler);
    return () => window.removeEventListener('authTokensUpdated', handler);
  }, [user]);

  const addSchedule = async (scheduleData) => {
    try {
      const payload = {
        trainer: scheduleData.trainerId,
        college: scheduleData.college,
        course: scheduleData.course,
        start_date: scheduleData.startDate.toISOString(),
        end_date: scheduleData.endDate.toISOString(),
        materials: scheduleData.materialIds,
      };
      const response = await apiClient.post('/schedules/', payload);
      const newSchedule = {
        ...response.data,
        startDate: new Date(response.data.start_date),
        endDate: new Date(response.data.end_date),
      };
      setSchedules(prev => [newSchedule, ...prev]);
    } catch (error) {
      console.error("Failed to add schedule:", error.response?.data || error.message);
      setError("Could not add schedule. Please check the details and try again.");
    }
  };

  const updateSchedule = async (scheduleId, scheduleData) => {
    try {
      const payload = {
        trainer: scheduleData.trainerId,
        college: scheduleData.college,
        course: scheduleData.course,
        start_date: scheduleData.startDate.toISOString(),
        end_date: scheduleData.endDate.toISOString(),
        materials: scheduleData.materialIds,
      };
      const response = await apiClient.patch(`/schedules/${scheduleId}/`, payload);
      const updatedSchedule = {
        ...response.data,
        startDate: new Date(response.data.start_date),
        endDate: new Date(response.data.end_date),
      };
      setSchedules(prev => prev.map(s => (s.id === scheduleId ? updatedSchedule : s)));
    } catch (error) {
      console.error("Failed to update schedule:", error.response?.data || error.message);
      setError("Could not update schedule. Please try again.");
    }
  };

  const deleteSchedule = async (scheduleId) => {
    try {
      await apiClient.delete(`/schedules/${scheduleId}/`);
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      setError("Could not delete schedule. Please try again.");
    }
  };

  const addMaterial = async (materialData) => {
    try {
      const response = await apiClient.post('/materials/', materialData);
      setMaterials(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add material:", error);
      setError("Could not add the material. Please try again.");
    }
  };

  const updateMaterial = async (materialId, updatedData) => {
    try {
      const response = await apiClient.patch(`/materials/${materialId}/`, updatedData);
      setMaterials(prev => 
        prev.map(m => (m.id === materialId ? response.data : m))
      );
    } catch (error) {
      console.error("Failed to update material:", error);
      setError("Could not update the material. Please try again.");
    }
  };

  const deleteMaterial = async (materialId) => {
    try {
      await apiClient.delete(`/materials/${materialId}/`);
      setMaterials(prev => prev.filter(m => m.id !== materialId));
    } catch (error) {
      console.error("Failed to delete material:", error);
      setError("Could not delete the material. Please try again.");
    }
  };

  const addCollege = async (collegeData) => {
    try {
      const response = await apiClient.post('/colleges/', collegeData);
      setColleges(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add college:", error);
      setError("Could not add college. Please try again.");
    }
  };

  const updateCollege = async (collegeId, updatedData) => {
    try {
      const response = await apiClient.patch(`/colleges/${collegeId}/`, updatedData);
      setColleges(prev => 
        prev.map(c => (c.id === collegeId ? response.data : c))
      );
    } catch (error) {
      console.error("Failed to update college:", error);
      setError("Could not update college. Please try again.");
    }
  };

  const deleteCollege = async (collegeId) => {
    try {
      await apiClient.delete(`/colleges/${collegeId}/`);
      setColleges(prev => prev.filter(c => c.id !== collegeId));
    } catch (error) {
      console.error("Failed to delete college:", error);
      setError("Could not delete college. Please try again.");
    }
  };

  const addUser = async (userData) => {
    try {
      const name = userData.name?.trim();
      const email = userData.email?.trim();
      if (!name || !email) throw new Error('Name and Email are required');
      const postData = { ...userData, name, email };
      const response = await apiClient.post('/users/', postData);
      setUsers(prev => [response.data, ...prev]);
    } catch (error) {
      const resp = error?.response;
      console.error('Failed to add user:', { status: resp?.status, data: resp?.data, message: error.message });
      if (resp?.data) {
        const fieldErrors = Object.entries(resp.data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(','):v}`).join(' | ');
        setError(`Add user failed (${resp.status}) - ${fieldErrors}`);
      } else {
        setError('Could not add user. The email may already exist.');
      }
    }
  };

  const updateUser = async (userId, userData) => {
    try {
      const response = await apiClient.patch(`/users/${userId}/`, userData);
      setUsers(prev => prev.map(u => (u.id === userId ? response.data : u)));
    } catch (error) {
      console.error("Failed to update user:", error.response?.data || error.message);
      setError("Could not update user.");
    }
  };

  const deleteUser = async (userId) => {
    try {
      await apiClient.delete(`/users/${userId}/`);
      setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (error) {
      console.error("Failed to delete user:", error);
      setError("Could not delete user.");
    }
  };

  const assignMaterialsToStudent = async (studentId, materialIds) => {
    try {
      const response = await apiClient.post(`/users/${studentId}/assign_materials/`, { material_ids: materialIds });
      setUsers(prev =>
        prev.map(u => (u.id === studentId ? response.data : u))
      );
    } catch (error) {
      console.error("Failed to assign materials:", error);
      setError("Could not assign materials. Please try again.");
    }
  };

  const removeApplication = (applicationId) => {
    setApplications(prev => prev.filter(app => app.id !== applicationId));
  };

  const addBill = async (billData) => {
    try {
      const payload = {
        trainer: billData.trainerId,
        date: billData.date.toISOString().split('T')[0],
        expenses: billData.expenses,
      };
      const response = await apiClient.post('/bills/', payload);
      const newBill = { ...response.data, date: new Date(response.data.date) };
      setBills(prev => [newBill, ...prev].sort((a, b) => b.date - a.date));
    } catch (error) {
      console.error("Failed to add bill:", error.response?.data || error.message);
      setError("Could not add bill.");
    }
  };

  const updateBillStatus = async (billId, status) => {
    try {
      const response = await apiClient.post(`/bills/${billId}/mark_as_paid/`);
      const updatedBill = { ...response.data, date: new Date(response.data.date) };
      setBills(prev => prev.map(b => (b.id === billId ? updatedBill : b)));
    } catch (error) {
      console.error("Failed to update bill status:", error.response?.data || error.message);
      setError("Could not update bill status.");
    }
  };

  const bulkAddStudents = async (collegeName, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('college', collegeName);

    try {
      const response = await apiClient.post('/users/bulk_create_students/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data);
      return { success: true, message: response.data.status };
    } catch (error) {
      const errorData = error.response?.data;
      console.error("Failed to bulk add students:", errorData);
      const errorMessage = errorData?.errors ? errorData.errors.join('\n') : (errorData?.error || "An unknown error occurred.");
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const addCourse = async (courseData) => {
    try {
      const response = await apiClient.post('/courses/', courseData);
      setCourses(prev => [response.data, ...prev]);
    } catch (error) {
      console.error("Failed to add course:", error.response?.data || error.message);
      setError("Could not add course.");
    }
  };

  const updateCourse = async (courseId, courseData) => {
    try {
      const response = await apiClient.patch(`/courses/${courseId}/`, courseData);
      setCourses(prev => prev.map(c => (c.id === courseId ? response.data : c)));
    } catch (error) {
      console.error("Failed to update course:", error.response?.data || error.message);
      setError("Could not update course.");
    }
  };

  const deleteCourse = async (courseId) => {
    try {
      await apiClient.delete(`/courses/${courseId}/`);
      setCourses(prev => prev.filter(c => c.id !== courseId));
    } catch (error) {
      console.error("Failed to delete course:", error);
      setError("Could not delete course.");
    }
  };

  const addBatchWithStudents = async (batchData, file) => {
    const formData = new FormData();
    formData.append('course', batchData.course);
    formData.append('name', batchData.name);
    formData.append('start_date', batchData.start_date);
    formData.append('end_date', batchData.end_date);
    formData.append('file', file);
    
    try {
      const response = await apiClient.post('/batches/create_with_students/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setBatches(prev => [response.data, ...prev]);
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data);
      return { success: true };
    } catch (error) {
      console.error("Failed to add batch with students:", error.response?.data || error.message);
      setError("Could not create batch. Please check the data and file.");
      return { success: false };
    }
  };

  const addStudentsToBatchFromFile = async (batchId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await apiClient.post(`/batches/${batchId}/add_students_from_file/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      // Refresh data
      setBatches(prev => prev.map(b => b.id === batchId ? response.data : b));
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data);
      return { success: true, message: 'Students added successfully!' };
    } catch (error) {
      const errorMsg = error.response?.data?.error || "Failed to upload students.";
      console.error("Failed to add students from file:", error);
      setError(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  const addStudentsToBatch = async (batchId, studentIds) => {
    try {
      const response = await apiClient.post(`/batches/${batchId}/add_students/`, { student_ids: studentIds });
      // Refresh batches and users to reflect changes
      setBatches(prev => prev.map(b => b.id === batchId ? response.data : b));
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data);
    } catch (error) {
      setError("Failed to add students to batch.");
    }
  };

  const removeStudentsFromBatch = async (batchId, studentIds) => {
    try {
      const response = await apiClient.post(`/batches/${batchId}/remove_students/`, { student_ids: studentIds });
      setBatches(prev => prev.map(b => b.id === batchId ? response.data : b));
      const usersResponse = await apiClient.get('/users/');
      setUsers(usersResponse.data);
    } catch (error) {
      setError("Failed to remove students from batch.");
    }
  };

  const updateBatch = async (batchId, batchData) => {
    try {
      const response = await apiClient.patch(`/batches/${batchId}/`, batchData);
      setBatches(prev => prev.map(b => (b.id === batchId ? response.data : b)));
    } catch (error) {
      console.error("Failed to update batch:", error.response?.data || error.message);
      setError("Could not update batch.");
    }
  };

  const deleteBatch = async (batchId) => {
    try {
      await apiClient.delete(`/batches/${batchId}/`);
      setBatches(prev => prev.filter(b => b.id !== batchId));
    } catch (error) {
      console.error("Failed to delete batch:", error);
      setError("Could not delete batch.");
    }
  };

  const submitAssessmentAttempt = async (attemptData) => {
    try {
      const response = await apiClient.post('/attempts/', attemptData);
      // Add the new attempt to the local state
      setStudentAttempts(prev => [{ ...response.data, timestamp: new Date(response.data.timestamp) }, ...prev]);
      // Manually refetch reporting data to update leaderboard
      const reportingResponse = await apiClient.get('/reporting/');
      setLeaderboard(reportingResponse.data.leaderboard || []);
      return { success: true, message: 'Assessment submitted successfully!' };
    } catch (error) {
      console.error("Failed to submit assessment:", error.response?.data || error.message);
      const errorMessage = error.response?.data?.detail || "Could not submit assessment.";
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  };

  const trainers = useMemo(() => users.filter(u => u.role === Role.TRAINER), [users]);
  const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);
  
  const value = {
    users, trainers, students, materials, schedules, colleges, applications, bills,
    leaderboard, studentAttempts, assessments, courses, batches,
    removeApplication,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addCollege,
    updateCollege,
    deleteCollege,
    addUser,
    updateUser,
    deleteUser,
    assignMaterialsToStudent,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    addCourse, 
    updateCourse, 
    deleteCourse,
    addBatch: addBatchWithStudents, 
    updateBatch, 
    deleteBatch,
    addBill,
    updateBillStatus,
    globalSearchTerm,
    setGlobalSearchTerm,
    bulkAddStudents,
    submitAssessmentAttempt,
    addStudentsToBatch,
    removeStudentsFromBatch,
    addStudentsToBatchFromFile,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
      {error && (
        <div className="fixed bottom-4 right-4 max-w-sm bg-white border border-red-300 shadow p-4 text-red-600 text-sm rounded">
          {error}
          <button
            onClick={() => { fetchedRef.current = false; setError(null); setIsLoading(false); }}
            className="ml-3 underline"
          >Retry</button>
        </div>
      )}
      {isLoading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center text-slate-700 text-sm">
          Loading Dashboard Data...
        </div>
      )}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};