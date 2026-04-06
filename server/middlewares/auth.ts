import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { sharedStore as store, UserRecord } from '../store.js';
import { UserRole } from '../../types.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  const authorization = req.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
      error: 'Missing bearer token'
    });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!payload.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: 'Missing user identifier'
      });
      return;
    }

    const user = store.getUserById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: 'User no longer exists'
      });
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

export const authorize = (roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const rank: Record<UserRole, number> = {
      [UserRole.GENERAL]: 0,
      [UserRole.MAGAZINE]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3
    };

    const minimumRank = Math.min(...roles.map((role) => rank[role as UserRole]));
    if (!req.user || rank[req.user.role as UserRole] < minimumRank) {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions.'
      });
      return;
    }

    next();
  };
};