import api from '../lib/api';
import { AdItem } from '../types';

export const adsService = {
  getAds: async () => {
    const { data } = await api.get('/ads');
    return data.ads || [];
  },

  getAdminAds: async () => {
    const { data } = await api.get('/ads/admin');
    return data.ads || [];
  },

  createAd: async (ad: Partial<AdItem>) => {
    const { data } = await api.post('/ads', ad);
    return data;
  },

  updateAd: async (id: string, ad: Partial<AdItem>) => {
    const { data } = await api.put(`/ads/${id}`, ad);
    return data;
  },

  deleteAd: async (id: string) => {
    await api.delete(`/ads/${id}`);
  }
};
