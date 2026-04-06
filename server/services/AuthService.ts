import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { sharedStore as store } from '../store.js';
import { UserRole } from '../../types.js';
import { AppError } from '../utils/errorHandler.js';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';

export class AuthService {
  private googleAuthClient: OAuth2Client | null;

  constructor() {
    this.googleAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
  }

  async signup(email: string, name: string, password: string) {
    const existingUser = store.findUserByEmail(email);
    if (existingUser) {
      throw new AppError('Account already exists.', 409);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await store.createUser({
      email,
      name,
      role: UserRole.GENERAL,
      authProvider: 'PASSWORD',
      passwordHash: hashedPassword
    });

    const token = this.generateToken(user);
    return { token, user };
  }

  async login(email: string, password: string) {
    const user = store.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new AppError('Invalid credentials.', 401);
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  async googleLogin(credential: string) {
    if (!this.googleAuthClient || !GOOGLE_CLIENT_ID) {
      throw new AppError('Google sign-in is not configured on the server.', 503);
    }

    let ticket;
    try {
      ticket = await this.googleAuthClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
    } catch (verifyError) {
      throw new AppError('Google token verification failed.', 401);
    }

    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub || !payload.email_verified) {
      throw new AppError('Google account could not be verified.', 401);
    }

    const user = await store.upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      avatarUrl: payload.picture
    });

    if (!user) {
      throw new AppError('Unable to sign in with Google.', 500);
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  async quickLogin(email: string) {
    let user = store.findUserByEmail(email);
    if (!user) {
      const hashedPassword = await bcrypt.hash(crypto.randomUUID(), 10);
      user = await store.createUser({
        email,
        name: email.split('@')[0],
        role: UserRole.GENERAL,
        passwordHash: hashedPassword
      });
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  async activateDigitalSubscription(name: string, email: string, phone: string) {
    const user = await store.activateDigitalSubscription({ email, name });
    if (!user) {
      throw new AppError('Failed to activate digital subscription.', 500);
    }

    const token = this.generateToken(user);
    return { token, user };
  }

  getCurrentUser(userId: string) {
    const user = store.getUserById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  private generateToken(user: { id: string; role: string }) {
    return jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  }
}