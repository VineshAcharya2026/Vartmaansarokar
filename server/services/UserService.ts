import { sharedStore as store } from '../store.js';
import { User, UserRole } from '../../types.js';

export class UserService {

  getUsers() {
    return store.listUsers();
  }

  getUserById(id: string) {
    const user = store.getUserById(id);
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }

  async updateUserRole(userId: string, role: UserRole) {
    const user = await store.updateUser(userId, { role });
    if (!user) {
      throw new Error('User not found.');
    }
    return user;
  }
}