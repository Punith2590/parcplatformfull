// frontend/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => 
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  
  const [user, setUser] = useState(() =>
    localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
  );
  
  const [loading, setLoading] = useState(true);

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/token/', { username, password });
      const data = response.data;
      localStorage.setItem('authTokens', JSON.stringify(data));
      setAuthTokens(data);
      setUser(jwtDecode(data.access));
    } catch (error) {
      console.error('Login failed:', error?.response?.data || error.message);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    localStorage.removeItem('authTokens');
    delete apiClient.defaults.headers.common['Authorization'];
    setAuthTokens(null);
    setUser(null);
  };

  const setNewPassword = async (password) => {
    try {
      await apiClient.post('/auth/set-password/', { password });
      logout(); // Force logout after password change
      return { success: true, message: 'Password updated successfully! Please log in again.' };
    } catch (error) {
      console.error('Password change failed:', error?.response?.data || error.message);
      throw new Error('Failed to set new password.');
    }
  };

  useEffect(() => {
    const applyTokens = (tokens) => {
      if (tokens?.access) {
        try {
          const decoded = jwtDecode(tokens.access);
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            if (import.meta.env.DEV) console.warn('[AuthContext] Access token expired on init');
            setUser(null);
            delete apiClient.defaults.headers.common['Authorization'];
            return;
          }
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
          setUser(decoded);
          if (import.meta.env.DEV) {
            const expIso = decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'n/a';
            console.debug('[AuthContext] Token applied. Expires at:', expIso);
          }
        } catch (e) {
          console.warn('[AuthContext] Failed to decode access token', e);
          setUser(null);
          delete apiClient.defaults.headers.common['Authorization'];
        }
      } else {
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
    };
    applyTokens(authTokens);
    setLoading(false);
  }, [authTokens]);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === 'authTokens') {
        const v = e.newValue ? JSON.parse(e.newValue) : null;
        setAuthTokens(v);
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const contextData = { user, authTokens, login, logout, setNewPassword, loading };

  return (
    <AuthContext.Provider value={contextData}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};