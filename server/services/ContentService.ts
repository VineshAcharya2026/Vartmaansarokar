import { sharedStore as store } from '../store.js';
import { NewsPost, MagazineIssue, Ad } from '../../types.js';

export class ContentService {

  // Articles/News
  getArticles() {
    return store.listArticles();
  }

  getArticleById(id: string) {
    const article = store.getArticleById(id);
    if (!article) {
      throw new Error('Article not found.');
    }
    return article;
  }

  async createArticle(articleData: Omit<NewsPost, 'id' | 'createdAt' | 'updatedAt'>): Promise<NewsPost> {
    const article: NewsPost = {
      ...articleData,
      id: `article_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      featured: articleData.featured ?? false,
      requiresSubscription: articleData.requiresSubscription ?? false
    };
    const created = await store.createArticle(article);
    return created;
  }

  async updateArticle(id: string, updates: Partial<NewsPost>) {
    const article = await store.updateArticle(id, updates);
    if (!article) {
      throw new Error('Article not found.');
    }
    return article;
  }

  async deleteArticle(id: string) {
    const deleted = await store.deleteArticle(id);
    if (!deleted) {
      throw new Error('Article not found.');
    }
    return deleted;
  }

  // Magazines
  getMagazines() {
    return store.listMagazines();
  }

  async createMagazine(magazineData: Omit<MagazineIssue, 'id' | 'createdAt' | 'updatedAt'>): Promise<MagazineIssue> {
    const magazine: MagazineIssue = {
      ...magazineData,
      id: `magazine_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      isFree: magazineData.isFree ?? false,
      blurPaywall: magazineData.blurPaywall ?? false
    };
    const created = await store.createMagazine(magazine);
    return created;
  }

  async updateMagazine(id: string, updates: Partial<MagazineIssue>) {
    const magazine = await store.updateMagazine(id, updates);
    if (!magazine) {
      throw new Error('Magazine not found.');
    }
    return magazine;
  }

  async deleteMagazine(id: string) {
    const deleted = await store.deleteMagazine(id);
    if (!deleted) {
      throw new Error('Magazine not found.');
    }
    return deleted;
  }

  // Ads
  getAds() {
    return store.listAds();
  }

  async updateAds(ads: Ad[]) {
    return await store.replaceAds(ads);
  }
}