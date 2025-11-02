// frontend/context/AuthContext.jsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import apiClient from '../api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [authTokens, setAuthTokens] = useState(() => 
    localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
  );
  
  const [user, setUser] = useState(null); // <-- Start as null, let useEffect populate
  
  const [loading, setLoading] = useState(true); // Start as true

  const login = async (username, password) => {
    try {
      const response = await apiClient.post('/token/', { username, password });
      const data = response.data;
      localStorage.setItem('authTokens', JSON.stringify(data));
      
      // --- THIS IS THE FIX ---
      // We ONLY set the tokens. The useEffect will handle setting the user
      // and the api header. This prevents the race condition.
      setAuthTokens(data);
      // setUser(jwtDecode(data.access)); // <-- REMOVE THIS LINE
      // --- END FIX ---

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
    // Force redirect to login
    window.location.href = '/login';
  };

  const setNewPassword = async (password) => {
    try {
      await apiClient.post('/auth/set-password/', { password });
      // We call logout() which will handle clearing state and redirecting
      logout();
      return { success: true, message: 'Password updated successfully! Please log in again.' };
    } catch (error) {
      console.error('Password change failed:', error?.response?.data || error.message);
      throw new Error('Failed to set new password.');
    }
  };

  // This useEffect is now the SINGLE SOURCE OF TRUTH for setting user and API headers.
  // It runs on initial load AND after login (when authTokens changes).
  useEffect(() => {
    const applyTokens = (tokens) => {
      if (tokens?.access) {
        try {
          const decoded = jwtDecode(tokens.access);
          // Check for token expiry
          if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            if (import.meta.env.DEV) console.warn('[AuthContext] Access token expired on init');
            setUser(null);
            delete apiClient.defaults.headers.common['Authorization'];
            return;
          }
          // --- THIS IS THE CRITICAL ORDER ---
          // 1. Set the header for all future requests
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${tokens.access}`;
          // 2. Set the user object
          setUser(decoded);
          // ---
          
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
        // No tokens, ensure user is null and header is clear
        setUser(null);
        delete apiClient.defaults.headers.common['Authorization'];
      }
    };
    
    applyTokens(authTokens);
    setLoading(false); // Finished loading
  }, [authTokens]); // This effect runs when authTokens change (i.e., on login)

  // This effect is fine, no changes needed.
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