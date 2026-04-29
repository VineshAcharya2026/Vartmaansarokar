import api from '../lib/api';

export const mediaService = {
  getMedia: async () => {
    const { data } = await api.get('/api/media');
    return (data as { media?: unknown[] }).media ?? [];
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/api/uploads', formData);
    return data;
  }
};
