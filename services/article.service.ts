import api from '../lib/api';
import { NewsItem } from '../types';

export const articleService = {
  getArticles: async () => {
    const { data } = await api.get('/articles');
    return data.news || [];
  },

  getStaffArticles: async () => {
    const { data } = await api.get('/articles/all');
    return data.news || [];
  },

  getArticle: async (id: string) => {
    const { data } = await api.get(`/articles/${id}`);
    return data.article;
  },

  createArticle: async (article: Partial<NewsItem>) => {
    const { data } = await api.post('/articles', article);
    return data;
  },

  updateArticle: async (id: string, article: Partial<NewsItem>) => {
    const { data } = await api.put(`/articles/${id}`, article);
    return data;
  },

  deleteArticle: async (id: string) => {
    await api.delete(`/articles/${id}`);
  },

  approveArticle: async (id: string) => {
    await api.post(`/articles/${id}/approve`);
  },

  rejectArticle: async (id: string, reason: string) => {
    await api.post(`/articles/${id}/reject`, { reason });
  },

  reworkArticle: async (id: string, reason: string) => {
    await api.post(`/articles/${id}/rework`, { reason });
  }
};
