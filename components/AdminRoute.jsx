import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';

/**
 * AdminRoute Component
 * Protected route wrapper that only allows admin users
 * Redirects to home if not logged in or not admin
 * 
 * Usage:
 * <Route path="/admin" element={
 *   <AdminRoute>
 *     <AdminDashboard />
 *   </AdminRoute>
 * } />
 */
export function AdminRoute({ children }) {
  const { user, isLoggedIn, isAdmin, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not logged in - redirect to home
  if (!isLoggedIn) {
    return <Navigate to="/?login_required=true" replace />;
  }

  // Logged in but not admin - show access denied
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="text-red-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            You don't have permission to access this page.
          </p>
          <p className="text-sm text-gray-500">
            Logged in as: <span className="font-medium">{user?.email}</span>
          </p>
          <p className="text-sm text-gray-500">
            Role: <span className="font-medium capitalize">{user?.role}</span>
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="mt-6 px-4 py-2 bg-[#800000] text-white rounded-lg hover:bg-[#600000] transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Admin user - render children
  return children;
}

/**
 * ReaderRoute Component
 * Protected route that requires login (any role)
 * Redirects to home if not logged in
 */
export function ReaderRoute({ children }) {
  const { isLoggedIn, loading } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Not logged in - redirect to home
  if (!isLoggedIn) {
    return <Navigate to="/?login_required=true" replace />;
  }

  // Logged in - render children
  return children;
}

export default AdminRoute;
