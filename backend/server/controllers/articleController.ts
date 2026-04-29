import type { Context } from 'hono';
import { ok, fail } from '../api-contract.js';
import {
  ARTICLE_CATEGORIES,
  isValidArticleCategory,
  listPublishedArticles
} from '../services/articleService.js';

type ArticleCtx = Context<{ Bindings: { DB: D1Database } }>;

/**
 * GET /api/articles?category=Technology
 * Returns published rows from the `news` table (this project's article store).
 */
export async function getArticlesList(c: ArticleCtx) {
  try {
    const q = c.req.query('category');
    const filtered =
      q === undefined ? undefined : q.trim() === '' ? undefined : q.trim();
    if (filtered !== undefined && !isValidArticleCategory(filtered)) {
      return fail(
        c,
        `Invalid category. Use one of: ${ARTICLE_CATEGORIES.join(', ')}`,
        400
      );
    }
    const rows = await listPublishedArticles(c.env.DB, filtered);
    return ok(c, { news: rows, articles: rows });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Database error';
    return fail(c, msg, 500);
  }
}
