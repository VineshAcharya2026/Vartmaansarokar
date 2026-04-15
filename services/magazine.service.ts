import api from '../lib/api';
import { MagazineItem } from '../types';

export const magazineService = {
  getMagazines: async () => {
    const { data } = await api.get('/magazines');
    return data.magazines || [];
  },

  createMagazine: async (mag: Partial<MagazineItem>) => {
    const { data } = await api.post('/magazines', mag);
    return data;
  },

  deleteMagazine: async (id: string) => {
    await api.delete(`/magazines/${id}`);
  }
};
