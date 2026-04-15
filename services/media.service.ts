import api from '../lib/api';

export const mediaService = {
  getMedia: async () => {
    const { data } = await api.get('/media');
    return data.media || [];
  },

  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await api.post('/media', formData);
    return data;
  }
};
