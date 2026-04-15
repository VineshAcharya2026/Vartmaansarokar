import { sharedStore as store } from '../store.js';
import { AppError } from '../utils/errorHandler.js';
export class ContentService {
    getArticles(options = {}) {
        return store.listArticles(options);
    }
    getArticleQueue() {
        return store.listArticleQueue();
    }
    getArticleById(id) {
        const article = store.getArticleById(id);
        if (!article)
            throw new AppError('Article not found.', 404);
        return article;
    }
    async createArticle(articleData) {
        return store.createArticle({
            ...articleData,
            id: '',
            featured: articleData.featured ?? false,
            requiresSubscription: articleData.requiresSubscription ?? false
        });
    }
    async updateArticle(id, updates) {
        const article = await store.updateArticle(id, updates);
        if (!article)
            throw new AppError('Article not found.', 404);
        return article;
    }
    async submitArticle(id, user) {
        const article = await this.updateArticle(id, {
            status: 'IN_REVIEW',
            submittedBy: user.id,
            submittedAt: new Date().toISOString(),
            author: user.name
        });
        await store.recordAudit({ actor: user, action: 'ARTICLE_SUBMITTED', targetType: 'article', targetId: article.id });
        return article;
    }
    async approveArticle(id, user) {
        const article = await store.reviewArticle(id, 'APPROVED', { reviewedBy: user });
        if (!article)
            throw new AppError('Article not found.', 404);
        await store.recordAudit({ actor: user, action: 'ARTICLE_APPROVED', targetType: 'article', targetId: article.id });
        return article;
    }
    async rejectArticle(id, user, reason) {
        const article = await store.reviewArticle(id, 'REJECTED', { reviewedBy: user, reason });
        if (!article)
            throw new AppError('Article not found.', 404);
        await store.recordAudit({ actor: user, action: 'ARTICLE_REJECTED', targetType: 'article', targetId: article.id, details: { reason } });
        return article;
    }
    async deleteArticle(id) {
        const deleted = await store.deleteArticle(id);
        if (!deleted)
            throw new AppError('Article not found.', 404);
        return deleted;
    }
    getMagazines(options = {}) {
        return store.listMagazines(options);
    }
    getMagazineQueue() {
        return store.listMagazineQueue();
    }
    getMagazineById(id) {
        const magazine = store.getMagazineById(id);
        if (!magazine)
            throw new AppError('Magazine not found.', 404);
        return magazine;
    }
    async createMagazine(magazineData) {
        return store.createMagazine({
            ...magazineData,
            id: '',
            isFree: magazineData.isFree ?? false,
            blurPaywall: magazineData.blurPaywall ?? false
        });
    }
    async updateMagazine(id, updates) {
        const magazine = await store.updateMagazine(id, updates);
        if (!magazine)
            throw new AppError('Magazine not found.', 404);
        return magazine;
    }
    async submitMagazine(id, user) {
        const magazine = await this.updateMagazine(id, {
            status: 'IN_REVIEW',
            submittedBy: user.id,
            submittedAt: new Date().toISOString()
        });
        await store.recordAudit({ actor: user, action: 'MAGAZINE_SUBMITTED', targetType: 'magazine', targetId: magazine.id });
        return magazine;
    }
    async approveMagazine(id, user) {
        const magazine = await store.reviewMagazine(id, 'APPROVED', { reviewedBy: user });
        if (!magazine)
            throw new AppError('Magazine not found.', 404);
        await store.recordAudit({ actor: user, action: 'MAGAZINE_APPROVED', targetType: 'magazine', targetId: magazine.id });
        return magazine;
    }
    async rejectMagazine(id, user, reason) {
        const magazine = await store.reviewMagazine(id, 'REJECTED', { reviewedBy: user, reason });
        if (!magazine)
            throw new AppError('Magazine not found.', 404);
        await store.recordAudit({ actor: user, action: 'MAGAZINE_REJECTED', targetType: 'magazine', targetId: magazine.id, details: { reason } });
        return magazine;
    }
    async deleteMagazine(id) {
        const deleted = await store.deleteMagazine(id);
        if (!deleted)
            throw new AppError('Magazine not found.', 404);
        return deleted;
    }
    getAds() {
        return store.listAds();
    }
    async updateAds(ads) {
        return store.replaceAds(ads);
    }
}
