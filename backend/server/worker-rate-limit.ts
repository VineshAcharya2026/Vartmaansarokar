/** Per-isolate fixed window counter (sufficient for basic login/upload abuse mitigation). */
const buckets = new Map<string, { count: number; windowStart: number }>();

export function rateLimitAllow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    b = { count: 0, windowStart: now };
  }
  b.count += 1;
  buckets.set(key, b);
  return b.count <= max;
}

export function clientKey(c: { req: { header: (n: string) => string | undefined } }): string {
  return c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For')?.split(',')[0]?.trim() || 'unknown';
}
