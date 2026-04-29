import jwt from 'jsonwebtoken';
import { sharedStore as store } from '../store.js';
import { UserRole } from '../../types.js';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const ROLE_RANK = {
    [UserRole.SUBSCRIBER]: 0,
    [UserRole.EDITOR]: 1,
    [UserRole.ADMIN]: 2,
    [UserRole.SUPER_ADMIN]: 3
};
export const authenticate = (req, res, next) => {
    const authorization = req.headers.authorization ?? '';
    const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    if (!token) {
        res.status(401).json({ success: false, message: 'Authentication required.', error: 'Missing bearer token' });
        return;
    }
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload.userId) {
            res.status(401).json({ success: false, message: 'Invalid token.', error: 'Missing user identifier' });
            return;
        }
        const user = store.getUserById(payload.userId);
        if (!user || user.isActive === false) {
            res.status(401).json({ success: false, message: 'Invalid token.', error: 'User no longer exists' });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({
            success: false,
            message: 'Invalid token.',
            error: error instanceof Error ? error.message : 'Token verification failed'
        });
    }
};
export const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (req.user.role === UserRole.SUPER_ADMIN) {
            next();
            return;
        }
        const allowed = roles.some((role) => ROLE_RANK[req.user.role] >= ROLE_RANK[role]);
        if (!allowed) {
            res.status(403).json({ success: false, message: 'Insufficient permissions.' });
            return;
        }
        next();
    };
};
export const requireAnyRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Authentication required.' });
            return;
        }
        if (req.user.role === UserRole.SUPER_ADMIN && roles.includes(UserRole.SUPER_ADMIN)) {
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
export const authorize = (roles) => requireRole(...roles);
