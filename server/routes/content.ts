import { Router } from 'express';
import {
  approveArticle,
  approveMagazine,
  createArticle,
  createMagazine,
  deleteArticle,
  deleteMagazine,
  getAds,
  getArticle,
  getArticles,
  getMagazine,
  getMagazines,
  rejectArticle,
  rejectMagazine,
  reworkArticle,
  submitArticle,
  submitMagazine,
  updateAds,
  updateArticle,
  updateMagazine
} from '../controllers/ContentController.js';
import { validateArticle, validateMagazine } from '../middlewares/validation.js';
import { authenticate, optionalAuthenticate, requireAnyRole } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const router = Router();

router.get('/articles', optionalAuthenticate, getArticles);
router.get('/articles/:id', optionalAuthenticate, getArticle);
router.get('/news', optionalAuthenticate, getArticles);
router.get('/news/:id', optionalAuthenticate, getArticle);
router.get('/magazines', optionalAuthenticate, getMagazines);
router.get('/magazines/:id', optionalAuthenticate, getMagazine);
router.get('/ads', optionalAuthenticate, getAds);

router.post('/articles', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), validateArticle, createArticle);
router.patch('/articles/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), updateArticle);
router.delete('/articles/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), deleteArticle);
router.post('/articles/:id/submit', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), submitArticle);
router.post('/articles/:id/approve', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), approveArticle);
router.post('/articles/:id/reject', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), rejectArticle);
router.post('/articles/:id/rework', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), reworkArticle);

router.post('/news', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), validateArticle, createArticle);
router.patch('/news/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), updateArticle);
router.delete('/news/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), deleteArticle);
router.post('/news/:id/submit', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), submitArticle);
router.post('/news/:id/approve', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), approveArticle);
router.post('/news/:id/reject', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), rejectArticle);
router.post('/news/:id/rework', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), reworkArticle);

router.post('/magazines', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), validateMagazine, createMagazine);
router.patch('/magazines/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), updateMagazine);
router.delete('/magazines/:id', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), deleteMagazine);
router.post('/magazines/:id/submit', authenticate, requireAnyRole(UserRole.EDITOR, UserRole.SUPER_ADMIN), submitMagazine);
router.post('/magazines/:id/approve', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), approveMagazine);
router.post('/magazines/:id/reject', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), rejectMagazine);

router.put('/ads', authenticate, requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN), updateAds);

export default router;
