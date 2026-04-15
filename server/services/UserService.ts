import bcrypt from 'bcryptjs';
import { sharedStore as store, UserRecord } from '../store.js';
import { UserRole } from '../../types.js';
import { AppError } from '../utils/errorHandler.js';

export class UserService {
  getUsers() {
    return store.listUsers();
  }

  getUserById(id: string) {
    const user = store.getUserById(id);
    if (!user) throw new AppError('User not found.', 404);
    return user;
  }

  async createUser(input: { email: string; name: string; role: UserRole; password: string }, actor: UserRecord) {
    if (store.findUserByEmail(input.email)) throw new AppError('Account already exists.', 409);

    const user = await store.createUser({
      email: input.email,
      name: input.name,
      role: input.role,
      passwordHash: await bcrypt.hash(input.password, 10)
    });
    await store.recordAudit({
      actor,
      action: 'USER_CREATED',
      targetType: 'user',
      targetId: user.id,
      details: { email: user.email, role: user.role }
    });
    return user;
  }

  async updateUserRole(userId: string, role: UserRole, actor: UserRecord) {
    const user = await store.updateUser(userId, { role });
    if (!user) throw new AppError('User not found.', 404);
    await store.recordAudit({
      actor,
      action: 'USER_ROLE_CHANGED',
      targetType: 'user',
      targetId: user.id,
      details: { role }
    });
    return user;
  }

  async deactivateUser(userId: string, actor: UserRecord) {
    const user = await store.updateUser(userId, { isActive: false });
    if (!user) throw new AppError('User not found.', 404);
    await store.recordAudit({
      actor,
      action: 'USER_DEACTIVATED',
      targetType: 'user',
      targetId: user.id
    });
    return user;
  }
}
