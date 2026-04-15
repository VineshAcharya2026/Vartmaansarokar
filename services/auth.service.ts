import api from '../lib/api';
import { AUTH_TOKEN_KEY, SESSION_STORAGE_KEY } from '../utils/app';

export const authService = {
  login: async (email: string, password?: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  loginWithGoogle: async (credential: string) => {
    const { data } = await api.post('/auth/google', { credential });
    if (data.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.user));
    }
    return data;
  },

  register: async (formData: any) => {
    const { data } = await api.post('/auth/register', formData);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};
