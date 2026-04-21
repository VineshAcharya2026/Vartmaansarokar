import type { Context } from 'hono';

/** Uniform API envelope for Cloudflare Worker (and aligned frontend expectations). */
export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export function ok<T>(c: Context, data: T, status = 200) {
  return c.json({ success: true, data, error: null } as ApiEnvelope<T>, status);
}

export function fail(c: Context, error: string, status = 400) {
  return c.json({ success: false, data: null, error } as ApiEnvelope<null>, status);
}
