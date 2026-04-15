import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { sharedStore as store } from '../store.js';
import { UserRole } from '../../types.js';
import { AppError } from '../utils/errorHandler.js';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
export class AuthService {
    googleAuthClient;
    constructor() {
        this.googleAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;
    }
    async signup(email, name, password, role = UserRole.EDITOR) {
        const existingUser = store.findUserByEmail(email);
        if (existingUser)
            throw new AppError('Account already exists.', 409);
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await store.createUser({
            email,
            name,
            role,
            authProvider: 'PASSWORD',
            passwordHash: hashedPassword
        });
        const token = this.generateToken(user);
        return { token, refreshToken: token, user: this.toPublicUser(user) };
    }
    async login(email, password) {
        const user = store.findUserByEmail(email);
        if (!user || user.isActive === false || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new AppError('Invalid credentials.', 401);
        }
        const token = this.generateToken(user);
        return { token, refreshToken: token, user: this.toPublicUser(user) };
    }
    async googleLogin(credential) {
        if (!this.googleAuthClient || !GOOGLE_CLIENT_ID) {
            throw new AppError('Google sign-in is not configured on the server.', 503);
        }
        let ticket;
        try {
            ticket = await this.googleAuthClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
        }
        catch {
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
        if (!user)
            throw new AppError('Unable to sign in with Google.', 500);
        const token = this.generateToken(user);
        return { token, refreshToken: token, user: this.toPublicUser(user) };
    }
    async quickLogin(email) {
        const user = store.findUserByEmail(email);
        if (!user || user.isActive === false) {
            throw new AppError('Invalid credentials.', 401);
        }
        const token = this.generateToken(user);
        return { token, refreshToken: token, user: this.toPublicUser(user) };
    }
    async refresh(userId) {
        const user = store.getUserById(userId);
        if (!user || user.isActive === false)
            throw new AppError('Invalid session.', 401);
        const token = this.generateToken(user);
        return { token, refreshToken: token, user: this.toPublicUser(user) };
    }
    async logout() {
        return { ok: true };
    }
    getCurrentUser(userId) {
        const user = store.getUserById(userId);
        if (!user || user.isActive === false)
            throw new AppError('User not found.', 404);
        return this.toPublicUser(user);
    }
    generateToken(user) {
        return jwt.sign({ userId: user.id, role: user.role, email: user.email, name: user.name }, JWT_SECRET, { expiresIn: '7d' });
    }
    toPublicUser(user) {
        const { passwordHash, ...safeUser } = user;
        return safeUser;
    }
}
