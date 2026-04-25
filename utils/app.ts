function normalizeBaseUrl(value: string | undefined) {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

const ENV = import.meta.env as Record<string, string | undefined>;

/** Worker / API origin only (no `/api` suffix). Set `VITE_API_BASE_URL` for every environment. */
function getApiBaseUrl(): string {
  const v = ENV.VITE_API_BASE_URL ?? ENV.VITE_API_BASE;
  if (v) return normalizeBaseUrl(v);
  if (import.meta.env.DEV) return normalizeBaseUrl('http://localhost:5174');
  return '';
}

export const API_BASE = getApiBaseUrl();
export const APP_BASE = import.meta.env.BASE_URL || '/';
export const SESSION_STORAGE_KEY = 'vartmaan-current-user';
export const AUTH_TOKEN_KEY = 'token';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
export const STAFF_LOGIN_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD ?? '';
export const STAFF_LOGIN_EMAILS = {
  superAdmin: import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? 'superadmin@cms.com',
  admin: import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@cms.com',
  editor: import.meta.env.VITE_EDITOR_EMAIL ?? 'editor@cms.com'
} as const;

export function buildCategorySlug(category: string) {
  return category.trim().toLowerCase().replace(/\s+/g, '-');
}

export function categoryFromSlug(slug: string) {
  return slug
    .split('-')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function formatCurrencyINR(value: number | undefined | null) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

export function getAuthToken() {
  return window.localStorage.getItem(AUTH_TOKEN_KEY) || '';
}

export function getAuthHeaders(): Record<string, string> {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function resolveAssetUrl(url: string) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_BASE || '';
  if (url.startsWith('/')) return `${base}${url}`;
  return `${base}/${url}`;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
