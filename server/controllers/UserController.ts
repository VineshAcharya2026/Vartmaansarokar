import { Response } from 'express';
import { UserService } from '../services/UserService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const userService = new UserService();

export const getUsers = asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
  const users = userService.getUsers();
  res.json({ success: true, message: 'Users loaded.', data: { users } });
});

export const createUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { email, name, password, role } = req.body;
  if (!Object.values(UserRole).includes(role) || role === UserRole.SUBSCRIBER) {
    res.status(400).json({ success: false, message: 'Invalid user role.', error: 'Invalid role value' });
    return;
  }

  const user = await userService.createUser({ email, name, password, role }, req.user!);
  res.status(201).json({ success: true, message: 'User created.', data: { user, users: userService.getUsers() } });
});

export const updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { role } = req.body;
  if (!Object.values(UserRole).includes(role) || role === UserRole.SUBSCRIBER) {
    res.status(400).json({ success: false, message: 'Invalid user role.', error: 'Invalid role value' });
    return;
  }

  await userService.updateUserRole(req.params.id as string, role, req.user!);
  res.json({ success: true, message: 'User role updated.', data: { users: userService.getUsers() } });
});

export const deactivateUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  await userService.deactivateUser(req.params.id as string, req.user!);
  res.json({ success: true, message: 'User deactivated.', data: { users: userService.getUsers() } });
});
