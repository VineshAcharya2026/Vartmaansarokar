import { Router } from 'express';
import { createUser, deactivateUser, getUsers, updateUserRole } from '../controllers/UserController.js';
import { authenticate, requireAnyRole } from '../middlewares/auth.js';
import { UserRole } from '../../../vartmaan-shared-types.js';

const router = Router();

router.get('/users', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), getUsers);
router.post('/users', authenticate, requireAnyRole(UserRole.SUPER_ADMIN), createUser);
router.patch('/users/:id/role', authenticate, requireAnyRole(UserRole.SUPER_ADMIN), updateUserRole);
router.patch('/users/:id/deactivate', authenticate, requireAnyRole(UserRole.SUPER_ADMIN), deactivateUser);

export default router;
