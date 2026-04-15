import axios from 'axios';
import { AUTH_TOKEN_KEY, SESSION_STORAGE_KEY } from '../utils/app';

const BASE = import.meta.env.VITE_API_BASE_URL || 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

const api = axios.create({
  baseURL: BASE,
  withCredentials: true,
});

// Request interceptor to attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect on unauthorized
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.location.href = '/#/staff-login';
    }
    return Promise.reject(error);
  }
);

export default api;
