export type UserRole = 'READER' | 'EDITOR' | 'ADMIN' | 'SUPER_ADMIN';

export const ADMIN_ROLES: UserRole[] = ['ADMIN', 'SUPER_ADMIN'];
export const STAFF_ROLES: UserRole[] = ['EDITOR', 'ADMIN', 'SUPER_ADMIN'];
