import { Router } from 'express';
import {
  createSubscriptionRequest,
  createUnlockRequest,
  getSubscriptionRequests,
  updateSubscriptionRequest
} from '../controllers/SubscriptionController.js';
import { validateSubscription } from '../middlewares/validation.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const router = Router();

// Public subscription routes
router.post('/subscription-requests', validateSubscription, createSubscriptionRequest);
router.post('/unlock-requests', createUnlockRequest);

// Protected subscription routes
router.get('/subscription-requests', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), getSubscriptionRequests);
router.patch('/subscription-requests/:id', authenticate, authorize([UserRole.ADMIN]), updateSubscriptionRequest);

export default router;