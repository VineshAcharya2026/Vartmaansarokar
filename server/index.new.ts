import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'node:crypto';

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
import { authenticate, requireAnyRole, requireRole, AuthenticatedRequest } from './middlewares/auth.js';
import { UserRole } from '../types.js';

// Import utilities
import { OAuth2Client } from 'google-auth-library';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const TICKER_FILE = path.join(ROOT_DIR, 'server', 'data', 'ticker.json');

const PORT = Number(process.env.PORT ?? 5174);

async function start() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await store.init();
  await fs.mkdir(path.dirname(TICKER_FILE), { recursive: true });
  try {
    await fs.access(TICKER_FILE);
  } catch {
    await fs.writeFile(TICKER_FILE, '[]', 'utf8');
  }

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

  // Ticker state (local file-backed for dev server parity)
  type TickerItem = {
    id: string;
    text: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
  };

  const readTickerItems = async (): Promise<TickerItem[]> => {
    const raw = await fs.readFile(TICKER_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  };

  const writeTickerItems = async (items: TickerItem[]) => {
    await fs.writeFile(TICKER_FILE, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  };

  const decodeXml = (value: string) =>
    value
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");

  const parseRssItems = (xml: string) => {
    const itemPattern = /<item>([\s\S]*?)<\/item>/g;
    const parsed: Array<{ id: string; text: string; url: string }> = [];
    for (const match of xml.matchAll(itemPattern)) {
      const chunk = match[1] ?? '';
      const title = decodeXml((chunk.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
        ?? chunk.match(/<title>([\s\S]*?)<\/title>/)?.[1]
        ?? '').trim());
      const url = decodeXml((chunk.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? '').trim());
      if (!title || !url) continue;
      parsed.push({
        id: `cricket_${crypto.randomUUID()}`,
        text: title,
        url
      });
    }
    return parsed;
  };

  app.get('/api/ticker', asyncHandler(async (_req: Request, res: Response) => {
    const items = (await readTickerItems()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    res.json({
      success: true,
      message: 'Ticker loaded.',
      data: { items }
    });
  }));

  app.get('/api/ticker/cricket', asyncHandler(async (_req: Request, res: Response) => {
    const rssUrl = 'https://news.google.com/rss/search?q=cricket+OR+IPL&hl=en-IN&gl=IN&ceid=IN:en';
    try {
      const response = await fetch(rssUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; VartmaanTicker/1.0)'
        }
      });
      if (!response.ok) {
        return res.status(502).json({
          success: false,
          message: 'Unable to fetch cricket headlines.'
        });
      }
      const xml = await response.text();
      const items = parseRssItems(xml).slice(0, 12);
      res.json({
        success: true,
        message: 'Cricket ticker loaded.',
        data: { items }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to load cricket ticker.'
      });
    }
  }));

  app.post(
    '/api/ticker',
    authenticate,
    requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const text = String(req.body?.text ?? '').trim();
      if (!text) {
        return res.status(400).json({ success: false, message: 'Ticker text is required.' });
      }
      const now = new Date().toISOString();
      const nextItem: TickerItem = {
        id: `ticker_${crypto.randomUUID()}`,
        text,
        active: true,
        createdAt: now,
        updatedAt: now
      };
      const items = await readTickerItems();
      items.unshift(nextItem);
      await writeTickerItems(items);
      res.status(201).json({ success: true, message: 'Ticker created.', data: { item: nextItem } });
    })
  );

  app.put(
    '/api/ticker/:id',
    authenticate,
    requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = String(req.params.id);
      const items = await readTickerItems();
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) {
        return res.status(404).json({ success: false, message: 'Ticker item not found.' });
      }

      const nextText = req.body?.text;
      const nextActive = req.body?.active;
      if (nextText !== undefined) items[index].text = String(nextText).trim() || items[index].text;
      if (nextActive !== undefined) items[index].active = Boolean(nextActive);
      items[index].updatedAt = new Date().toISOString();

      await writeTickerItems(items);
      res.json({ success: true, message: 'Ticker updated.', data: { item: items[index] } });
    })
  );

  app.delete(
    '/api/ticker/:id',
    authenticate,
    requireAnyRole(UserRole.ADMIN, UserRole.SUPER_ADMIN),
    asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
      const id = String(req.params.id);
      const items = await readTickerItems();
      const nextItems = items.filter((item) => item.id !== id);
      await writeTickerItems(nextItems);
      res.json({ success: true, message: 'Ticker deleted.', data: { deletedId: id } });
    })
  );

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
