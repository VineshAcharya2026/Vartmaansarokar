import { Router } from 'express';
import {
  signup,
  login,
  googleLogin,
  quickLogin,
  activateDigitalSubscription,
  getCurrentUser,
  refreshToken,
  logout
} from '../controllers/AuthController.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/security.js';

const router = Router();

// Apply stricter rate-limiting to all auth endpoints
router.use(authLimiter);

/** POST /api/auth/register  — create a new staff account */
router.post('/register', signup);

/** POST /api/auth/signup  — alias */
router.post('/signup', signup);

/** POST /api/auth/login  — validate email+password → JWT + httpOnly cookie */
router.post('/login', login);

/** POST /api/auth/logout  — clear httpOnly cookie */
router.post('/logout', logout);

/** GET  /api/auth/me  — verify JWT, return logged-in user */
router.get('/me', authenticate, getCurrentUser);

/** POST /api/auth/refresh  — reissue a fresh JWT */
router.post('/refresh', authenticate, refreshToken);

/** POST /api/auth/google  — Google OAuth login */
router.post('/google', googleLogin);

/** POST /api/auth/users/login  — quick passwordless reader login */
router.post('/users/login', quickLogin);

/** POST /api/auth/subscriptions/digital */
router.post('/subscriptions/digital', activateDigitalSubscription);

export default router;
