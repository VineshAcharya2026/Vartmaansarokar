import type { StaffRole } from '../auth/roles';

export function getStaffHomePath(role: StaffRole | string): string {
  const r = String(role || '').toUpperCase();
  if (r === 'EDITOR') return '/admin?tab=news';
  if (r === 'ADMIN' || r === 'SUPER_ADMIN') return '/admin?tab=approvals';
  return '/admin';
}

export function resolveStaffRedirectTarget(
  role: StaffRole | string,
  fromState?: { pathname?: string; search?: string }
): string {
  const fromPath = fromState?.pathname;
  const fromSearch = typeof fromState?.search === 'string' ? fromState.search : '';
  if (typeof fromPath === 'string' && fromPath.startsWith('/admin')) {
    return `${fromPath}${fromSearch}`;
  }
  return getStaffHomePath(role);
}
