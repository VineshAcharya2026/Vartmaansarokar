function normalizeBaseUrl(value: string | undefined) {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

const ENV = import.meta.env as Record<string, string | undefined>;

// Production API URL (update after deploying Workers)
const PRODUCTION_API_URL = 'https://vartmaan-sarokaar-api.your-subdomain.workers.dev';

// Determine API base URL
function getApiBaseUrl(): string {
  // If explicitly set, use it
  if (ENV.VITE_API_BASE_URL || ENV.VITE_API_BASE) {
    return normalizeBaseUrl(ENV.VITE_API_BASE_URL ?? ENV.VITE_API_BASE);
  }
  
  // In production, use the deployed Workers URL
  // Update this after deploying your Workers
  if (ENV.NODE_ENV === 'production' || ENV.PROD) {
    return PRODUCTION_API_URL;
  }
  
  // Development fallback
  return '';
}

export const API_BASE = getApiBaseUrl();
export const APP_BASE = import.meta.env.BASE_URL || '/';
export const SESSION_STORAGE_KEY = 'vartmaan-current-user';
export const AUTH_TOKEN_KEY = 'vartmaan-auth-token';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';
export const STAFF_LOGIN_PASSWORD = import.meta.env.VITE_STAFF_PASSWORD ?? 'PassworD@2026';
export const STAFF_LOGIN_EMAILS = {
  superAdmin: import.meta.env.VITE_SUPER_ADMIN_EMAIL ?? 'superadmin@vartmaansarokar.com',
  admin: import.meta.env.VITE_ADMIN_EMAIL ?? 'admin@vartmaansarokar.com',
  editor: import.meta.env.VITE_EDITOR_EMAIL ?? 'editor@vartmaansarokar.com'
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

export function formatCurrencyINR(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value);
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
  if (url.startsWith('/')) return `${API_BASE}${url}`;
  return `${API_BASE}/${url}`;
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}
