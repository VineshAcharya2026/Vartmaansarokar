function normalizeBaseUrl(value: string | undefined) {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

const ENV = import.meta.env as Record<string, string | undefined>;

/**
 * Public API origin (no `/api` suffix). Override with `VITE_API_BASE_URL` in `.env` / CI build.
 * Fallback matches production Worker — avoids login calls hitting the static host when env is missing.
 */
const PRODUCTION_API_BASE_DEFAULT = 'https://api.vartmaansarokaar.com';

function getApiBaseUrl(): string {
  const v = ENV.VITE_API_BASE_URL ?? ENV.VITE_API_BASE;
  if (v) return normalizeBaseUrl(v);
  // Dev + no explicit base: same-origin `/api/*` so Vite proxy can reach Express or `wrangler dev` (D1).
  if (import.meta.env.DEV) return '';
  return PRODUCTION_API_BASE_DEFAULT;
}

export const API_BASE = getApiBaseUrl();
export const APP_BASE = import.meta.env.BASE_URL || '/';
export const SESSION_STORAGE_KEY = 'vartmaan-current-user';
export const AUTH_TOKEN_KEY = 'token';
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '';

/**
 * Public staff *email* hints only (for UX). Never ship real passwords: auth is `STAFF_PASSWORD` on the Worker.
 * Local dev may set `VITE_DEV_STAFF_DEMO` in `.env.local` (not committed) to prefill a shared test password.
 */
export const STAFF_DEV_DEMO_PASSWORD =
  import.meta.env.DEV && (import.meta.env.VITE_DEV_STAFF_DEMO as string | undefined)
    ? String(import.meta.env.VITE_DEV_STAFF_DEMO)
    : '';

/** Default to canonical DB seed domain; @vartmaansarokaar.com still works via server email variants. */
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
