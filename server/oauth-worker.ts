/**
 * Google OAuth 2.0 Implementation for Cloudflare Workers
 * Handles login, callback, token verification, and logout
 * Uses Web Crypto API for JWT signing (no external dependencies)
 */

import { signJWT, verifyJWT, JWTPayload } from './jwt-crypto.js';

// ============================================
// CONFIGURATION
// ============================================

/**
 * Admin emails - hardcoded in the worker
 * These users get the "admin" role, all others get "reader"
 */
const ADMIN_EMAILS: string[] = [
  'vineshjm@gmail.com',
  'admin@vartmaansarokar.com',
  // Add more admin emails here
];

/**
 * Check if an email has admin privileges
 */
function isAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

/**
 * CORS headers for all responses
 */
function getCorsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': origin || 'https://vartmaansarokar.pages.dev',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json'
  };
}

/**
 * Error response helper
 */
function errorResponse(message: string, status: number = 400, origin: string = ''): Response {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    {
      status,
      headers: getCorsHeaders(origin)
    }
  );
}

/**
 * Success response helper
 */
function successResponse(data: Record<string, unknown>, origin: string = ''): Response {
  return new Response(
    JSON.stringify({ success: true, ...data }),
    {
      status: 200,
      headers: getCorsHeaders(origin)
    }
  );
}

// ============================================
// GOOGLE OAUTH FLOW
// ============================================

/**
 * Route 1: GET /api/auth/google/login
 * Redirects user to Google OAuth consent screen
 */
async function handleGoogleLogin(env: Env, request: Request): Promise<Response> {
  const origin = request.headers.get('Origin') || 'https://vartmaansarokar.pages.dev';
  
  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID,
    redirect_uri: 'https://vartmaan-sarokaar-api.vineshjm.workers.dev/api/auth/google/callback',
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent',
    state: crypto.randomUUID(), // CSRF protection
  });
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  
  // Redirect to Google
  return new Response(null, {
    status: 302,
    headers: {
      'Location': authUrl,
      'Access-Control-Allow-Origin': origin,
    }
  });
}

/**
 * Route 2: GET /api/auth/google/callback
 * Handles Google OAuth callback, exchanges code for token
 */
async function handleGoogleCallback(env: Env, request: Request): Promise<Response> {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  
  // Handle OAuth errors from Google
  if (error) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://vartmaansarokar.pages.dev/?error=${encodeURIComponent(error)}`,
      }
    });
  }
  
  if (!code) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://vartmaansarokar.pages.dev/?error=no_code',
      }
    });
  }
  
  try {
    // Step 1: Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: 'https://vartmaan-sarokaar-api.vineshjm.workers.dev/api/auth/google/callback',
        grant_type: 'authorization_code',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error('Token exchange failed:', errorData);
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://vartmaansarokar.pages.dev/?error=token_exchange_failed',
        }
      });
    }
    
    const tokenData = await tokenResponse.json() as { access_token: string };
    
    // Step 2: Fetch user info from Google
    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
      },
    });
    
    if (!userInfoResponse.ok) {
      return new Response(null, {
        status: 302,
        headers: {
          'Location': 'https://vartmaansarokar.pages.dev/?error=userinfo_failed',
        }
      });
    }
    
    const userInfo = await userInfoResponse.json() as {
      email: string;
      name: string;
      picture: string;
    };
    
    // Step 3: Determine role
    const role = isAdmin(userInfo.email) ? 'admin' : 'reader';
    
    // Step 4: Generate JWT
    const token = await signJWT(
      {
        email: userInfo.email,
        name: userInfo.name,
        picture: userInfo.picture,
        role,
      },
      env.JWT_SECRET
    );
    
    // Step 5: Redirect to frontend with token
    const redirectPath = role === 'admin' ? '/admin' : '/';
    const redirectUrl = `https://vartmaansarokar.pages.dev${redirectPath}?token=${encodeURIComponent(token)}`;
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-store',
      }
    });
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return new Response(null, {
      status: 302,
      headers: {
        'Location': 'https://vartmaansarokar.pages.dev/?error=oauth_failed',
      }
    });
  }
}

/**
 * Route 3: GET /api/auth/verify
 * Verifies JWT token from Authorization header
 */
async function handleVerifyToken(env: Env, request: Request): Promise<Response> {
  const origin = request.headers.get('Origin') || 'https://vartmaansarokar.pages.dev';
  
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return errorResponse('Missing or invalid Authorization header', 401, origin);
  }
  
  const token = authHeader.slice(7);
  
  try {
    const payload = await verifyJWT(token, env.JWT_SECRET);
    
    if (!payload) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired token' }),
        { status: 401, headers: getCorsHeaders(origin) }
      );
    }
    
    return new Response(
      JSON.stringify({
        valid: true,
        user: {
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          role: payload.role,
        }
      }),
      { status: 200, headers: getCorsHeaders(origin) }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: 'Token verification failed' }),
      { status: 401, headers: getCorsHeaders(origin) }
    );
  }
}

/**
 * Route 4: GET /api/auth/logout
 * Handles logout (frontend removes token from localStorage)
 */
async function handleLogout(env: Env, request: Request): Promise<Response> {
  const origin = request.headers.get('Origin') || 'https://vartmaansarokar.pages.dev';
  
  return successResponse({ message: 'Logged out successfully' }, origin);
}

// ============================================
// MAIN ROUTER
// ============================================

/**
 * Environment interface
 */
export interface Env {
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  JWT_SECRET: string;
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const origin = request.headers.get('Origin') || 'https://vartmaansarokar.pages.dev';
    
    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: getCorsHeaders(origin)
      });
    }
    
    // Route matching
    try {
      if (path === '/api/auth/google/login' && method === 'GET') {
        return await handleGoogleLogin(env, request);
      }
      
      if (path === '/api/auth/google/callback' && method === 'GET') {
        return await handleGoogleCallback(env, request);
      }
      
      if (path === '/api/auth/verify' && method === 'GET') {
        return await handleVerifyToken(env, request);
      }
      
      if (path === '/api/auth/logout' && method === 'GET') {
        return await handleLogout(env, request);
      }
      
      // 404 for unknown routes
      return errorResponse('Not found', 404, origin);
      
    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500, origin);
    }
  }
};
