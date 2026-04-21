import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import express, { NextFunction, Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FileStore, UserRecord } from './store.js';
import {
  Ad,
  MagazineIssue,
  MediaFile,
  NewsPost,
  SubscriptionRequest,
  SubscriptionStatus,
  UserRole
} from '../types.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');

const PORT = Number(process.env.PORT ?? 5174);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
const MAX_UPLOAD_SIZE_BYTES = Number(process.env.MAX_UPLOAD_SIZE_BYTES ?? 15 * 1024 * 1024);
const USER_ROLES = Object.values(UserRole);
const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ['ACTIVE', 'EXPIRED', 'PENDING'];
const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg'
]);

const store = new FileStore();
const googleAuthClient = GOOGLE_CLIENT_ID ? new OAuth2Client(GOOGLE_CLIENT_ID) : null;

interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function readString(value: unknown, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function readBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback;
}

function readNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function readStringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0).map((item) => item.trim());
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function toPublicUser(user: UserRecord) {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function sendSuccess<T>(response: Response, data: T, message = 'Request completed successfully.', status = 200) {
  return response.status(status).json({
    success: true,
    message,
    data
  });
}

function sendError(response: Response, status: number, message: string, error?: string) {
  return response.status(status).json({
    success: false,
    message,
    error
  });
}

function detectMediaKind(mimeType: string): MediaFile['kind'] {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'other';
}

function createToken(user: UserRecord) {
  return jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
}

async function authRequired(request: AuthenticatedRequest, response: Response, next: NextFunction) {
  const authorization = request.headers.authorization ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    sendError(response, 401, 'Authentication required.', 'Missing bearer token');
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string };
    if (!payload.userId) {
      sendError(response, 401, 'Invalid token.', 'Missing user identifier');
      return;
    }

    const user = store.getUserById(payload.userId);
    if (!user) {
      sendError(response, 401, 'Invalid token.', 'User no longer exists');
      return;
    }

    request.user = user;
    next();
  } catch (error) {
    sendError(response, 401, 'Invalid token.', error instanceof Error ? error.message : 'Token verification failed');
  }
}

function roleRequired(roles: UserRole[]) {
  return (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    const rank: Record<UserRole, number> = {
      [UserRole.GENERAL]: 0,
      [UserRole.MAGAZINE]: 1,
      [UserRole.ADMIN]: 2,
      [UserRole.SUPER_ADMIN]: 3
    };

    const minimumRank = Math.min(...roles.map((role) => rank[role]));
    if (!request.user || rank[request.user.role] < minimumRank) {
      sendError(response, 403, 'Insufficient permissions.');
      return;
    }

    next();
  };
}

function validateArticleInput(body: unknown, authorFallback: string): NewsPost | null {
  if (!isRecord(body)) {
    return null;
  }

  const title = readString(body.title);
  const category = readString(body.category);
  const excerpt = readString(body.excerpt);
  const content = readString(body.content);
  const image = readString(body.image);

  if (!title || !category || !excerpt || !content || !image) {
    return null;
  }

  return {
    id: readString(body.id) || createId('article'),
    title,
    category,
    excerpt,
    content,
    image,
    author: readString(body.author, authorFallback),
    date:
      readString(body.date) ||
      new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }),
    featured: readBoolean(body.featured),
    requiresSubscription: readBoolean(body.requiresSubscription)
  };
}

function validateMagazineInput(body: unknown): MagazineIssue | null {
  if (!isRecord(body)) {
    return null;
  }

  const title = readString(body.title);
  const issueNumber = readString(body.issueNumber);
  const coverImage = readString(body.coverImage);
  const pages = readStringArray(body.pages);
  const date = readString(body.date);

  if (!title || !issueNumber || !coverImage || !date) {
    return null;
  }

  return {
    id: readString(body.id) || createId('magazine'),
    title,
    issueNumber,
    coverImage,
    pdfUrl: readString(body.pdfUrl) || undefined,
    pages,
    date,
    priceDigital: readNumber(body.priceDigital),
    pricePhysical: readNumber(body.pricePhysical, 499),
    isFree: readBoolean(body.isFree),
    gatedPage: readNumber(body.gatedPage, 2),
    blurPaywall: readBoolean(body.blurPaywall)
  };
}

