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
  const normalizedPath = String(url).replace(/\\/g, '/').trim();
  if (!normalizedPath) return '';
  if (/^https?:\/\//i.test(normalizedPath)) return encodeURI(normalizedPath);

  // Recover from legacy absolute filesystem paths by extracting /uploads/* segment.
  const lower = normalizedPath.toLowerCase();
  const uploadsPos = lower.lastIndexOf('/uploads/');
  const apiUploadsPos = lower.lastIndexOf('/api/uploads/');

  let safePath = normalizedPath;
  if (apiUploadsPos >= 0) {
    safePath = normalizedPath.slice(apiUploadsPos);
  } else if (uploadsPos >= 0) {
    safePath = normalizedPath.slice(uploadsPos);
  } else if (/^[a-zA-Z]:\//.test(normalizedPath)) {
    // Absolute local path without uploads segment; fall back to filename under uploads.
    const filename = normalizedPath.split('/').pop() || '';
    safePath = filename ? `/uploads/${filename}` : '/uploads/';
  } else if (!normalizedPath.startsWith('/')) {
    const looksLikeFilename = /^[^/]+\.[a-z0-9]{2,8}$/i.test(normalizedPath);
    safePath = looksLikeFilename ? `/uploads/${normalizedPath}` : `/${normalizedPath}`;
  }

  const base = (API_BASE || '').replace(/\/api\/?$/i, '');
  return encodeURI(`${base}${safePath}`);
}

export function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, index);
  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

/** Google reCAPTCHA v2 site key (Vite exposes `VITE_*` to the client). */
export const RECAPTCHA_SITE_KEY = (import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined)?.trim() ?? '';

/** Payment details shown in subscription popup (public, non-secret). */
export const PUBLIC_UPI_ID = (import.meta.env.VITE_PUBLIC_UPI_ID as string | undefined)?.trim() ?? '';
export const PUBLIC_BANK_NAME = (import.meta.env.VITE_PUBLIC_BANK_NAME as string | undefined)?.trim() ?? '';
export const PUBLIC_BANK_ACCOUNT = (import.meta.env.VITE_PUBLIC_BANK_ACCOUNT as string | undefined)?.trim() ?? '';
export const PUBLIC_BANK_IFSC = (import.meta.env.VITE_PUBLIC_BANK_IFSC as string | undefined)?.trim() ?? '';
