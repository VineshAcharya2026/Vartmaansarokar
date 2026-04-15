import api from '../lib/api';

export const tickerService = {
  getTicker: async () => {
    const { data } = await api.get('/ticker');
    return data.items || [];
  },

  createTicker: async (text: string) => {
    const { data } = await api.post('/ticker', { text });
    return data;
  },

  updateTicker: async (id: string, active: boolean) => {
    const { data } = await api.put(`/ticker/${id}`, { active });
    return data;
  },

  deleteTicker: async (id: string) => {
    await api.delete(`/ticker/${id}`);
  }
};
