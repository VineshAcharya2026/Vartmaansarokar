/**
 * Google Authentication Utility
 * Handles OAuth flow, token management, and user session
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'https://api.vartmaansarokaar.com').replace(/\/$/, '');

// Token storage key
const TOKEN_KEY = 'vartmaan-auth-token';

/**
 * Redirect user to Google OAuth login
 */
export function handleGoogleLogin() {
  throw new Error('Redirect-based Google OAuth is not enabled in this deployment.');
}

/**
 * Save token from URL to localStorage and clean URL
 * Call this on app mount to capture OAuth redirect
 */
export function saveTokenFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const error = urlParams.get('error');

  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
    // Remove token from URL without page reload
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('error');
    window.history.replaceState({}, document.title, url.toString());
    return { success: true, error: null };
  }

  if (error) {
    // Clean URL but keep error for handling
    const url = new URL(window.location.href);
    url.searchParams.delete('token');
    url.searchParams.delete('error');
    window.history.replaceState({}, document.title, url.toString());
    return { success: false, error };
  }

  return { success: false, error: null };
}

/**
 * Get the stored token from localStorage
 */
export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Decode JWT payload without verification (for UI display)
 * @returns {object|null} Decoded payload or null if invalid
 */
export function decodeToken(token) {
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
 * Get current user from stored token
 * @returns {object|null} User object with email, name, picture, role
 */
export function getUser() {
  const token = getToken();
  if (!token) return null;
  
  const payload = decodeToken(token);
  if (!payload) return null;
  
  return {
    id: payload.userId,
  };
}

/**
 * Check if user is logged in
 * @returns {boolean}
 */
export function isLoggedIn() {
  const token = getToken();
  if (!token) return false;
  
  const payload = decodeToken(token);
  if (!payload) return false;
  
  // Check if token is expired
  const now = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < now) {
    // Token expired, remove it
    logout();
    return false;
  }
  
  return true;
}

/**
 * Check if current user is admin
 * @returns {boolean}
 */
export function isAdmin() {
  const user = getUser();
  const role = String(user?.role || '').toLowerCase();
  return role === 'admin' || role === 'super_admin' || role === 'superadmin';
}

/**
 * Check if current user is reader
 * @returns {boolean}
 */
export function isReader() {
  const user = getUser();
  const role = String(user?.role || '').toLowerCase();
  return role === 'reader' || role === 'subscriber';
}

/**
 * Verify token with backend (async)
 * Use this to validate token on app mount
 */
export async function verifyTokenWithBackend() {
  const token = getToken();
  if (!token) return { valid: false, error: 'No token' };
  
  try {
    const response = await fetch(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const body = await response.json();
    const user = body?.data?.user;
    
    if (!response.ok || !user) {
      // Token invalid, remove it
      logout();
      return { valid: false, error: body?.error || 'Invalid token' };
    }
    
    return { valid: true, user };
  } catch (error) {
    console.error('Token verification failed:', error);
    return { valid: false, error: 'Network error' };
  }
}

/**
 * Logout - remove token from localStorage
 */
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Get authorization header for API requests
 * @returns {object} Headers object with Authorization
 */
export function getAuthHeaders() {
  const token = getToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Export all functions as default object
export default {
  handleGoogleLogin,
  saveTokenFromURL,
  getToken,
  decodeToken,
  getUser,
  isLoggedIn,
  isAdmin,
  isReader,
  verifyTokenWithBackend,
  logout,
  getAuthHeaders,
};
