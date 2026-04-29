import api from '../lib/api';
import { AUTH_TOKEN_KEY, SESSION_STORAGE_KEY } from '../utils/app';

export const authService = {
  login: async (email: string, password?: string) => {
    const { data } = await api.post('/api/auth/login', { email, password });
    const d = data as { token: string; user: unknown };
    if (d.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, d.token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(d.user));
    }
    return d;
  },

  loginWithGoogle: async (credential: string) => {
    const { data } = await api.post('/api/auth/google', { credential });
    const d = data as { token: string; user: unknown };
    if (d.token) {
      localStorage.setItem(AUTH_TOKEN_KEY, d.token);
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(d.user));
    }
    return d;
  },

  register: async (formData: unknown) => {
    const { data } = await api.post('/api/auth/register', formData);
    return data;
  },

  getMe: async () => {
    const { data } = await api.get('/api/auth/me');
    return (data as { user: unknown }).user;
  },

  logout: () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  }
};
