import { Request, Response } from 'express';
import { ContentService } from '../services/ContentService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

const contentService = new ContentService();

export const getArticles = asyncHandler(async (req: Request, res: Response) => {
  const articles = contentService.getArticles();

  res.json({
    success: true,
    message: 'Articles loaded.',
    data: { articles }
  });
});

export const getArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const article = contentService.getArticleById(id as string);

  res.json({
    success: true,
    message: 'Article loaded.',
    data: { article }
  });
});

export const createArticle = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const articleData = {
    ...req.body,
    author: req.body.author || req.user?.name || 'Editorial Desk'
  };

  const article = await contentService.createArticle(articleData);

  res.status(201).json({
    success: true,
    message: 'Article created.',
    data: { article, articles: contentService.getArticles() }
  });
});

export const updateArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const article = await contentService.updateArticle(id as string, req.body);

  res.json({
    success: true,
    message: 'Article updated.',
    data: { article, articles: contentService.getArticles() }
  });
});

export const deleteArticle = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await contentService.deleteArticle(id as string);

  res.json({
    success: true,
    message: 'Article deleted.',
    data: { deletedId: deleted.id, articles: contentService.getArticles() }
  });
});

export const getMagazines = asyncHandler(async (req: Request, res: Response) => {
  const magazines = contentService.getMagazines();

  res.json({
    success: true,
    message: 'Magazines loaded.',
    data: { magazines }
  });
});

export const createMagazine = asyncHandler(async (req: Request, res: Response) => {
  const magazine = await contentService.createMagazine(req.body);

  res.status(201).json({
    success: true,
    message: 'Magazine created.',
    data: { magazine, magazines: contentService.getMagazines() }
  });
});

export const updateMagazine = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const magazine = await contentService.updateMagazine(id as string, req.body);

  res.json({
    success: true,
    message: 'Magazine updated.',
    data: { magazine, magazines: contentService.getMagazines() }
  });
});

export const deleteMagazine = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = await contentService.deleteMagazine(id as string);

  res.json({
    success: true,
    message: 'Magazine deleted.',
    data: { deletedId: deleted.id, magazines: contentService.getMagazines() }
  });
});

export const getAds = asyncHandler(async (req: Request, res: Response) => {
  const ads = contentService.getAds();

  res.json({
    success: true,
    message: 'Ads loaded.',
    data: { ads }
  });
});

export const updateAds = asyncHandler(async (req: Request, res: Response) => {
  const { ads } = req.body;
  const updatedAds = await contentService.updateAds(ads);

  res.json({
    success: true,
    message: 'Ads updated.',
    data: { ads: updatedAds }
  });
});