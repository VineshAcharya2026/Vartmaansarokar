/**
 * Google reCAPTCHA v2 checkbox (or v3) siteverify helper.
 */

export type RecaptchaVerifyResult = { ok: true } | { ok: false; reason: string };

export async function verifyRecaptchaToken(token: string | undefined): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      return { ok: false, reason: 'reCAPTCHA is not configured on the server.' };
    }
    return { ok: true };
  }
  if (!token || !String(token).trim()) {
    return { ok: false, reason: 'reCAPTCHA token is required.' };
  }

  try {
    const body = new URLSearchParams();
    body.set('secret', secret);
    body.set('response', String(token).trim());

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!res.ok) {
      return { ok: false, reason: 'reCAPTCHA verification request failed.' };
    }

    const data = (await res.json()) as { success?: boolean; score?: number; 'error-codes'?: string[] };

    if (data.success !== true) {
      const codes = Array.isArray(data['error-codes']) ? data['error-codes'].join(', ') : 'unknown';
      return { ok: false, reason: `reCAPTCHA rejected: ${codes}` };
    }

    if (typeof data.score === 'number' && data.score < 0.5) {
      return { ok: false, reason: 'reCAPTCHA score too low.' };
    }

    return { ok: true };
  } catch {
    return { ok: false, reason: 'reCAPTCHA verification error.' };
  }
}
