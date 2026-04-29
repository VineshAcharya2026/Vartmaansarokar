import { Router } from 'express';
import { uploadFile, getMedia, deleteMedia } from '../controllers/MediaController.js';
import { authenticate, requireAnyRole } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/security.js';
import { UserRole } from '../../types.js';
const router = Router();
// Apply upload rate limiting
router.use(uploadLimiter);
// Media routes (require authentication)
router.post('/uploads', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), uploadFile);
router.post('/files', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), uploadFile);
router.get('/media', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), getMedia);
router.get('/files', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), getMedia);
router.delete('/media/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), deleteMedia);
router.delete('/files/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), deleteMedia);
export default router;
