import api from '../lib/api';
import { User } from '../types';

export const userService = {
  getUsers: async () => {
    const { data } = await api.get('/api/users');
    return (data as { users?: User[] }).users ?? [];
  },

  approveUser: async (id: string) => {
    await api.post(`/api/users/${id}/approve`);
  },

  rejectUser: async (id: string, reason: string) => {
    await api.post(`/api/users/${id}/reject`, { reason });
  },

  deleteUser: async (id: string) => {
    await api.delete(`/api/users/${id}`);
  }
};
