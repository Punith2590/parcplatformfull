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
    const [trainerApplications, setTrainerApplications] = useState([]); // Renamed state
    const [employeeApplications, setEmployeeApplications] = useState([]); // Added state
    const [bills, setBills] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [studentAttempts, setStudentAttempts] = useState([]);
    const [assessments, setAssessments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [batches, setBatches] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [employeeDocuments, setEmployeeDocuments] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [globalSearchTerm, setGlobalSearchTerm] = useState('');

    const fetchedRef = useRef(false);
    const safetyTimerRef = useRef(null);
    const retryAttemptedRef = useRef(false);

    // Debug window object (optional)
    if (typeof window !== 'undefined') {
        window.__dataDebug = {
            get state() {
                return {
                    isLoading,
                    users: users.length,
                    materials: materials.length,
                    schedules: schedules.length,
                    colleges: colleges.length,
                    trainerApplications: trainerApplications.length,
                    employeeApplications: employeeApplications.length,
                    tasks: tasks.length,
                    employeeDocuments: employeeDocuments.length,
                    fetchedRef: fetchedRef.current
                };
            },
        };
    }

    useEffect(() => {
        let cancelled = false;
        const fetchAllData = async () => {
            // Clear data if no user
            retryAttemptedRef.current = false;
            if (!user) {
                setUsers([]); setMaterials([]); setSchedules([]); setColleges([]);
                setTrainerApplications([]); setEmployeeApplications([]); setBills([]);
                setLeaderboard([]); setStudentAttempts([]); setAssessments([]);
                setCourses([]); setBatches([]); setTasks([]); setEmployeeDocuments([]);
                fetchedRef.current = false; setIsLoading(false); return;
            }
            // Prevent refetch if already fetched in StrictMode or during loading
            if ((fetchedRef.current || isLoading) && !cancelled) {
                 if (import.meta.env.DEV && isLoading) console.debug('[DataContext] StrictMode duplicate effect: skipped fetch');
                 if (isLoading) setIsLoading(false); // Clear stale loading state
                 return;
            }
            setIsLoading(true);
            if (import.meta.env.DEV) console.debug('[DataContext] setIsLoading(true)');

            // Safety timeout
            if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
            safetyTimerRef.current = setTimeout(() => {
                if (isLoading && !cancelled) {
                    console.warn('[DataContext] Safety timeout fired; forcing loading false');
                    setIsLoading(false);
                    setError(e => e || 'Data load timed out.');
                    fetchedRef.current = false; // Allow retry on timeout
                }
            }, 15000); // Increased timeout

            try {
                if (import.meta.env.DEV) console.debug('[DataContext] Fetching initial data for role', user.role);

                // Define endpoints
                const endpoints = [
                    { key: 'users', url: '/users/' },
                    { key: 'materials', url: '/materials/' },
                    { key: 'schedules', url: '/schedules/' },
                    { key: 'colleges', url: '/colleges/' },
                    { key: 'trainerApplications', url: '/trainer-applications/' }, // Corrected URL
                    { key: 'employeeApplications', url: '/employee-applications/' }, // Added
                    { key: 'bills', url: '/bills/' },
                    { key: 'reporting', url: '/reporting/' }, // Leaderboard + Attempts
                    { key: 'assessments', url: '/assessments/' },
                    { key: 'courses', url: '/courses/' },
                    { key: 'batches', url: '/batches/' },
                    { key: 'tasks', url: '/tasks/' },
                    { key: 'employeeDocuments', url: '/employee-documents/' },
                ];

                const start = performance.now();
                const results = await Promise.allSettled(endpoints.map(ep => {
                    if (import.meta.env.DEV) console.debug('[DataContext] GET', ep.url);
                    // Increased individual timeout
                    return apiClient.get(ep.url, { timeout: 10000 }).catch(err => Promise.reject({ key: ep.key, error: err }));
                }));
                const elapsed = (performance.now() - start).toFixed(0);
                if (import.meta.env.DEV) console.debug('[DataContext] Fetch batch settled in', elapsed,'ms');
                if (cancelled) return;

                let hadErrors = false;
                let had401 = false;
                results.forEach((res, idx) => {
                    const { key } = endpoints[idx];
                    if (res.status === 'fulfilled') {
                        const data = res.value.data;
                        // Safely set state, defaulting to empty arrays if data is not array
                        switch (key) {
                            case 'users': setUsers(Array.isArray(data) ? data : []); break;
                            case 'materials': setMaterials(Array.isArray(data) ? data : []); break;
                            case 'schedules': setSchedules(Array.isArray(data) ? data.map(s => ({ ...s, startDate: new Date(s.start_date), endDate: new Date(s.end_date) })) : []); break;
                            case 'colleges': setColleges(Array.isArray(data) ? data : []); break;
                            case 'trainerApplications': setTrainerApplications(Array.isArray(data) ? data : []); break;
                            case 'employeeApplications': setEmployeeApplications(Array.isArray(data) ? data : []); break;
                            case 'bills': setBills(Array.isArray(data) ? data.map(b => ({ ...b, date: new Date(b.date + 'T00:00:00') })) : []); break; // Ensure date is parsed correctly
                            case 'assessments': setAssessments(Array.isArray(data) ? data : []); break;
                            case 'courses': setCourses(Array.isArray(data) ? data : []); break;
                            case 'batches': setBatches(Array.isArray(data) ? data : []); break;
                            case 'tasks': setTasks(Array.isArray(data) ? data : []); break;
                            case 'employeeDocuments': setEmployeeDocuments(Array.isArray(data) ? data : []); break;
                            case 'reporting':
                                setLeaderboard(data?.leaderboard && Array.isArray(data.leaderboard) ? data.leaderboard : []);
                                setStudentAttempts(data?.student_attempts && Array.isArray(data.student_attempts) ? data.student_attempts.map(a => ({ ...a, timestamp: new Date(a.timestamp) })) : []);
                                break;
                            default:
                                console.warn(`[DataContext] Unhandled key in fetch results: ${key}`);
                        }
                    } else {
                        hadErrors = true;
                        const respStatus = res.reason?.error?.response?.status;
                        if (respStatus === 401) had401 = true;
                        console.warn('[DataContext] Failed', key, res.reason?.error?.message || respStatus, 'status:', respStatus);
                    }
                });

                if (had401) {
                    setError('Session expired. Attempting to refresh...');
                    fetchedRef.current = false; // Allow refetch after potential token refresh
                    // If we haven't retried yet, schedule one quick retry to handle token race
                    if (!retryAttemptedRef.current) {
                        retryAttemptedRef.current = true;
                        if (import.meta.env.DEV) console.debug('[DataContext] Scheduling one retry after 200ms due to 401');
                        setTimeout(() => {
                            if (!cancelled) {
                                // allow fetch to run again
                                fetchedRef.current = false;
                                // trigger effect by forcing a state update harmlessly
                                setError(e => e);
                            }
                        }, 200);
                    }
                } else if (hadErrors) {
                    setError('Some data failed to load. Functionality may be limited.');
                    fetchedRef.current = true; // Mark as fetched even with partial failure
                } else {
                    setError(null);
                    fetchedRef.current = true; // Mark fetch as successful only if all succeed
                    if (import.meta.env.DEV) console.debug('[DataContext] Fetch successful, fetchedRef=true');
                }
            } catch (error) { // Catch errors not caught by Promise.allSettled
                const status = error?.response?.status;
                const detail = error?.response?.data;
                console.error('[DataContext] Unexpected error during fetch batch:', { status, detail, error });
                setError('Failed loading essential data.');
                fetchedRef.current = false; // Allow refetch on error
            } finally {
                if (!cancelled) {
                    setIsLoading(false);
                    if (import.meta.env.DEV) console.debug('[DataContext] setIsLoading(false)');
                    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
                }
            }
        };
        fetchAllData();
        return () => { cancelled = true; if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current); };
    }, [user]); // Re-fetch when user changes

    // Listener for token updates (e.g., after refresh)
    useEffect(() => {
        const handler = () => {
            if (user) {
                if (import.meta.env.DEV) console.debug('[DataContext] authTokensUpdated event -> allowing refetch');
                fetchedRef.current = false; // Allow refetch
                // Trigger a state update slightly later to ensure it runs after AuthContext update
                setTimeout(() => setError(e => e), 0);
            }
        };
        window.addEventListener('authTokensUpdated', handler);
        return () => window.removeEventListener('authTokensUpdated', handler);
    }, [user]);


    // --- CRUD Functions ---

    // Application Approval Functions
    const approveTrainerApplication = async (applicationId) => {
        try {
            await apiClient.post(`/trainer-applications/${applicationId}/approve/`);
            setTrainerApplications(prev => prev.filter(app => app.id !== applicationId));
            const usersRes = await apiClient.get('/users/'); // Refresh users
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to approve trainer application:", error.response?.data || error.message);
            setError(error.response?.data?.error || "Failed to approve trainer application.");
        }
    };
    const declineTrainerApplication = async (applicationId) => {
        try {
            await apiClient.post(`/trainer-applications/${applicationId}/decline/`);
            setTrainerApplications(prev => prev.filter(app => app.id !== applicationId));
        } catch (error) {
            console.error("Failed to decline trainer application:", error);
            setError("Could not decline trainer application.");
        }
    };

    const approveEmployeeApplication = async (applicationId) => {
        try {
            await apiClient.post(`/employee-applications/${applicationId}/approve/`);
            setEmployeeApplications(prev => prev.filter(app => app.id !== applicationId));
            const usersRes = await apiClient.get('/users/'); // Refresh users
            setUsers(usersRes.data);
        } catch (error) {
            console.error("Failed to approve employee application:", error.response?.data || error.message);
            setError(error.response?.data?.error || "Failed to approve employee application.");
        }
    };
    const declineEmployeeApplication = async (applicationId) => {
        try {
            await apiClient.post(`/employee-applications/${applicationId}/decline/`);
            setEmployeeApplications(prev => prev.filter(app => app.id !== applicationId));
        } catch (error) {
            console.error("Failed to decline employee application:", error);
            setError("Could not decline employee application.");
        }
    };

    // Task Functions
    const fetchTasks = async () => {
        try {
            const response = await apiClient.get('/tasks/');
            setTasks(response.data);
        } catch (error) {
            console.error("Failed to fetch tasks:", error);
            setError("Could not load tasks.");
        }
    };
    const addTask = async (taskData) => {
        try {
            const payload = {
                title: taskData.title,
                description: taskData.description,
                status: taskData.status,
                due_date: taskData.due_date || null,
            };
            if (taskData.employeeId) {
                payload.employee = taskData.employeeId;
            }
            const response = await apiClient.post('/tasks/', payload);
            setTasks(prev => [response.data, ...prev].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)));
        } catch (error) {
            console.error("Failed to add task:", error.response?.data || error.message);
            const errorDetail = error.response?.data?.employee || error.response?.data?.detail || "Could not add task.";
            setError(errorDetail);
        }
    };

    const updateTask = async (taskId, taskData) => {
        try {
            const { employee, employeeId, employee_name, created_at, updated_at, ...payload } = taskData;
            const response = await apiClient.patch(`/tasks/${taskId}/`, payload);
            setTasks(prev => prev.map(t => (t.id === taskId ? response.data : t)));
        } catch (error) {
            console.error("Failed to update task:", error.response?.data || error.message);
             const errorDetail = error.response?.data?.detail || "Could not update task.";
            setError(errorDetail);
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await apiClient.delete(`/tasks/${taskId}/`);
            setTasks(prev => prev.filter(t => t.id !== taskId));
        } catch (error) {
            console.error("Failed to delete task:", error);
            setError("Could not delete task.");
        }
    };

    const uploadEmployeeDocument = async (formData) => {
        try {
            const response = await apiClient.post('/employee-documents/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEmployeeDocuments(prev => [response.data, ...prev].sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at)));
            return { success: true };
        } catch (error) {
            console.error("Failed to upload document:", error.response?.data || error.message);
            setError("Failed to upload document.");
            return { success: false };
        }
    };

    const deleteEmployeeDocument = async (documentId) => {
        try {
            await apiClient.delete(`/employee-documents/${documentId}/`);
            setEmployeeDocuments(prev => prev.filter(doc => doc.id !== documentId));
        } catch (error) {
            console.error("Failed to delete document:", error);
            setError("Failed to delete document.");
        }
    };

   // --- UPDATED: Handle FormData ---
   const addEducationEntry = async (entryData) => { // entryData is now FormData
        try {
            await apiClient.post('/education-entries/', entryData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Re-fetch the full user profile to get the updated list
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u // Use loose equality
            ));
            // --- ADDED: Refresh documents list ---
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
            return { success: true };
        } catch (error) {
            console.error("Failed to add education entry:", error.response?.data || error.message);
            setError("Failed to add education entry.");
            return { success: false };
        }
    };

    // --- UPDATED: Handle FormData ---
    const updateEducationEntry = async (entryId, entryData) => { // entryData is now FormData
        try {
            // Use PATCH for FormData updates (some backends prefer POST for multipart updates)
            await apiClient.patch(`/education-entries/${entryId}/`, entryData, {
                 headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Re-fetch the full user profile
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u // Use loose equality
            ));
            // --- ADDED: Refresh documents list ---
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
            return { success: true };
        } catch (error) {
            console.error("Failed to update education entry:", error.response?.data || error.message);
            setError("Failed to update education entry.");
            return { success: false };
        }
    };

    const deleteEducationEntry = async (entryId, employeeId) => {
        if (!employeeId || employeeId != user.user_id) return; // Use loose equality
        try {
            await apiClient.delete(`/education-entries/${entryId}/`);
            // Re-fetch user
            const response = await apiClient.get(`/users/${employeeId}/`);
            setUsers(prev => prev.map(u => 
                u.id == employeeId ? response.data : u // Use loose equality
            ));
             // --- ADDED: Refresh documents list ---
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
        } catch (error) {
            console.error("Failed to delete education entry:", error);
            setError("Failed to delete education entry.");
        }
    };
    // --- END EDUCATION UPDATES ---

    const addWorkExperienceEntry = async (entryData) => {
        try {
            await apiClient.post('/work-experience-entries/', entryData);
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u
            ));
            return { success: true };
        } catch (error) {
            console.error("Failed to add work experience:", error.response?.data || error.message);
            setError("Failed to add work experience.");
            return { success: false };
        }
    };

    const updateWorkExperienceEntry = async (entryId, entryData) => {
        try {
            await apiClient.patch(`/work-experience-entries/${entryId}/`, entryData);
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u
            ));
            return { success: true };
        } catch (error) {
            console.error("Failed to update work experience:", error.response?.data || error.message);
            setError("Failed to update work experience.");
            return { success: false };
        }
    };

    const deleteWorkExperienceEntry = async (entryId, employeeId) => {
        if (!employeeId || employeeId != user.user_id) return;
        try {
            await apiClient.delete(`/work-experience-entries/${entryId}/`);
            const response = await apiClient.get(`/users/${employeeId}/`);
            setUsers(prev => prev.map(u => 
                u.id == employeeId ? response.data : u
            ));
        } catch (error) {
            console.error("Failed to delete work experience:", error);
            setError("Failed to delete work experience.");
        }
    };

    const addCertificationEntry = async (formData) => {
        try {
            await apiClient.post('/certification-entries/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Re-fetch user to get updated list
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u
            ));
            // ALSO re-fetch documents to show the new certificate there
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
            
            return { success: true };
        } catch (error) {
            console.error("Failed to add certification:", error.response?.data || error.message);
            setError("Failed to add certification.");
            return { success: false };
        }
    };

    const updateCertificationEntry = async (entryId, formData) => {
        try {
            await apiClient.patch(`/certification-entries/${entryId}/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const response = await apiClient.get(`/users/${user.user_id}/`);
            setUsers(prev => prev.map(u => 
                u.id == user.user_id ? response.data : u
            ));
            // ALSO re-fetch documents in case the file was changed
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
            
            return { success: true };
        } catch (error) {
            console.error("Failed to update certification:", error.response?.data || error.message);
            setError("Failed to update certification.");
            return { success: false };
        }
    };

    const deleteCertificationEntry = async (entryId, employeeId) => {
        if (!employeeId || employeeId != user.user_id) return;
        try {
            await apiClient.delete(`/certification-entries/${entryId}/`);
            const response = await apiClient.get(`/users/${employeeId}/`);
            setUsers(prev => prev.map(u => 
                u.id == employeeId ? response.data : u
            ));
            // We should also re-fetch documents in case the signal deletes it
            const docsResponse = await apiClient.get('/employee-documents/');
            setEmployeeDocuments(Array.isArray(docsResponse.data) ? docsResponse.data : []);
        } catch (error) {
            console.error("Failed to delete certification:", error);
            setError("Failed to delete certification.");
        }
    };

    // Schedule Functions
    const addSchedule = async (scheduleData) => {
        try {
            const response = await apiClient.post('/schedules/', scheduleData);
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
            const response = await apiClient.patch(`/schedules/${scheduleId}/`, scheduleData);
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

    // Material Functions
    const addMaterial = async (materialData) => {
        try {
            const response = await apiClient.post('/materials/', materialData, {
                 headers: { 'Content-Type': 'multipart/form-data' },
            });
            setMaterials(prev => [response.data, ...prev]);
        } catch (error) {
            console.error("Failed to add material:", error);
            setError("Could not add the material. Please try again.");
        }
    };
    const updateMaterial = async (materialId, updatedData) => {
        try {
            // Check if updatedData is FormData and if 'content' is present
            const headers = updatedData instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {};
            const response = await apiClient.patch(`/materials/${materialId}/`, updatedData, { headers });
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

    // College Functions
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

    const updateCollegeCourses = async (collegeId, course_ids) => {
        try {
            const response = await apiClient.post(`/colleges/${collegeId}/manage_courses/`, { course_ids });
            setColleges(prev =>
                prev.map(c => (c.id === collegeId ? response.data : c))
            );
        } catch (error) {
            console.error("Failed to update college courses:", error);
            setError("Could not update college courses. Please try again.");
        }
    };

    // User Functions (reused for Employee)
    const addUser = async (userData) => {
        try {
            const name = userData.name?.trim();
            const email = userData.email?.trim();
            if (!name || !email) throw new Error('Name and Email are required');
            const postData = { ...userData, name, email }; // Ensure name/email are sent correctly
            const response = await apiClient.post('/users/', postData);
            setUsers(prev => [response.data, ...prev]);
        } catch (error) {
            const resp = error?.response;
            console.error('Failed to add user:', { status: resp?.status, data: resp?.data, message: error.message });
            const errorMsg = resp?.data ? Object.entries(resp.data).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(','):v}`).join(' | ') : 'The email may already exist or input is invalid.';
            setError(`Add user failed - ${errorMsg}`);
        }
    };

    const updateUser = async (userId, userData) => {
        try {
            const { full_name, username, assigned_materials, assigned_assessments, education_entries, work_experience_entries, certification_entries, ...payload } = userData;
            await apiClient.patch(`/users/${userId}/`, payload);
            const response = await apiClient.get(`/users/${userId}/`);
            setUsers(prev => prev.map(u => 
                u.id == userId ? response.data : u
            ));
            return { success: true };
        } catch (error) {
            console.error("Failed to update user:", error.response?.data || error.message);
            setError("Could not update user.");
            return { success: false };
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

    // Student Specific
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
    const submitAssessmentAttempt = async (attemptData) => {
        try {
            const response = await apiClient.post('/attempts/', attemptData);
            setStudentAttempts(prev => [{ ...response.data, timestamp: new Date(response.data.timestamp) }, ...prev]);
            const reportingResponse = await apiClient.get('/reporting/'); // Refresh leaderboard
            setLeaderboard(reportingResponse.data.leaderboard || []);
            return { success: true, message: 'Assessment submitted successfully!' };
        } catch (error) {
            console.error("Failed to submit assessment:", error.response?.data || error.message);
            const errorMessage = error.response?.data?.detail || "Could not submit assessment.";
            setError(errorMessage);
            return { success: false, message: errorMessage };
        }
    };

    // Bill Functions
    const addBill = async (billData) => {
        try {
            const payload = {
                trainer: billData.trainerId,
                date: billData.date instanceof Date ? billData.date.toISOString().split('T')[0] : billData.date, // Format date correctly
                expenses: billData.expenses,
            };
            const response = await apiClient.post('/bills/', payload);
            const newBill = { ...response.data, date: new Date(response.data.date + 'T00:00:00') }; // Ensure correct date parsing
            setBills(prev => [newBill, ...prev].sort((a, b) => b.date - a.date));
        } catch (error) {
            console.error("Failed to add bill:", error.response?.data || error.message);
            setError("Could not add bill.");
        }
    };
    const updateBillStatus = async (billId, status) => { // Status arg might not be needed if endpoint toggles
        try {
            const response = await apiClient.post(`/bills/${billId}/mark_as_paid/`);
            const updatedBill = { ...response.data, date: new Date(response.data.date + 'T00:00:00') };
            setBills(prev => prev.map(b => (b.id === billId ? updatedBill : b)));
        } catch (error) {
            console.error("Failed to update bill status:", error.response?.data || error.message);
            setError("Could not update bill status.");
        }
    };

    // Course Functions
    const addCourse = async (courseData) => {
        try {
            const response = await apiClient.post('/courses/', courseData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Fetch the newly created course again to get related module data if needed
            const newCourseResponse = await apiClient.get(`/courses/${response.data.id}/`);
            setCourses(prev => [newCourseResponse.data, ...prev]);
        } catch (error) {
            console.error("Failed to add course:", error.response?.data || error.message);
            setError("Could not add course.");
        }
    };
    const updateCourse = async (courseId, courseData) => {
        try {
            await apiClient.patch(`/courses/${courseId}/`, courseData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            // Fetch updated course data to include modules/materials
            const updatedCourseResponse = await apiClient.get(`/courses/${courseId}/`);
            setCourses(prev => prev.map(c => (c.id === courseId ? updatedCourseResponse.data : c)));
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

    // Module Functions
    const addModule = async (moduleData) => {
        try {
            await apiClient.post('/modules/', moduleData);
            // Refetch the parent course to update its module list
            const courseResponse = await apiClient.get(`/courses/${moduleData.course}/`);
            setCourses(prev => prev.map(c => c.id === moduleData.course ? courseResponse.data : c));
        } catch (error) {
            console.error("Failed to add module:", error.response?.data || error.message);
            setError("Could not add module.");
        }
    };
    const updateModule = async (moduleId, moduleData) => {
        try {
            await apiClient.patch(`/modules/${moduleId}/`, moduleData);
            // Refetch the parent course
            const courseResponse = await apiClient.get(`/courses/${moduleData.course}/`);
            setCourses(prev => prev.map(c => c.id === moduleData.course ? courseResponse.data : c));
        } catch (error) {
            console.error("Failed to update module:", error.response?.data || error.message);
            setError("Could not update module.");
        }
    };
    const deleteModule = async (moduleId) => {
        try {
            // Find the module first to know which course to refetch
            const moduleToDelete = courses.flatMap(c => c.modules || []).find(m => m.id === moduleId);
            if (!moduleToDelete) return;
            await apiClient.delete(`/modules/${moduleId}/`);
            // Refetch the parent course
            const courseResponse = await apiClient.get(`/courses/${moduleToDelete.course}/`);
            setCourses(prev => prev.map(c => c.id === moduleToDelete.course ? courseResponse.data : c));
        } catch (error) {
            console.error("Failed to delete module:", error);
            setError("Could not delete module.");
        }
    };

    // Batch Functions
    const addBatchWithStudents = async (batchData, file) => {
        const formData = new FormData();
        formData.append('course', batchData.course);
        if (batchData.college) formData.append('college', batchData.college);
        formData.append('name', batchData.name);
        formData.append('start_date', batchData.start_date);
        formData.append('end_date', batchData.end_date);
        formData.append('file', file);
        try {
            const response = await apiClient.post('/batches/create_with_students/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
            });
            setBatches(prev => [response.data.batch || response.data, ...prev]);
             // Force user refresh after potential creations
             const usersRes = await apiClient.get('/users/');
             setUsers(usersRes.data);
            return { success: true, message: JSON.stringify(response.data.import_summary || { added_to_batch: 'N/A', newly_created: 'N/A', skipped: 0, errors: [] }) };
        } catch (error) {
            const errorMsg = error.response?.data?.error || "Could not create batch with students.";
            console.error("Failed to add batch with students:", error);
            setError(errorMsg);
            return { success: false, message: errorMsg };
        }
    };
    const addStudentsToBatchFromFile = async (batchId, file) => {
        const formData = new FormData();
        formData.append('file', file);
        try {
            const response = await apiClient.post(`/batches/${batchId}/add_students_from_file/`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000,
            });
            setBatches(prev => prev.map(b => b.id === batchId ? (response.data.batch || response.data) : b));
            // Force user refresh after potential creations
            const usersRes = await apiClient.get('/users/');
            setUsers(usersRes.data);
            return { success: true, message: JSON.stringify(response.data.import_summary || { added_to_batch: 'N/A', newly_created: 'N/A', skipped: 0, errors: [] }) };
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
            setBatches(prev => prev.map(b => b.id === batchId ? response.data : b));
            const usersResponse = await apiClient.get('/users/'); // Refresh users
            setUsers(usersResponse.data);
        } catch (error) {
            console.error("Failed to add students to batch:", error);
            setError("Failed to add students to batch.");
        }
    };
    const removeStudentsFromBatch = async (batchId, studentIds) => {
        try {
            const response = await apiClient.post(`/batches/${batchId}/remove_students/`, { student_ids: studentIds });
            setBatches(prev => prev.map(b => b.id === batchId ? response.data : b));
            const usersResponse = await apiClient.get('/users/'); // Refresh users
            setUsers(usersResponse.data);
        } catch (error) {
            console.error("Failed to remove students from batch:", error);
            setError("Failed to remove students from batch.");
        }
    };
    const assignMaterialsToBatch = async (batchId, materialIds) => {
        try {
            await apiClient.post(`/batches/${batchId}/assign_materials/`, { material_ids: materialIds });
            // No direct state update needed here, assignment happens on backend users
            alert('Materials assigned successfully to all students in the batch!');
        } catch (error) {
            console.error("Failed to assign materials to batch:", error);
            setError("Could not assign materials to the batch. Please try again.");
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
            const errorMsg = Array.isArray(error.response?.data?.error) ? error.response.data.error.join('\n') : error.response?.data?.error;
            console.error("Failed to delete batch:", error);
            setError(errorMsg || "Could not delete batch.");
        }
    };

    // --- Derived State Memos ---
    const trainers = useMemo(() => users.filter(u => u.role === Role.TRAINER), [users]);
    const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);
    const employees = useMemo(() => users.filter(u => u.role === Role.EMPLOYEE), [users]);

    // --- Context Value ---
    const value = {
        users, trainers, students, employees,
        materials, schedules, colleges,
        trainerApplications, employeeApplications,
        bills, leaderboard, studentAttempts, assessments, courses, batches, tasks, employeeDocuments,
        // Application functions
        approveTrainerApplication, declineTrainerApplication,
        approveEmployeeApplication, declineEmployeeApplication,
        // User functions
        addUser, updateUser, deleteUser,
        // Material functions
        addMaterial, updateMaterial, deleteMaterial,
        // College functions
        addCollege, updateCollege, deleteCollege, updateCollegeCourses,
        // Schedule functions
        addSchedule, updateSchedule, deleteSchedule,
        // Course functions
        addCourse, updateCourse, deleteCourse,
        // Module functions
        addModule, updateModule, deleteModule,
        // Batch functions
        addBatch: addBatchWithStudents, updateBatch, deleteBatch,
        addStudentsToBatch, removeStudentsFromBatch, addStudentsToBatchFromFile,
        assignMaterialsToBatch,
        // Student Specific
        assignMaterialsToStudent, submitAssessmentAttempt,
        // Billing functions
        addBill, updateBillStatus,
        // Task functions
        fetchTasks, addTask, updateTask, deleteTask,
        // Employee Document Functions
        uploadEmployeeDocument, deleteEmployeeDocument,
        // Education Entry Functions
        addEducationEntry, updateEducationEntry, deleteEducationEntry,
        // Work Experience Functions
        addWorkExperienceEntry, updateWorkExperienceEntry, deleteWorkExperienceEntry,
        // Certification Entry Functions
        addCertificationEntry, updateCertificationEntry, deleteCertificationEntry,
        // Global search
        globalSearchTerm, setGlobalSearchTerm,
        // Loading and error state
        isLoading, error, setError
    };

    return (
        <DataContext.Provider value={value}>
            {children}
            {/* Error Display */}
            {error && (
                <div className="fixed bottom-4 right-4 max-w-sm z-[100] bg-red-100 border border-red-300 shadow p-4 text-red-700 text-sm rounded flex justify-between items-start">
                    <span className="break-words">{error}</span>
                    <button
                        onClick={() => { setError(null); fetchedRef.current = false; setIsLoading(true); /* Trigger fetch */ }}
                        className="ml-3 text-red-500 hover:text-red-700 font-bold flex-shrink-0"
                        title="Dismiss & Retry Fetch"
                    >
                        &times;
                    </button>
                </div>
            )}
        </DataContext.Provider>
    );
};

// --- useData Hook ---
export const useData = () => {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
};