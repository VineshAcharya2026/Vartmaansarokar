import { Router } from 'express';
import {
  getArticles,
  getArticle,
  createArticle,
  updateArticle,
  deleteArticle,
  getMagazines,
  createMagazine,
  updateMagazine,
  deleteMagazine,
  getAds,
  updateAds
} from '../controllers/ContentController.js';
import { validateArticle, validateMagazine } from '../middlewares/validation.js';
import { authenticate, authorize } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const router = Router();

// Public content routes
router.get('/articles', getArticles);
router.get('/articles/:id', getArticle);
router.get('/magazines', getMagazines);
router.get('/ads', getAds);

// Protected content routes (require authentication)
router.post('/articles', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), validateArticle, createArticle);
router.patch('/articles/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), updateArticle);
router.delete('/articles/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), deleteArticle);

// Duplicate routes for /news (backward compatibility)
router.post('/news', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), validateArticle, createArticle);
router.patch('/news/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), updateArticle);
router.delete('/news/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), deleteArticle);

// Magazine routes
router.post('/magazines', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), validateMagazine, createMagazine);
router.patch('/magazines/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), updateMagazine);
router.delete('/magazines/:id', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), deleteMagazine);

// Ads routes
router.put('/ads', authenticate, authorize([UserRole.ADMIN, UserRole.MAGAZINE]), updateAds);

export default router;