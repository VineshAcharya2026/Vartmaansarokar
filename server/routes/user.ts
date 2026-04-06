import { Router } from 'express';
import { getUsers, updateUserRole } from '../controllers/UserController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const router = Router();

// Protected user routes
router.get('/users', authenticate, authorize([UserRole.SUPER_ADMIN]), getUsers);
router.patch('/users/:id/role', authenticate, authorize([UserRole.SUPER_ADMIN]), updateUserRole);

export default router;