import { Request, Response } from 'express';
import { UserService } from '../services/UserService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';

const userService = new UserService();

export const getUsers = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const users = userService.getUsers();

  res.json({
    success: true,
    message: 'Users loaded.',
    data: { users }
  });
});

export const updateUserRole = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!Object.values(UserRole).includes(role)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid user role.',
      error: 'Invalid role value'
    });
  }

  const updated = await userService.updateUserRole(id as string, role);

  res.json({
    success: true,
    message: 'User role updated.',
    data: { users: userService.getUsers() }
  });
});