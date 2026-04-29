import { useState, useEffect, useCallback } from 'react';
import { 
  getUser, 
  isLoggedIn as checkLoggedIn, 
  isAdmin as checkAdmin, 
  verifyTokenWithBackend, 
  saveTokenFromURL,
  logout as authLogout 
} from '../utils/googleAuth.js';

/**
 * useAuth Hook
 * Manages authentication state with automatic token verification
 * 
 * Returns:
 * - user: Current user object { email, name, picture, role } or null
 * - isLoggedIn: Boolean indicating if user is authenticated
 * - isAdmin: Boolean indicating if user has admin role
 * - isReader: Boolean indicating if user has reader role
 * - loading: Boolean indicating if auth state is being verified
 * - logout: Function to logout user
 * - refreshUser: Function to manually refresh user state
 */
export function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for token in URL and verify on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, check if there's a token in the URL (OAuth redirect)
        const urlResult = saveTokenFromURL();
        
        if (urlResult.error) {
          setError(urlResult.error);
        }

        // Check if user is logged in
        if (checkLoggedIn()) {
          // Get user from token
          const userData = getUser();
          setUser(userData);

          // Verify with backend in background
          const verification = await verifyTokenWithBackend();
          if (!verification.valid) {
            setUser(null);
            setError(verification.error);
          } else if (verification.user) {
            // Update with fresh data from server
            setUser(verification.user);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError('Failed to initialize authentication');
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Logout function
  const logout = useCallback(() => {
    authLogout();
    setUser(null);
    setError(null);
  }, []);

  // Refresh user data
  const refreshUser = useCallback(async () => {
    if (!checkLoggedIn()) {
      setUser(null);
      return;
    }

    setLoading(true);
    try {
      const verification = await verifyTokenWithBackend();
      if (verification.valid && verification.user) {
        setUser(verification.user);
        setError(null);
      } else {
        setUser(null);
        setError(verification.error || 'Session expired');
      }
    } catch (err) {
      console.error('Refresh user error:', err);
      setError('Failed to refresh user data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Computed properties
  const normalizedRole = String(user?.role || '').toLowerCase();
  const isLoggedIn = !!user;
  const isAdmin = normalizedRole === 'admin' || normalizedRole === 'super_admin' || normalizedRole === 'superadmin';
  const isReader = normalizedRole === 'reader' || normalizedRole === 'subscriber';

  return {
    user,
    isLoggedIn,
    isAdmin,
    isReader,
    loading,
    error,
    logout,
    refreshUser,
  };
}

export default useAuth;
