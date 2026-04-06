import { Router } from 'express';
import {
  signup,
  login,
  googleLogin,
  quickLogin,
  activateDigitalSubscription,
  getCurrentUser
} from '../controllers/AuthController.js';
import { validateAuth, validateSubscription } from '../middlewares/validation.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/security.js';
import { UserRole } from '../../types.js';

const router = Router();

// Apply rate limiting to auth routes
router.use(authLimiter);

// Public auth routes
router.post('/signup', validateAuth, signup);
router.post('/login', validateAuth, login);
router.post('/google', googleLogin);
router.post('/users/login', quickLogin);
router.post('/subscriptions/digital', validateSubscription, activateDigitalSubscription);

// Protected auth routes
router.get('/me', authenticate, getCurrentUser);

export default router;