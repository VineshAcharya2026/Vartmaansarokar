import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Import utilities and services
import { errorHandler, asyncHandler } from './utils/errorHandler.js';
import { sharedStore as store } from './store.js';

// Import middlewares
import { securityHeaders, apiLimiter } from './middlewares/security.js';

// Import routes
import authRoutes from './routes/auth.js';
import contentRoutes from './routes/content.js';
import mediaRoutes from './routes/media.js';
import subscriptionRoutes from './routes/subscription.js';
import userRoutes from './routes/user.js';
import { authenticate, requireRole, AuthenticatedRequest } from './middlewares/auth.js';
import { UserRole } from '../types.js';

// Import utilities
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

const PORT = Number(process.env.PORT ?? 5174);

async function start() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await store.init();

  const app = express();

  // Security middleware
  app.use(securityHeaders);

  // CORS configuration
  const allowedOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: process.env.NODE_ENV === 'production'
        ? (origin, callback) => callback(null, !origin || allowedOrigins.includes(origin))
        : true,
      credentials: true
    })
  );

  // General rate limiting
  app.use('/api', apiLimiter);

  // Body parsing
  app.use(express.json({ limit: '15mb' }));

  // Cookie parsing (required for httpOnly auth_token cookie)
  app.use(cookieParser());

  // Static files
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.get('/api/health', (req, res) => {
    res.json({
      success: true,
      message: 'Health check passed.',
      data: {
        ok: true,
        storage: 'file',
        databaseFile: store.getDatabaseFilePath()
      }
    });
  });

  // App state
  app.get('/api/app-state', (req, res) => {
    res.json({
      success: true,
      message: 'App state loaded.',
      data: store.getPublicAppState()
    });
  });

  // Mount routes
  app.use('/api/auth', authRoutes);
  app.use('/api', contentRoutes);
  app.use('/api', mediaRoutes);
  app.use('/api', subscriptionRoutes);
  app.use('/api', userRoutes);
  app.get('/api/dashboard/stats', authenticate, (req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Dashboard stats loaded.',
      data: { stats: store.getDashboardStats(req.user!) }
    });
  });
  app.get('/api/audit-logs', authenticate, requireRole(UserRole.SUPER_ADMIN), (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      message: 'Audit logs loaded.',
      data: { logs: store.listAuditLogs() }
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      message: 'Endpoint not found.'
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`File-backed data store: ${store.getDatabaseFilePath()}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
