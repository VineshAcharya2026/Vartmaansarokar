import api from '../lib/api';
import { User } from '../types';

export const userService = {
  getUsers: async () => {
    const { data } = await api.get('/users');
    return data.users || [];
  },

  approveUser: async (id: string) => {
    await api.post(`/users/${id}/approve`);
  },

  rejectUser: async (id: string, reason: string) => {
    await api.post(`/users/${id}/reject`, { reason });
  },

  deleteUser: async (id: string) => {
    await api.delete(`/users/${id}`);
  }
};
