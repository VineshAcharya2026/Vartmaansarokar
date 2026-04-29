const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

export function normalizeIndianMobile(raw: string): string {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  return digits;
}

export function validateSubscriberName(name: string): { ok: true; value: string } | { ok: false; reason: string } {
  const value = name.trim();
  if (value.length < 2) return { ok: false, reason: 'Name must be at least 2 characters.' };
  if (/\d/.test(value)) return { ok: false, reason: 'Name must not contain numbers.' };
  return { ok: true, value };
}

export function validateEmail(email: string): { ok: true; value: string } | { ok: false; reason: string } {
  const value = email.trim().toLowerCase();
  if (!value || !EMAIL_RE.test(value)) return { ok: false, reason: 'Valid email is required.' };
  return { ok: true, value };
}

export function validateMobile10(raw: string): { ok: true; value: string } | { ok: false; reason: string } {
  const digits = normalizeIndianMobile(raw);
  if (digits.length !== 10) return { ok: false, reason: 'Mobile must be exactly 10 digits (Indian).' };
  return { ok: true, value: digits };
}

export function validatePhysicalAddress(address: string): { ok: true; value: string } | { ok: false; reason: string } {
  const value = address.trim();
  if (value.length < 20) return { ok: false, reason: 'Delivery address must be at least 20 characters.' };
  return { ok: true, value };
}

export const MAX_SUBSCRIPTION_SCREENSHOT_BYTES = 5 * 1024 * 1024;
