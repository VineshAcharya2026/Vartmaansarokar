import { Router } from 'express';
import { uploadFile, getMedia, deleteMedia } from '../controllers/MediaController.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { uploadLimiter } from '../middlewares/security.js';
import { UserRole } from '../../types.js';

const router = Router();

// Apply upload rate limiting
router.use(uploadLimiter);

// Media routes (require authentication)
router.post('/uploads', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), uploadFile);
router.post('/files', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), uploadFile);
router.get('/media', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), getMedia);
router.get('/files', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), getMedia);
router.delete('/media/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), deleteMedia);
router.delete('/files/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), deleteMedia);

export default router;