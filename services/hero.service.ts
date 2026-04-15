import api from '../lib/api';

export const heroService = {
  getHero: async () => {
    const { data } = await api.get('/hero');
    return data.hero;
  },

  updateHero: async (hero: any) => {
    const { data } = await api.put('/hero', hero);
    return data;
  }
};
