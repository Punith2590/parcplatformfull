// frontend/api.js

import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

// Allow fallback if env var missing
const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const apiClient = axios.create({
  baseURL: API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL,
  timeout: 15000,
});

let isRefreshing = false;
let refreshQueue = [];

function processQueue(error, token = null) {
  refreshQueue.forEach((p) => {
    if (error) p.reject(error); else p.resolve(token);
  });
  refreshQueue = [];
}

function getStoredTokens() {
  const raw = localStorage.getItem('authTokens');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function storeTokens(tokens) {
  localStorage.setItem('authTokens', JSON.stringify(tokens));
}

async function attemptRefresh() {
  const tokens = getStoredTokens();
  if (!tokens?.refresh) throw new Error('No refresh token');
  const response = await axios.post(
    (API_URL.endsWith('/') ? API_URL : API_URL + '/') + 'token/refresh/',
    { refresh: tokens.refresh }
  );
  const newTokens = { ...tokens, access: response.data.access };
  storeTokens(newTokens);
  try { window.dispatchEvent(new CustomEvent('authTokensUpdated')); } catch {/* no-op */}
  return newTokens.access;
}

// Request interceptor: attach access token & sanity check
apiClient.interceptors.request.use(
  (config) => {
    const tokens = getStoredTokens();
    if (tokens?.access) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${tokens.access}`;
      if (import.meta.env.DEV) {
        try {
          const decoded = jwtDecode(tokens.access);
          const type = decoded?.token_type;
          if (type && type !== 'access') {
            console.warn('[api][request] token_type != access (got', type, ')');
          }
        } catch (e) {
          console.warn('[api][request] Failed to decode access token prior to request');
        }
      }
    } else if (import.meta.env.DEV) {
      console.debug('[api][request] No access token present');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto refresh on specific 401 cases
apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const originalRequest = error.config;
    const status = error?.response?.status;
    const detail = error?.response?.data;
    if (status === 401) {
      const code = detail?.code;
      if (import.meta.env.DEV) {
        console.warn('[api] 401 response for', originalRequest?.url, 'detail:', detail);
      }
      // Avoid infinite loop
      if (!originalRequest._retry && (code === 'token_not_valid' || code === 'user_inactive' || code === 'token_expired' || code === 'authentication_failed')) {
        originalRequest._retry = true;
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          })
            .then((newAccess) => {
              originalRequest.headers.Authorization = 'Bearer ' + newAccess;
              return apiClient(originalRequest);
            });
        }
        isRefreshing = true;
        try {
          const newAccess = await attemptRefresh();
          processQueue(null, newAccess);
          isRefreshing = false;
          originalRequest.headers.Authorization = 'Bearer ' + newAccess;
          return apiClient(originalRequest);
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          if (import.meta.env.DEV) console.warn('[api] Refresh failed, clearing tokens');
          localStorage.removeItem('authTokens');
          // Hard reload to force login screen (optional; could dispatch event instead)
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;