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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

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
        setUsers([]); setMaterials([]); setSchedules([]); setColleges([]); setApplications([]); setBills([]); setLeaderboard([]); setStudentAttempts([]); setAssessments([]); fetchedRef.current = false; setIsLoading(false); return;
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
      // The backend expects trainer, college, and materials as IDs
      const payload = {
        trainer: scheduleData.trainerId,
        college: scheduleData.college, // Assuming this is the college ID or name based on your model
        course: scheduleData.course,
        start_date: scheduleData.startDate.toISOString(),
        end_date: scheduleData.endDate.toISOString(),
        materials: scheduleData.materialIds,
      };
      const response = await apiClient.post('/schedules/', payload);
      // Convert dates back to Date objects for the frontend state
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
      console.log('[DataContext.addUser] POST /users/ payload:', postData);
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
        date: billData.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
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
      // We will use the custom action we created
      const response = await apiClient.post(`/bills/${billId}/mark_as_paid/`);
      const updatedBill = { ...response.data, date: new Date(response.data.date) };
      setBills(prev => prev.map(b => (b.id === billId ? updatedBill : b)));
    } catch (error) {
      console.error("Failed to update bill status:", error.response?.data || error.message);
      setError("Could not update bill status.");
    }
  };

  const trainers = useMemo(() => users.filter(u => u.role === Role.TRAINER), [users]);
  const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);
  
  const value = {
    users, trainers, students, materials, schedules, colleges, applications, bills,
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
    addBill,
    updateBillStatus,
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