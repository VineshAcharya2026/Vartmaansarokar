import api from '../lib/api';

export const tickerService = {
  getTicker: async () => {
    const { data } = await api.get('/api/ticker');
    return (data as { items?: unknown[] }).items ?? [];
  },

  getCricketTicker: async () => {
    const { data } = await api.get('/api/ticker/cricket');
    return (data as { items?: unknown[] }).items ?? [];
  },

  createTicker: async (text: string) => {
    const { data } = await api.post('/api/ticker', { text });
    return data;
  },

  updateTicker: async (id: string, active: boolean) => {
    const { data } = await api.put(`/api/ticker/${id}`, { active });
    return data;
  },

  deleteTicker: async (id: string) => {
    await api.delete(`/api/ticker/${id}`);
  }
};
