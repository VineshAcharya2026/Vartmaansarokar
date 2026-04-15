/**
 * Staff Authentication Utility
 * Handles email/password login for admin/editor/superadmin roles
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

// Token storage key
const STAFF_TOKEN_KEY = 'vartmaan-auth-token';

/**
 * Staff login with email and password
 * @param {string} email - Staff email
 * @param {string} password - Staff password
 * @returns {Promise<{success: boolean, token?: string, user?: object, error?: string}>}
 */
export async function staffLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/staff/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.error || 'Login failed' };
    }

    if (data.token) {
      localStorage.setItem(STAFF_TOKEN_KEY, data.token);
      return { success: true, token: data.token, user: data.user };
    }

    return { success: false, error: 'Invalid response from server' };
  } catch (error) {
    console.error('Staff login error:', error);
    return { success: false, error: 'Network error. Please check your connection.' };
  }
}

/**
 * Get the stored staff token from localStorage
 */
export function getStaffToken() {
  return localStorage.getItem(STAFF_TOKEN_KEY);
}

/**
 * Decode JWT payload without verification
 * @returns {object|null} Decoded payload or null if invalid
 */
export function decodeStaffToken(token) {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    // Base64Url decode
    const base64 = parts[1]
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(parts[1].length + (4 - (parts[1].length % 4)) % 4, '=');

    const json = atob(base64);
    return JSON.parse(json);
  } catch (e) {
    console.error('Failed to decode token:', e);
    return null;
  }
}

/**
 * Get current staff user from stored token
 * @returns {object|null} User object with email, name, role
 */
export function getStaffUser() {
  const token = getStaffToken();
  if (!token) return null;

  const payload = decodeStaffToken(token);
  if (!payload) return null;

  return {
    email: payload.email,
    name: payload.name,
    role: payload.role,
    id: payload.sub,
  };
}

/**
 * Check if staff is logged in
 * @returns {boolean}
 */
export function isStaffLoggedIn() {
  const token = getStaffToken();
  if (!token) return false;

  const payload = decodeStaffToken(token);
  if (!payload) return false;

  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    staffLogout();
    return false;
  }

  return true;
}

/**
 * Check if current staff is admin (includes superadmin)
 * @returns {boolean}
 */
export function isStaffAdmin() {
  const user = getStaffUser();
  return user?.role === 'admin' || user?.role === 'superadmin';
}

/**
 * Check if current staff is superadmin
 * @returns {boolean}
 */
export function isStaffSuperAdmin() {
  const user = getStaffUser();
  return user?.role === 'superadmin';
}

/**
 * Check if current staff is editor
 * @returns {boolean}
 */
export function isStaffEditor() {
  const user = getStaffUser();
  return user?.role === 'editor';
}

/**
 * Check if staff has access to admin panel
 * Admin, Superadmin, and Editor roles have access
 * @returns {boolean}
 */
export function hasAdminAccess() {
  const user = getStaffUser();
  return ['admin', 'superadmin', 'editor'].includes(user?.role);
}

/**
 * Verify staff token with backend
 * @returns {Promise<{valid: boolean, user?: object, error?: string}>}
 */
export async function verifyStaffTokenWithBackend() {
  const token = getStaffToken();
  if (!token) return { valid: false, error: 'No token' };

  try {
    const response = await fetch(`${API_BASE}/api/auth/staff/verify`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!data.valid) {
      staffLogout();
      return { valid: false, error: data.error };
    }

    return { valid: true, user: data.user };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false, error: 'Network error' };
  }
}

/**
 * Staff logout - remove token from localStorage
 */
export function staffLogout() {
  localStorage.removeItem(STAFF_TOKEN_KEY);
}

/**
 * Get authorization header for API requests
 * @returns {object} Headers object with Authorization
 */
export function getStaffAuthHeaders() {
  const token = getStaffToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Request password reset (for future implementation)
 * @param {string} email - Staff email
 */
export async function requestPasswordReset(email) {
  try {
    const response = await fetch(`${API_BASE}/api/auth/staff/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    const data = await response.json();
    return { success: response.ok, message: data.message, error: data.error };
  } catch (error) {
    console.error('Password reset request error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Export all functions as default object
export default {
  staffLogin,
  getStaffToken,
  decodeStaffToken,
  getStaffUser,
  isStaffLoggedIn,
  isStaffAdmin,
  isStaffSuperAdmin,
  isStaffEditor,
  hasAdminAccess,
  verifyStaffTokenWithBackend,
  staffLogout,
  getStaffAuthHeaders,
  requestPasswordReset,
};
