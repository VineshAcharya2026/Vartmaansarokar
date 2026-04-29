import React from 'react';
import { handleGoogleLogin, logout, getUser, isLoggedIn, isAdmin } from '../utils/googleAuth.js';

/**
 * LoginButton Component
 * Displays Google login button or user profile with logout
 * Uses Tailwind CSS for styling
 */
export function LoginButton({ onLogin, onLogout }) {
  const user = getUser();
  const loggedIn = isLoggedIn();
  const admin = isAdmin();

  const handleLogin = () => {
    handleGoogleLogin();
    if (onLogin) onLogin();
  };

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    // Refresh page to update auth state
    window.location.reload();
  };

  // If not logged in, show Google login button
  if (!loggedIn) {
    return (
      <button
        onClick={handleLogin}
        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 hover:shadow-md transition-all duration-200 font-medium"
      >
        {/* Google Icon SVG */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        Sign in with Google
      </button>
    );
  }

  // If logged in, show user profile with logout
  return (
    <div className="flex items-center gap-3">
      {/* User Avatar */}
      {user?.picture ? (
        <img
          src={user.picture}
          alt={user.name}
          className="w-8 h-8 rounded-full border border-gray-200"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
          {user?.name?.charAt(0)?.toUpperCase() || 'U'}
        </div>
      )}

      {/* User Info */}
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 leading-tight">
          {user?.name}
        </span>
        <span className="text-xs text-gray-500 leading-tight">
          {admin ? 'Admin' : 'Reader'}
        </span>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="ml-2 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
      >
        Logout
      </button>
    </div>
  );
}

export default LoginButton;
