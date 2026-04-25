import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/** Uniform API envelope for Cloudflare Worker (and aligned frontend expectations). */
export type ApiEnvelope<T> =
  | { success: true; data: T; error: null }
  | { success: false; data: null; error: string };

export function ok<T>(c: Context, data: T, status: ContentfulStatusCode = 200) {
  c.status(status);
  return c.json({ success: true, data, error: null } as ApiEnvelope<T>);
}

export function fail(c: Context, error: string, status: ContentfulStatusCode = 400) {
  c.status(status);
  return c.json({ success: false, data: null, error } as ApiEnvelope<null>);
}
