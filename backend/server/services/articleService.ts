/** Fixed public list categories (GET /api/articles?category=...). */
export const ARTICLE_CATEGORIES = [
  'Technology',
  'Business',
  'Marketing',
  'Finance',
  'Startup'
] as const;

export type ArticleCategory = (typeof ARTICLE_CATEGORIES)[number];

const CATEGORY_SET = new Set<string>(ARTICLE_CATEGORIES);

export function isValidArticleCategory(value: string): value is ArticleCategory {
  return CATEGORY_SET.has(value);
}

export async function listPublishedArticles(
  db: D1Database,
  category: string | undefined
): Promise<Record<string, unknown>[]> {
  if (category) {
    const { results } = await db
      .prepare(
        "SELECT * FROM news WHERE status = 'PUBLISHED' AND category = ? ORDER BY created_at DESC"
      )
      .bind(category)
      .all();
    return (results as Record<string, unknown>[]) ?? [];
  }
  const { results } = await db
    .prepare("SELECT * FROM news WHERE status = 'PUBLISHED' ORDER BY created_at DESC")
    .all();
  return (results as Record<string, unknown>[]) ?? [];
}
