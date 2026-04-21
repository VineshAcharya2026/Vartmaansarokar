import api from '../lib/api';
import { NewsItem } from '../types';

export const articleService = {
  getArticles: async () => {
    const { data } = await api.get('/api/articles');
    const r = data as { news?: NewsItem[]; articles?: NewsItem[] };
    return r.news ?? r.articles ?? [];
  },

  getStaffArticles: async () => {
    const { data } = await api.get('/api/articles/all');
    const r = data as { news?: NewsItem[]; articles?: NewsItem[] };
    return r.news ?? r.articles ?? [];
  },

  getArticle: async (id: string) => {
    const { data } = await api.get(`/api/articles/${id}`);
    return (data as { article: NewsItem }).article;
  },

  createArticle: async (article: Partial<NewsItem>) => {
    const { data } = await api.post('/api/articles', article);
    return data;
  },

  updateArticle: async (id: string, article: Partial<NewsItem>) => {
    const { data } = await api.put(`/api/articles/${id}`, article);
    return data;
  },

  deleteArticle: async (id: string) => {
    await api.delete(`/api/articles/${id}`);
  },

  approveArticle: async (id: string) => {
    await api.post(`/api/articles/${id}/approve`);
  },

  rejectArticle: async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/reject`, { reason });
  },

  reworkArticle: async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/rework`, { reason });
  }
};
