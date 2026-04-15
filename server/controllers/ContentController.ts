import { Request, Response } from 'express';
import { ContentService } from '../services/ContentService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const contentService = new ContentService();

function articleOptions(req: AuthenticatedRequest) {
  if (req.user?.role === UserRole.EDITOR) {
    return { includeUnapproved: true, authorId: req.user.id };
  }
  return { includeUnapproved: true };
}

export const getArticles = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const articles = contentService.getArticles(articleOptions(req));
  res.json({ success: true, message: 'Articles loaded.', data: { articles, news: articles, queue: contentService.getArticleQueue() } });
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const article = contentService.getArticleById(req.params.id as string);
  res.json({ success: true, message: 'Article loaded.', data: { article } });
});

export const createArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.createArticle({
    ...req.body,
    author: req.body.author || req.user?.name || 'Editorial Desk',
    status: req.user?.role === UserRole.EDITOR ? 'DRAFT' : 'APPROVED',
    submittedBy: req.user?.id
  });
  res.status(201).json({
    success: true,
    message: 'Article created.',
    data: { article, articles: contentService.getArticles(articleOptions(req)), news: contentService.getArticles(articleOptions(req)) }
  });
});

export const updateArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.updateArticle(req.params.id as string, req.body);
  res.json({
    success: true,
    message: 'Article updated.',
    data: { article, articles: contentService.getArticles(articleOptions(req)), news: contentService.getArticles(articleOptions(req)) }
  });
});

export const submitArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.submitArticle(req.params.id as string, req.user!);
  res.json({ success: true, message: 'Article submitted for approval.', data: { article } });
});

export const approveArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.approveArticle(req.params.id as string, req.user!);
  res.json({ success: true, message: 'Article approved.', data: { article } });
});

export const rejectArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.rejectArticle(req.params.id as string, req.user!, req.body?.reason);
  res.json({ success: true, message: 'Article rejected.', data: { article } });
});

export const reworkArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const article = await contentService.reworkArticle(req.params.id as string, req.user!, req.body?.reason);
  res.json({ success: true, message: 'Article sent back for rework.', data: { article } });
});

export const deleteArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await contentService.deleteArticle(req.params.id as string);
  res.json({
    success: true,
    message: 'Article deleted.',
    data: { deletedId: deleted.id, articles: contentService.getArticles(articleOptions(req)), news: contentService.getArticles(articleOptions(req)) }
  });
});

export const getMagazines = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const options = req.user?.role === UserRole.EDITOR ? { includeUnapproved: true, authorId: req.user.id } : { includeUnapproved: true };
  const magazines = contentService.getMagazines(options);
  res.json({ success: true, message: 'Magazines loaded.', data: { magazines, queue: contentService.getMagazineQueue() } });
});

export const getMagazine = asyncHandler(async (req: Request, res: Response) => {
  const magazine = contentService.getMagazineById(req.params.id as string);
  res.json({ success: true, message: 'Magazine loaded.', data: { magazine } });
});

export const createMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const magazine = await contentService.createMagazine({
    ...req.body,
    status: req.user?.role === UserRole.EDITOR ? 'DRAFT' : 'APPROVED',
    submittedBy: req.user?.id
  });
  const options = req.user?.role === UserRole.EDITOR ? { includeUnapproved: true, authorId: req.user.id } : { includeUnapproved: true };
  res.status(201).json({ success: true, message: 'Magazine created.', data: { magazine, magazines: contentService.getMagazines(options) } });
});

export const updateMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const magazine = await contentService.updateMagazine(req.params.id as string, req.body);
  const options = req.user?.role === UserRole.EDITOR ? { includeUnapproved: true, authorId: req.user.id } : { includeUnapproved: true };
  res.json({ success: true, message: 'Magazine updated.', data: { magazine, magazines: contentService.getMagazines(options) } });
});

export const submitMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const magazine = await contentService.submitMagazine(req.params.id as string, req.user!);
  res.json({ success: true, message: 'Magazine submitted for approval.', data: { magazine } });
});

export const approveMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const magazine = await contentService.approveMagazine(req.params.id as string, req.user!);
  res.json({ success: true, message: 'Magazine approved.', data: { magazine } });
});

export const rejectMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const magazine = await contentService.rejectMagazine(req.params.id as string, req.user!, req.body?.reason);
  res.json({ success: true, message: 'Magazine rejected.', data: { magazine } });
});

export const deleteMagazine = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const deleted = await contentService.deleteMagazine(req.params.id as string);
  const options = req.user?.role === UserRole.EDITOR ? { includeUnapproved: true, authorId: req.user.id } : { includeUnapproved: true };
  res.json({ success: true, message: 'Magazine deleted.', data: { deletedId: deleted.id, magazines: contentService.getMagazines(options) } });
});

export const getAds = asyncHandler(async (_req: Request, res: Response) => {
  const ads = contentService.getAds();
  res.json({ success: true, message: 'Ads loaded.', data: { ads } });
});

export const updateAds = asyncHandler(async (req: Request, res: Response) => {
  const updatedAds = await contentService.updateAds(Array.isArray(req.body) ? req.body : req.body.ads);
  res.json({ success: true, message: 'Ads updated.', data: { ads: updatedAds } });
});
