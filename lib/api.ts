import axios from 'axios';
import { API_BASE, AUTH_TOKEN_KEY, SESSION_STORAGE_KEY } from '../utils/app';

const baseURL = API_BASE.replace(/\/$/, '');

const api = axios.create({
  baseURL,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response.data as { success?: boolean; data?: unknown; error?: string | null } | null;
    if (body && typeof body === 'object' && 'success' in body) {
      if (body.success === false) {
        const b = body as { error?: string; message?: string };
        const err = new Error(b.error || b.message || 'Request failed');
        return Promise.reject(err);
      }
      response.data = body.data;
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(SESSION_STORAGE_KEY);
      window.location.href = '/#/staff-login';
    }
    return Promise.reject(error);
  }
);

export default api;