function validateAdsInput(body: unknown): Ad[] | null {
  if (!Array.isArray(body)) {
    return null;
  }

  const ads = body.map((item) => {
    if (!isRecord(item)) {
      return null;
    }

    const title = readString(item.title);
    const imageUrl = readString(item.imageUrl);
    const link = readString(item.link);
    const position = readString(item.position) as Ad['position'];

    if (!title || !imageUrl || !link || !['SIDEBAR_TOP', 'SIDEBAR_MID', 'SIDEBAR_BOTTOM', 'HOMEPAGE_BANNER'].includes(position)) {
      return null;
    }

    return {
      id: readString(item.id) || createId('ad'),
      title,
      imageUrl,
      link,
      position,
      description: readString(item.description) || undefined,
      ctaText: readString(item.ctaText) || undefined
    };
  });

  const validAds = ads.filter((item): item is NonNullable<typeof item> => item !== null);
  return validAds.length === body.length ? validAds : null;
}

function validateSubscriptionRequestInput(body: unknown): Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'> | null {
  if (!isRecord(body)) {
    return null;
  }

  const name = readString(body.name);
  const email = normalizeEmail(readString(body.email));
  const phone = readString(body.phone);
  const accessType = readString(body.accessType) as 'DIGITAL' | 'PHYSICAL';
  const resourceType = readString(body.resourceType) as 'MAGAZINE' | 'NEWS';
  const resourceId = readString(body.resourceId);
  const resourceTitle = readString(body.resourceTitle);

  if (!name || !email || !phone || !['DIGITAL', 'PHYSICAL'].includes(accessType) || !['MAGAZINE', 'NEWS'].includes(resourceType) || !resourceId || !resourceTitle) {
    return null;
  }

  return {
    name,
    email,
    phone,
    accessType,
    message: readString(body.message) || undefined,
    screenshotName: readString(body.screenshotName) || undefined,
    screenshotData: readString(body.screenshotData) || undefined,
    resourceType,
    resourceId,
    resourceTitle
  };
}

