import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sharedStore as store } from '../store.js';
import { asyncHandler } from '../utils/errorHandler.js';
import { AuthenticatedRequest } from '../middlewares/auth.js';
import { UserRole } from '../../types.js';
import { UserRecord } from '../store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const IS_PROD = process.env.NODE_ENV === 'production';
const COOKIE_NAME = 'auth_token';
const COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function createToken(user: Pick<UserRecord, 'id'>) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

function toPublicUser(user: UserRecord) {
  const { passwordHash, ...safeUser } = user as any;
  return safeUser;
}

function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax',
    maxAge: COOKIE_MAX_AGE_MS
  });
}

function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'none' : 'lax'
  });
}

/** POST /api/auth/login — validate email+password, return signed JWT + set httpOnly cookie */
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    res.status(400).json({ success: false, message: 'Email and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  const user = store.findUserByEmail(normalizedEmail);

  if (!user || !(await bcrypt.compare(String(password), user.passwordHash))) {
    res.status(401).json({ success: false, message: 'Invalid credentials.' });
    return;
  }

  if (user.isActive === false) {
    res.status(403).json({ success: false, message: 'Account is deactivated.' });
    return;
  }

  const token = createToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: 'Login successful.',
    data: { token, user: toPublicUser(user) }
  });
});

/** GET /api/auth/me — verify JWT, return logged-in user profile */
export const getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = store.getUserById(req.user!.id);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found.' });
    return;
  }
  res.json({
    success: true,
    message: 'Authenticated user loaded.',
    data: { user: toPublicUser(user) }
  });
});

/** POST /api/auth/logout — clear httpOnly cookie */
export const logout = asyncHandler(async (_req: Request, res: Response) => {
  clearAuthCookie(res);
  res.json({ success: true, message: 'Logout successful.', data: { ok: true } });
});

/** POST /api/auth/signup — create a new staff account */
export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { email, name, password, role } = req.body ?? {};

  if (!email || !name || !password) {
    res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    return;
  }

  const normalizedEmail = String(email).trim().toLowerCase();
  if (store.findUserByEmail(normalizedEmail)) {
    res.status(409).json({ success: false, message: 'Account already exists.' });
    return;
  }

  // Only allow editor or admin roles via signup; super_admin must be seeded
  const safeRole = [UserRole.EDITOR, UserRole.ADMIN].includes(role) ? role : UserRole.EDITOR;

  const user = await store.createUser({
    email: normalizedEmail,
    name: String(name).trim(),
    role: safeRole,
    authProvider: 'PASSWORD',
    passwordHash: await bcrypt.hash(String(password), 10)
  });

  const token = createToken(user);
  setAuthCookie(res, token);

  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    data: { token, user: toPublicUser(user) }
  });
});

/** POST /api/auth/google */
export const googleLogin = asyncHandler(async (req: Request, res: Response) => {
  const { credential } = req.body ?? {};
  if (!credential) {
    res.status(400).json({ success: false, message: 'Google credential token is required.' });
    return;
  }

  const { OAuth2Client } = await import('google-auth-library');
  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID ?? '';
  if (!GOOGLE_CLIENT_ID) {
    res.status(500).json({ success: false, message: 'Google sign-in is not configured.' });
    return;
  }

  const client = new OAuth2Client(GOOGLE_CLIENT_ID);
  const ticket = await client.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub || !payload.email_verified) {
    res.status(401).json({ success: false, message: 'Google account could not be verified.' });
    return;
  }

  const user = await store.upsertGoogleUser({
    googleId: payload.sub,
    email: payload.email,
    name: payload.name ?? payload.email.split('@')[0],
    avatarUrl: payload.picture
  });

  if (!user) {
    res.status(500).json({ success: false, message: 'Unable to sign in with Google.' });
    return;
  }

  const token = createToken(user);
  setAuthCookie(res, token);

  res.json({
    success: true,
    message: 'Google login successful.',
    data: { token, user: toPublicUser(user) }
  });
});

/** POST /api/auth/refresh */
export const refreshToken = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const user = store.getUserById(req.user!.id);
  if (!user) {
    res.status(401).json({ success: false, message: 'User not found.' });
    return;
  }
  const token = createToken(user);
  setAuthCookie(res, token);
  res.json({ success: true, message: 'Token refreshed.', data: { token, user: toPublicUser(user) } });
});

/** POST /api/auth/users/login — quick (passwordless) login for readers */
export const quickLogin = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email) {
    res.status(400).json({ success: false, message: 'Email is required.' });
    return;
  }
  const normalizedEmail = String(email).trim().toLowerCase();
  let user = store.findUserByEmail(normalizedEmail);
  if (!user) {
    const { randomUUID } = await import('node:crypto');
    user = await store.createUser({
      email: normalizedEmail,
      name: normalizedEmail.split('@')[0],
      role: UserRole.SUBSCRIBER,
      authProvider: 'PASSWORD',
      passwordHash: await bcrypt.hash(randomUUID(), 10)
    });
  }
  const token = createToken(user);
  res.json({ success: true, message: 'Quick login successful.', data: { token, user: toPublicUser(user) } });
});

export const activateDigitalSubscription = asyncHandler(async (_req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    message: 'Digital subscription activation is not part of the CMS staff workflow.',
    error: 'Not implemented'
  });
});
