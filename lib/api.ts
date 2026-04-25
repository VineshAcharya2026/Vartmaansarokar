import axios, { isAxiosError } from 'axios';
import { API_BASE, AUTH_TOKEN_KEY, SESSION_STORAGE_KEY } from '../utils/app';

const baseURL = API_BASE.replace(/\/$/, '');

const api = axios.create({
  baseURL: baseURL || undefined,
  withCredentials: true
});

/** These POSTs return 401 for wrong credentials; must not clear session or force redirect. */
function isUnauthenticatedAuthPost(config: { method?: string; url?: string } | undefined): boolean {
  if (!config || (config.method || 'get').toLowerCase() !== 'post') return false;
  const raw = (config.url || '').split('?')[0];
  const path = (() => {
    try {
      if (raw.startsWith('http')) return new URL(raw).pathname;
      return raw;
    } catch {
      return raw;
    }
  })();
  return (
    path === '/api/auth/login' ||
    path === '/api/auth/staff/login' ||
    path === '/api/auth/google' ||
    path === '/api/auth/register' ||
    path === '/api/auth/users/login'
  );
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Keep API reads fresh across browser/proxy/CDN layers.
  const method = (config.method || 'get').toLowerCase();
  const isGet = method === 'get';
  const url = String(config.url || '');
  if (isGet && url.includes('/api/')) {
    config.headers['Cache-Control'] = 'no-cache';
    config.headers.Pragma = 'no-cache';
    config.headers.Expires = '0';
    const params = (config.params || {}) as Record<string, unknown>;
    config.params = { ...params, _t: Date.now() };
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
      // Avoid clobbering response.data with undefined (would break clients expecting top-level keys).
      if (body.data !== undefined) {
        response.data = body.data;
      }
    }
    return response;
  },
  (error) => {
    const res = isAxiosError(error) ? error.response : undefined;
    const payload = res?.data as { success?: boolean; error?: string; message?: string } | undefined;
    const fromApi = payload?.error || (typeof payload?.message === 'string' ? payload.message : undefined);

    if (res?.status === 401 && !isUnauthenticatedAuthPost(error.config)) {
      try {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(SESSION_STORAGE_KEY);
        if (typeof window !== 'undefined') {
          const h = window.location.hash || '';
          if (!h.includes('staff-login')) {
            window.location.href = '/#/staff-login';
          }
        }
      } catch {
        /* ignore */
      }
    }

    if (fromApi) {
      return Promise.reject(new Error(fromApi));
    }
    return Promise.reject(error);
  }
);

export default api;