const uploadStorage = multer.diskStorage({
  destination: (_request, _file, callback) => {
    callback(null, UPLOADS_DIR);
  },
  filename: (_request, file, callback) => {
    callback(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: uploadStorage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES
  },
  fileFilter: (_request, file, callback) => {
    if (!ALLOWED_UPLOAD_MIME_TYPES.has(file.mimetype)) {
      callback(new Error('Unsupported file type'));
      return;
    }

    callback(null, true);
  }
});

async function start() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await store.init();

  const app = express();
  app.use(
    cors({
      origin: true
    })
  );
  app.use(express.json({ limit: '15mb' }));
  app.use('/uploads', express.static(UPLOADS_DIR));

  app.get('/api/health', (_request, response) => {
    sendSuccess(
      response,
      {
        ok: true,
        storage: 'file',
        databaseFile: store.getDatabaseFilePath()
      },
      'Health check passed.'
    );
  });

  app.get('/api/app-state', (_request, response) => {
    sendSuccess(response, store.getPublicAppState(), 'App state loaded.');
  });

  app.post('/api/auth/signup', async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const name = readString(body.name);
    const email = normalizeEmail(readString(body.email));
    const password = readString(body.password);

    if (!name || !email || !password) {
      sendError(response, 400, 'Name, email, and password are required.');
      return;
    }

    if (store.findUserByEmail(email)) {
      sendError(response, 409, 'Account already exists.');
      return;
    }

    const user = await store.createUser({
      email,
      name,
      role: UserRole.GENERAL,
      authProvider: 'PASSWORD',
      passwordHash: await bcrypt.hash(password, 10)
    });

    sendSuccess(
      response,
      {
        token: createToken(user),
        user: toPublicUser(user)
      },
      'Account created successfully.',
      201
    );
  });

  app.post('/api/auth/login', async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const email = normalizeEmail(readString(body.email));
    const password = readString(body.password);

    if (!email || !password) {
      sendError(response, 400, 'Email and password are required.');
      return;
    }

    const user = store.findUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      sendError(response, 401, 'Invalid credentials.');
      return;
    }

    sendSuccess(response, { token: createToken(user), user: toPublicUser(user) }, 'Login successful.');
  });

  app.post('/api/auth/google', async (request, response) => {
    if (!googleAuthClient || !GOOGLE_CLIENT_ID) {
      sendError(response, 500, 'Google sign-in is not configured.', 'Missing GOOGLE_CLIENT_ID');
      return;
    }

    const body = isRecord(request.body) ? request.body : {};
    const credential = readString(body.credential || body.idToken);

    if (!credential) {
      sendError(response, 400, 'Google credential is required.');
      return;
    }

    try {
      const ticket = await googleAuthClient.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID
      });
      const payload = ticket.getPayload();

      if (!payload?.email || !payload.sub || !payload.email_verified) {
        sendError(response, 401, 'Google account could not be verified.');
        return;
      }

      const user = await store.upsertGoogleUser({
        googleId: payload.sub,
        email: payload.email,
        name: readString(payload.name, payload.email.split('@')[0]),
        avatarUrl: readString(payload.picture) || undefined
      });

      if (!user) {
        sendError(response, 500, 'Unable to sign in with Google.');
        return;
      }

      sendSuccess(
        response,
        {
          token: createToken(user),
          user: toPublicUser(user),
          users: store.listUsers()
        },
        'Google login successful.'
      );
    } catch (error) {
      sendError(response, 401, 'Google sign-in failed.', error instanceof Error ? error.message : 'Unable to verify Google token');
    }
  });

  app.get('/api/auth/me', authRequired, (request: AuthenticatedRequest, response) => {
    sendSuccess(response, { user: toPublicUser(request.user as UserRecord) }, 'Authenticated user loaded.');
  });

  app.post('/api/users/login', async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const email = normalizeEmail(readString(body.email));

    if (!email) {
      sendError(response, 400, 'Email is required.');
      return;
    }

    let user = store.findUserByEmail(email);
    if (!user) {
      user = await store.createUser({
        email,
        name: email.split('@')[0],
        role: UserRole.GENERAL,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10)
      });
    }

    sendSuccess(
      response,
      {
        token: createToken(user),
        user: toPublicUser(user),
        users: store.listUsers()
      },
      'Quick login successful.'
    );
  });

  app.get('/api/users', authRequired, roleRequired([UserRole.SUPER_ADMIN]), (_request, response) => {
    sendSuccess(response, { users: store.listUsers() }, 'Users loaded.');
  });

  app.patch('/api/users/:id/role', authRequired, roleRequired([UserRole.SUPER_ADMIN]), async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const role = readString(body.role) as UserRole;

    if (!USER_ROLES.includes(role)) {
      sendError(response, 400, 'Invalid user role.');
      return;
    }

    const updated = await store.updateUser(readString(request.params.id), { role });
    if (!updated) {
      sendError(response, 404, 'User not found.');
      return;
    }

    sendSuccess(response, { users: store.listUsers() }, 'User role updated.');
  });

  app.post('/api/subscriptions/digital', async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const name = readString(body.name);
    const email = normalizeEmail(readString(body.email));
    const phone = readString(body.phone);

    if (!name || !email || !phone) {
      sendError(response, 400, 'Name, email, and phone are required.');
      return;
    }

    const user = await store.activateDigitalSubscription({ email, name });
    if (!user) {
      sendError(response, 500, 'Failed to activate digital subscription.');
      return;
    }

    sendSuccess(
      response,
      {
        token: createToken(user),
        user: toPublicUser(user),
        users: store.listUsers()
      },
      'Digital subscription activated.',
      201
    );
  });

  app.get('/api/articles', (_request, response) => {
    sendSuccess(response, { articles: store.listArticles() }, 'Articles loaded.');
  });

  app.get('/api/articles/:id', (request, response) => {
    const article = store.getArticleById(readString(request.params.id));
    if (!article) {
      sendError(response, 404, 'Article not found.');
      return;
    }

    sendSuccess(response, { article }, 'Article loaded.');
  });

  app.post('/api/articles', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request: AuthenticatedRequest, response) => {
    const article = validateArticleInput(request.body, request.user?.name ?? 'Editorial Desk');
    if (!article) {
      sendError(response, 400, 'Invalid article payload.');
      return;
    }

    const created = await store.createArticle(article);
    sendSuccess(response, { article: created, articles: store.listArticles(), news: store.listArticles() }, 'Article created.', 201);
  });

  app.patch('/api/articles/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    if (!isRecord(request.body)) {
      sendError(response, 400, 'Invalid article payload.');
      return;
    }

    const updated = await store.updateArticle(readString(request.params.id), {
      title: readString(request.body.title) || undefined,
      category: readString(request.body.category) || undefined,
      excerpt: readString(request.body.excerpt) || undefined,
      content: readString(request.body.content) || undefined,
      image: readString(request.body.image) || undefined,
      author: readString(request.body.author) || undefined,
      date: readString(request.body.date) || undefined,
      featured: typeof request.body.featured === 'boolean' ? request.body.featured : undefined,
      requiresSubscription: typeof request.body.requiresSubscription === 'boolean' ? request.body.requiresSubscription : undefined
    });

    if (!updated) {
      sendError(response, 404, 'Article not found.');
      return;
    }

    sendSuccess(response, { article: updated, articles: store.listArticles(), news: store.listArticles() }, 'Article updated.');
  });

  app.delete('/api/articles/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    const deleted = await store.deleteArticle(readString(request.params.id));
    if (!deleted) {
      sendError(response, 404, 'Article not found.');
      return;
    }

    sendSuccess(response, { deletedId: deleted.id, articles: store.listArticles(), news: store.listArticles() }, 'Article deleted.');
  });

  app.post('/api/news', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request: AuthenticatedRequest, response) => {
    const article = validateArticleInput(request.body, request.user?.name ?? 'Editorial Desk');
    if (!article) {
      sendError(response, 400, 'Invalid news payload.');
      return;
    }

    const created = await store.createArticle(article);
    sendSuccess(response, { article: created, news: store.listArticles() }, 'News article created.', 201);
  });

  app.patch('/api/news/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    if (!isRecord(request.body)) {
      sendError(response, 400, 'Invalid news payload.');
      return;
    }

    const updated = await store.updateArticle(readString(request.params.id), {
      title: readString(request.body.title) || undefined,
      category: readString(request.body.category) || undefined,
      excerpt: readString(request.body.excerpt) || undefined,
      content: readString(request.body.content) || undefined,
      image: readString(request.body.image) || undefined,
      author: readString(request.body.author) || undefined,
      date: readString(request.body.date) || undefined,
      featured: typeof request.body.featured === 'boolean' ? request.body.featured : undefined,
      requiresSubscription: typeof request.body.requiresSubscription === 'boolean' ? request.body.requiresSubscription : undefined
    });

    if (!updated) {
      sendError(response, 404, 'News article not found.');
      return;
    }

    sendSuccess(response, { article: updated, news: store.listArticles() }, 'News article updated.');
  });

  app.delete('/api/news/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    const deleted = await store.deleteArticle(readString(request.params.id));
    if (!deleted) {
      sendError(response, 404, 'News article not found.');
      return;
    }

    sendSuccess(response, { deletedId: deleted.id, news: store.listArticles() }, 'News article deleted.');
  });

  app.get('/api/magazines', (_request, response) => {
    sendSuccess(response, { magazines: store.listMagazines() }, 'Magazines loaded.');
  });

  app.post('/api/magazines', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    const magazine = validateMagazineInput(request.body);
    if (!magazine) {
      sendError(response, 400, 'Invalid magazine payload.');
      return;
    }

    const created = await store.createMagazine(magazine);
    sendSuccess(response, { magazine: created, magazines: store.listMagazines() }, 'Magazine created.', 201);
  });

  app.patch('/api/magazines/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    if (!isRecord(request.body)) {
      sendError(response, 400, 'Invalid magazine payload.');
      return;
    }

    const updated = await store.updateMagazine(readString(request.params.id), {
      title: readString(request.body.title) || undefined,
      issueNumber: readString(request.body.issueNumber) || undefined,
      coverImage: readString(request.body.coverImage) || undefined,
      pdfUrl: readString(request.body.pdfUrl) || undefined,
      pages: Array.isArray(request.body.pages) ? readStringArray(request.body.pages) : undefined,
      date: readString(request.body.date) || undefined,
      priceDigital: request.body.priceDigital !== undefined ? readNumber(request.body.priceDigital) : undefined,
      pricePhysical: request.body.pricePhysical !== undefined ? readNumber(request.body.pricePhysical) : undefined,
      isFree: typeof request.body.isFree === 'boolean' ? request.body.isFree : undefined,
      gatedPage: request.body.gatedPage !== undefined ? readNumber(request.body.gatedPage) : undefined,
      blurPaywall: typeof request.body.blurPaywall === 'boolean' ? request.body.blurPaywall : undefined
    });

    if (!updated) {
      sendError(response, 404, 'Magazine not found.');
      return;
    }

    sendSuccess(response, { magazine: updated, magazines: store.listMagazines() }, 'Magazine updated.');
  });

  app.delete('/api/magazines/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    const deleted = await store.deleteMagazine(readString(request.params.id));
    if (!deleted) {
      sendError(response, 404, 'Magazine not found.');
      return;
    }

    sendSuccess(response, { deletedId: deleted.id, magazines: store.listMagazines() }, 'Magazine deleted.');
  });

  app.get('/api/ads', (_request, response) => {
    sendSuccess(response, { ads: store.listAds() }, 'Ads loaded.');
  });

  app.put('/api/ads', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), async (request, response) => {
    const ads = validateAdsInput(request.body);
    if (!ads) {
      sendError(response, 400, 'Ads payload must be a valid array.');
      return;
    }

    sendSuccess(response, { ads: await store.replaceAds(ads) }, 'Ads updated.');
  });

  const handleUpload = (request: AuthenticatedRequest, response: Response) => {
    upload.single('file')(request, response, async (error) => {
      if (error instanceof multer.MulterError) {
        const message =
          error.code === 'LIMIT_FILE_SIZE'
            ? `File exceeds the ${Math.round(MAX_UPLOAD_SIZE_BYTES / (1024 * 1024))}MB size limit.`
            : error.message;
        sendError(response, 400, message);
        return;
      }

      if (error) {
        sendError(response, 400, error.message || 'Upload failed.');
        return;
      }

      if (!request.file) {
        sendError(response, 400, 'No file uploaded.');
        return;
      }

      const media = await store.createMedia({
        originalName: request.file.originalname,
        storedName: request.file.filename,
        mimeType: request.file.mimetype,
        size: request.file.size,
        url: `/uploads/${request.file.filename}`,
        kind: detectMediaKind(request.file.mimetype)
      });

      sendSuccess(response, { media }, 'File uploaded successfully.', 201);
    });
  };

  app.post('/api/uploads', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), handleUpload);
  app.post('/api/files', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), handleUpload);

  const listMedia = (request: Request, response: Response) => {
    const search = readString(request.query.search);
    const kind = readString(request.query.kind) as MediaFile['kind'];
    const media = store.listMedia({
      search,
      kind: ['image', 'audio', 'pdf', 'other'].includes(kind) ? kind : undefined
    });

    sendSuccess(response, { media }, 'Files loaded.');
  };

  app.get('/api/media', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), listMedia);
  app.get('/api/files', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), listMedia);

  const deleteMedia = async (request: Request, response: Response) => {
    const media = await store.deleteMedia(readString(request.params.id));
    if (!media) {
      sendError(response, 404, 'File not found.');
      return;
    }

    const filePath = path.join(UPLOADS_DIR, media.storedName);
    await fs.rm(filePath, { force: true });

    sendSuccess(response, { deletedId: media.id }, 'File deleted.');
  };

  app.delete('/api/media/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), deleteMedia);
  app.delete('/api/files/:id', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), deleteMedia);

  app.post('/api/subscription-requests', async (request, response) => {
    const payload = validateSubscriptionRequestInput(request.body);
    if (!payload) {
      sendError(response, 400, 'Invalid subscription request payload.');
      return;
    }

    const requestRecord = await store.createSubscriptionRequest({
      ...payload,
      status: payload.accessType === 'PHYSICAL' ? 'PENDING' : 'ACTIVE'
    });

    if (payload.accessType === 'PHYSICAL') {
      await store.ensurePhysicalSubscriptionUser({
        email: payload.email,
        name: payload.name,
        status: 'PENDING'
      });
    }

    sendSuccess(response, { requestId: requestRecord.id, request: requestRecord }, 'Subscription request submitted.', 201);
  });

  app.post('/api/unlock-requests', async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const payload = validateSubscriptionRequestInput({
      ...body,
      resourceType: readString(body.resourceType) || 'MAGAZINE',
      resourceId: readString(body.resourceId) || readString(body.magazineId),
      resourceTitle: readString(body.resourceTitle) || readString(body.magazineTitle)
    });

    if (!payload) {
      sendError(response, 400, 'Invalid unlock request payload.');
      return;
    }

    const requestRecord = await store.createSubscriptionRequest({
      ...payload,
      status: payload.accessType === 'PHYSICAL' ? 'PENDING' : 'ACTIVE'
    });

    if (payload.accessType === 'PHYSICAL') {
      await store.ensurePhysicalSubscriptionUser({
        email: payload.email,
        name: payload.name,
        status: 'PENDING'
      });
    }

    sendSuccess(response, { requestId: requestRecord.id, request: requestRecord }, 'Unlock request submitted.', 201);
  });

  app.get('/api/subscription-requests', authRequired, roleRequired([UserRole.ADMIN, UserRole.MAGAZINE]), (_request, response) => {
    sendSuccess(response, { requests: store.listSubscriptionRequests() }, 'Subscription requests loaded.');
  });

  app.patch('/api/subscription-requests/:id', authRequired, roleRequired([UserRole.ADMIN]), async (request, response) => {
    const body = isRecord(request.body) ? request.body : {};
    const status = readString(body.status) as SubscriptionStatus;

    if (!SUBSCRIPTION_STATUSES.includes(status)) {
      sendError(response, 400, 'Invalid subscription status.');
      return;
    }

    const updatedRequest = await store.updateSubscriptionRequest(readString(request.params.id), status);
    if (!updatedRequest) {
      sendError(response, 404, 'Subscription request not found.');
      return;
    }

    if (updatedRequest.accessType === 'PHYSICAL') {
      await store.updatePhysicalSubscriptionStatus(updatedRequest.email, status);
    }

    sendSuccess(response, { request: updatedRequest }, 'Subscription request updated.');
  });

  app.use((_request, response) => {
    sendError(response, 404, 'Endpoint not found.');
  });

  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
    console.log(`File-backed data store: ${store.getDatabaseFilePath()}`);
  });
}

start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
