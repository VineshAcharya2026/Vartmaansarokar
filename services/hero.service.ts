import api from '../lib/api';

export const heroService = {
  getHero: async () => {
    const { data } = await api.get('/api/hero');
    return (data as { hero?: unknown }).hero;
  },

  updateHero: async (hero: unknown) => {
    const { data } = await api.put('/api/hero', hero);
    return data;
  }
};
