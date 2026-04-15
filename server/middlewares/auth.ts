import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sharedStore as store, UserRecord } from '../store.js';
import { UserRole } from '../../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

const ROLE_RANK: Record<UserRole, number> = {
  [UserRole.READER]: 0,
  [UserRole.SUBSCRIBER]: 0,
  [UserRole.EDITOR]: 1,
  [UserRole.ADMIN]: 2,
  [UserRole.SUPER_ADMIN]: 3
};

/**
 * Extract a bearer token from:
 *   1. Authorization: Bearer <token> header
 *   2. auth_token httpOnly cookie (for browser-side flows)
 */
function extractToken(req: Request): string {
  const authorization = req.headers.authorization ?? '';
  if (authorization.startsWith('Bearer ')) {
    return authorization.slice(7).trim();
  }
  // Fallback: httpOnly cookie
  const cookies = (req as any).cookies as Record<string, string> | undefined;
  if (cookies?.auth_token) {
    return cookies.auth_token;
  }
  return '';
}

/**
 * requireAuth: verify JWT, attach user to req.user.
 * Reads from Authorization header OR auth_token cookie.
 */
export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const token = extractToken(req);

  if (!token) {
    res.status(401).json({ success: false, message: 'Authentication required.', error: 'Missing bearer token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!payload.userId) {
      res.status(401).json({ success: false, message: 'Invalid token.', error: 'Missing user identifier' });
      return;
    }

    const user = store.getUserById(payload.userId);
    if (!user || user.isActive === false) {
      res.status(401).json({ success: false, message: 'Invalid token.', error: 'User not found or deactivated' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token.',
      error: error instanceof Error ? error.message : 'Token verification failed'
    });
  }
};

/** Alias — consistent name used across controllers */
export const requireAuth = authenticate;

/**
 * requireRole(...roles): user must have at least the minimum rank of the listed roles.
 * SUPER_ADMIN always passes.
 */
export const requireRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    const allowed = roles.some((role) => ROLE_RANK[req.user!.role] >= ROLE_RANK[role]);
    if (!allowed) {
      res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      return;
    }

    next();
  };
};

/**
 * requireAnyRole(...roles): user must have EXACTLY one of the listed roles.
 * SUPER_ADMIN passes only when SUPER_ADMIN is in the list.
 */
export const requireAnyRole = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required.' });
      return;
    }

    // SUPER_ADMIN bypasses all non-public role checks
    if (req.user.role === UserRole.SUPER_ADMIN) {
      next();
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, message: 'Insufficient permissions.' });
      return;
    }

    next();
  };
};

export const authorize = (roles: UserRole[]) => requireRole(...roles);
