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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchedRef = useRef(false);
  const safetyTimerRef = useRef(null);

  // Expose simple debug object for manual inspection
  if (typeof window !== 'undefined') {
    window.__dataDebug = {
      get state() { return { isLoading, users: users.length, materials: materials.length, schedules: schedules.length, colleges: colleges.length, applications: applications.length, fetchedRef: fetchedRef.current }; },
    };
  }

  useEffect(() => {
    let cancelled = false;
    const fetchAllData = async () => {
      if (!user) {
        setUsers([]); setMaterials([]); setSchedules([]); setColleges([]); setApplications([]); fetchedRef.current = false; setIsLoading(false); return;
      }
      // React 18 StrictMode runs effects twice (mount->unmount->mount). First run sets loading true and its cleanup marks cancelled.
      // Second run sees fetchedRef=true (from first run) and would previously exit without clearing loading. Fix below:
      if (fetchedRef.current) {
        if (isLoading) {
          console.log('[DataContext] StrictMode duplicate effect: clearing stale loading state');
          setIsLoading(false);
        }
        return; // Data already fetched (or in progress previously) – skip.
      }
  setIsLoading(true);
      console.log('[DataContext] setIsLoading(true)');
      // Safety timeout: ensure we never stay stuck beyond 8s
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
              }
            } else {
              const respStatus = res.reason?.response?.status;
              if (respStatus === 401) had401 = true;
              console.warn('[DataContext] Failed', key, res.reason?.message || respStatus, 'status:', respStatus);
            }
        });
        if (had401) {
          setError('Session expired. Refreshing token...');
          fetchedRef.current = false; // allow retry after refresh
        } else if (results.every(r => r.status === 'rejected')) {
          setError('All data requests failed.');
          fetchedRef.current = false;
        } else {
          setError(null);
          fetchedRef.current = true; // mark successful fetch completion
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

  // Listen for token refresh events to retry fetch if previously failed
  useEffect(() => {
    const handler = () => {
      if (user) {
        if (import.meta.env.DEV) console.debug('[DataContext] authTokensUpdated event -> allowing refetch');
        fetchedRef.current = false;
        // trigger effect re-run by setting a dummy state toggle OR directly calling fetch (simpler: use a microtask)
        Promise.resolve().then(() => {
          // Manually invoke logic by temporarily toggling user reference through a noop set
          // (Alternative: extract fetch function and call here)
          // We'll just reset fetchedRef and rely on next render cycle; if none, force one.
          setIsLoading(l => l); // no-op to ensure React notices something
        });
      }
    };
    window.addEventListener('authTokensUpdated', handler);
    return () => window.removeEventListener('authTokensUpdated', handler);
  }, [user]);

  const removeApplication = (applicationId) => {
    setApplications(prev => prev.filter(app => app.id !== applicationId));
  };
  
  const trainers = useMemo(() => users.filter(u => u.role === Role.TRAINER), [users]);
  const students = useMemo(() => users.filter(u => u.role === Role.STUDENT), [users]);
  
  const value = {
    users, trainers, students, materials, schedules, colleges, applications,
    removeApplication,
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