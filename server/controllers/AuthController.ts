import { Request, Response } from 'express';
import { AuthService } from '../services/AuthService.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';

const authService = new AuthService();

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password } = req.body;

  const result = await authService.signup(email, name, password);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: result
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const result = await authService.login(email, password);

  res.json({
    success: true,
    message: 'Login successful.',
    data: result
  });
});

export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body;

  if (!credential) {
    res.status(400).json({
      success: false,
      message: 'Google credential token is required.'
    });
    return;
  }

  const result = await authService.googleLogin(credential);

  res.json({
    success: true,
    message: 'Google login successful.',
    data: result
  });
});

export const quickLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const result = await authService.quickLogin(email);

  res.json({
    success: true,
    message: 'Quick login successful.',
    data: result
  });
});

export const activateDigitalSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone } = req.body;

  const result = await authService.activateDigitalSubscription(name, email, phone);

  res.status(201).json({
    success: true,
    message: 'Digital subscription activated.',
    data: result
  });
});

export const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = authService.getCurrentUser(req.user!.id);

  res.json({
    success: true,
    message: 'Authenticated user loaded.',
    data: { user }
  });
});