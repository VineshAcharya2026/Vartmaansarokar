export const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'EDITOR'] as const;
export type StaffRole = typeof STAFF_ROLES[number];

export function isStaffRole(role: string | undefined | null): role is StaffRole {
  return STAFF_ROLES.includes(String(role || '').trim().toUpperCase() as StaffRole);
}
