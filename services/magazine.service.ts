import api from '../lib/api';
import { MagazineItem } from '../types';

export const magazineService = {
  getMagazines: async () => {
    const { data } = await api.get('/api/magazines');
    const r = data as { magazines?: MagazineItem[] };
    return r.magazines ?? [];
  },

  createMagazine: async (mag: Partial<MagazineItem>) => {
    const { data } = await api.post('/api/magazines', mag);
    return data;
  },

  deleteMagazine: async (id: string) => {
    await api.delete(`/api/magazines/${id}`);
  }
};
