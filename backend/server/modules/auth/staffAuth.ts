import * as bcrypt from 'bcryptjs';

const STAFF_DOMAIN_OKAR = 'vartmaansarokar.com';
const STAFF_DOMAIN_OKAAR = 'vartmaansarokaar.com';

export type StaffRole = 'SUPER_ADMIN' | 'ADMIN' | 'EDITOR';

/** Public site / DNS use `vartmaansarokaar.com`; some seeds use `vartmaansarokar.com` — same mailboxes. */
export function staffLoginEmailVariants(email: string): string[] {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf('@');
  if (at < 1) return [e];
  const local = e.slice(0, at);
  const domain = e.slice(at + 1);
  if (domain === STAFF_DOMAIN_OKAR || domain === STAFF_DOMAIN_OKAAR) {
    return [...new Set([`${local}@${STAFF_DOMAIN_OKAR}`, `${local}@${STAFF_DOMAIN_OKAAR}`])];
  }
  return [e];
}

/** Single canonical row domain for new staff bootstrap inserts. */
export function canonicalStaffLoginEmail(email: string): string {
  const e = email.trim().toLowerCase();
  return e.replace(new RegExp(`@${STAFF_DOMAIN_OKAAR}$`), `@${STAFF_DOMAIN_OKAR}`);
}

/**
 * D1 first-login bootstrap with Worker secret STAFF_PASSWORD only.
 * Also used to assign/elevate roles for allowlisted emails.
 */
export function bootstrapStaffRole(email: string): StaffRole | null {
  const e = canonicalStaffLoginEmail(email);
  if (e === 'superadmin@vartmaansarokar.com') return 'SUPER_ADMIN';
  if (e === 'admin@vartmaansarokar.com') return 'ADMIN';
  if (e === 'editor@vartmaansarokar.com') return 'EDITOR';
  if (e === 'vineshjm@gmail.com') return 'SUPER_ADMIN';
  return null;
}

/** Canonical staff rows: password hash matches Worker secret STAFF_PASSWORD. */
const STAFF_SEED_ROWS = [
  { id: 'seed-staff-superadmin', email: 'superadmin@vartmaansarokar.com', name: 'Super Admin', role: 'SUPER_ADMIN' },
  { id: 'seed-staff-admin', email: 'admin@vartmaansarokar.com', name: 'Admin', role: 'ADMIN' },
  { id: 'seed-staff-editor', email: 'editor@vartmaansarokar.com', name: 'Editor', role: 'EDITOR' }
] as const;

let staffSeedAppliedForPassword = '';

export async function ensureStaffSeedAccounts(db: D1Database, staffPassword: string | undefined): Promise<void> {
  if (!staffPassword) return;
  if (staffSeedAppliedForPassword === staffPassword) return;

  const ph = STAFF_SEED_ROWS.map(() => '?').join(', ');
  const existing = await db
    .prepare(`SELECT email, password_hash, role FROM users WHERE email IN (${ph})`)
    .bind(...STAFF_SEED_ROWS.map((r) => r.email))
    .all();
  const byEmail = new Map(
    (existing.results as { email: string; password_hash: string | null; role: string }[])?.map((r) => [r.email, r]) || []
  );
  const staffSeeded =
    STAFF_SEED_ROWS.every((spec) => {
      const row = byEmail.get(spec.email);
      return row && row.password_hash && String(row.role).trim() !== '' && String(row.role).toUpperCase() !== 'READER';
    }) && byEmail.size === STAFF_SEED_ROWS.length;
  if (staffSeeded) {
    staffSeedAppliedForPassword = staffPassword;
    return;
  }

  const hash = await bcrypt.hash(staffPassword, 10);
  for (const row of STAFF_SEED_ROWS) {
    await db
      .prepare(
        `INSERT INTO users (id, email, name, role, password_hash, is_verified)
         VALUES (?, ?, ?, ?, ?, 1)
         ON CONFLICT(email) DO UPDATE SET
           password_hash = COALESCE(users.password_hash, excluded.password_hash),
           role = CASE WHEN users.role = 'READER' THEN excluded.role ELSE users.role END,
           name = CASE WHEN TRIM(COALESCE(users.name, '')) = '' THEN excluded.name ELSE users.name END,
           is_verified = 1`
      )
      .bind(row.id, row.email, row.name, row.role, hash)
      .run();
  }
  staffSeedAppliedForPassword = staffPassword;
}
