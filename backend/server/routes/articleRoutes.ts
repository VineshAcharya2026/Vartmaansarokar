/**
 * Public article list route handler (Hono/Worker).
 * Mount with: app.get(LIST_PUBLIC_ARTICLES, getArticlesList);
 */
export { getArticlesList } from '../controllers/articleController.js';

export const LIST_PUBLIC_ARTICLES = '/api/articles';
