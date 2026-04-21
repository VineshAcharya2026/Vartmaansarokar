import api from '../lib/api';
import { AdItem } from '../types';

export const adsService = {
  getAds: async () => {
    const { data } = await api.get('/api/ads');
    return (data as { ads?: AdItem[] }).ads ?? [];
  },

  getAdminAds: async () => {
    const { data } = await api.get('/api/ads/admin');
    return (data as { ads?: AdItem[] }).ads ?? [];
  },

  createAd: async (ad: Partial<AdItem>) => {
    const { data } = await api.post('/api/ads', ad);
    return data;
  },

  updateAd: async (id: string, ad: Partial<AdItem>) => {
    const { data } = await api.put(`/api/ads/${id}`, ad);
    return data;
  },

  deleteAd: async (id: string) => {
    await api.delete(`/api/ads/${id}`);
  }
};
