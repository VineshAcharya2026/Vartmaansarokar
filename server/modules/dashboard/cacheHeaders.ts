import type { Context } from 'hono';

/**
 * Enforce fresh API responses in browser + edge.
 * Use on dynamic APIs (auth/admin/content) to prevent stale reads.
 */
export function applyNoStoreHeaders(c: Context) {
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
  c.header('Pragma', 'no-cache');
  c.header('Expires', '0');
}
