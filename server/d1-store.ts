import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import {
  Ad,
  AppStatePayload,
  MagazineIssue,
  MediaFile,
  NewsPost,
  SubscriptionRequest,
  SubscriptionStatus,
  User,
  UserRole
} from '../types.js';

export interface UserRecord extends User {
  passwordHash: string;
}

interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  authProvider?: UserRecord['authProvider'];
  googleId?: string;
  avatarUrl?: string;
  subscription?: {
    type: 'DIGITAL' | 'PHYSICAL';
    status: SubscriptionStatus;
    expiryDate: string;
  };
}

interface MediaFilters {
  search?: string;
  kind?: MediaFile['kind'];
}

// D1 Database interface
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T>(statements: D1PreparedStatement[]): Promise<T[]>;
  exec(query: string): Promise<{
    count: number;
    duration: number;
  }>;
}

export interface D1PreparedStatement {
  bind(...values: any[]): D1PreparedStatement;
  first<T>(): Promise<T | null>;
  run(): Promise<{
    success: boolean;
    meta: {
      changes: number;
      duration: number;
    };
  }>;
  all<T>(): Promise<{
    results: T[];
    success: boolean;
    meta: {
      duration: number;
    };
  }>;
  raw<T>(): Promise<T[]>;
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function sanitizeUser(row: any): User {
  const { password_hash, passwordHash, ...safeUser } = row;
  return {
    ...safeUser,
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    authProvider: row.auth_provider || row.authProvider,
    googleId: row.google_id || row.googleId,
    avatarUrl: row.avatar_url || row.avatarUrl,
    subscription: row.subscription_type ? {
      type: row.subscription_type,
      status: row.subscription_status,
      expiryDate: row.subscription_expiry_date
    } : undefined,
    createdAt: row.created_at || row.createdAt,
    updatedAt: row.updated_at || row.updatedAt
  };
}

function rowToUser(row: any): UserRecord {
  return {
    ...sanitizeUser(row),
    passwordHash: row.password_hash || row.passwordHash
  };
}

function rowToArticle(row: any): NewsPost {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    excerpt: row.excerpt,
    content: row.content,
    image: row.image,
    author: row.author,
    date: row.date,
    featured: Boolean(row.featured),
    requiresSubscription: Boolean(row.requires_subscription),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToMagazine(row: any): MagazineIssue {
  return {
    id: row.id,
    title: row.title,
    issueNumber: row.issue_number,
    coverImage: row.cover_image,
    pdfUrl: row.pdf_url,
    pages: JSON.parse(row.pages || '[]'),
    date: row.date,
    priceDigital: row.price_digital || 0,
    pricePhysical: row.price_physical || 499,
    isFree: Boolean(row.is_free),
    gatedPage: row.gated_page || 2,
    blurPaywall: Boolean(row.blur_paywall),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToAd(row: any): Ad {
  return {
    id: row.id,
    title: row.title,
    imageUrl: row.image_url,
    link: row.link,
    position: row.position,
    description: row.description,
    ctaText: row.cta_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function rowToMedia(row: any): MediaFile {
  return {
    id: row.id,
    originalName: row.original_name,
    storedName: row.stored_name,
    url: row.url,
    kind: row.kind,
    mimeType: row.mime_type,
    size: row.size,
    createdAt: row.created_at
  };
}

function rowToSubscriptionRequest(row: any): SubscriptionRequest {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    accessType: row.access_type,
    resourceType: row.resource_type,
    resourceId: row.resource_id,
    resourceTitle: row.resource_title,
    message: row.message,
    status: row.status,
    screenshotName: row.screenshot_name,
    screenshotData: row.screenshot_data,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export class D1Store {
  private db: D1Database | null = null;

  async init(database?: D1Database) {
    if (database) {
      this.db = database;
    }
  }

  get isConnected() {
    return this.db !== null;
  }

  private requireDb(): D1Database {
    if (!this.db) {
      throw new Error('D1 database not initialized');
    }
    return this.db;
  }

  // ============ Users ============
  async listUsers(): Promise<User[]> {
    const db = this.requireDb();
    const result = await db.prepare(
      'SELECT * FROM users ORDER BY created_at ASC'
    ).all<any>();
    return result.results.map(sanitizeUser);
  }

  async getUserById(id: string): Promise<UserRecord | null> {
    const db = this.requireDb();
    const row = await db.prepare(
      'SELECT * FROM users WHERE id = ?'
    ).bind(id).first<any>();
    return row ? rowToUser(row) : null;
  }

  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const db = this.requireDb();
    const row = await db.prepare(
      'SELECT * FROM users WHERE email = ? COLLATE NOCASE'
    ).bind(email.trim().toLowerCase()).first<any>();
    return row ? rowToUser(row) : null;
  }

  async findUserByGoogleId(googleId: string): Promise<UserRecord | null> {
    const db = this.requireDb();
    const row = await db.prepare(
      'SELECT * FROM users WHERE google_id = ?'
    ).bind(googleId).first<any>();
    return row ? rowToUser(row) : null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const db = this.requireDb();
    const id = createId('user');
    const now = nowIso();
    
    await db.prepare(`
      INSERT INTO users (id, email, name, role, auth_provider, google_id, avatar_url, password_hash, 
        subscription_type, subscription_status, subscription_expiry_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.email.trim().toLowerCase(),
      input.name.trim(),
      input.role,
      input.authProvider || 'PASSWORD',
      input.googleId || null,
      input.avatarUrl || null,
      input.passwordHash,
      input.subscription?.type || null,
      input.subscription?.status || null,
      input.subscription?.expiryDate || null,
      now,
      now
    ).run();

    const user = await this.getUserById(id);
    if (!user) throw new Error('Failed to create user');
    return user;
  }

  async updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>): Promise<UserRecord | null> {
    const db = this.requireDb();
    const user = await this.getUserById(id);
    if (!user) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.email) {
      fields.push('email = ?');
      values.push(updates.email.trim().toLowerCase());
    }
    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name.trim());
    }
    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }
    if (updates.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      values.push(updates.avatarUrl);
    }
    if (updates.googleId !== undefined) {
      fields.push('google_id = ?');
      values.push(updates.googleId);
    }
    if (updates.authProvider) {
      fields.push('auth_provider = ?');
      values.push(updates.authProvider);
    }
    if (updates.passwordHash) {
      fields.push('password_hash = ?');
      values.push(updates.passwordHash);
    }
    if (updates.subscription) {
      fields.push('subscription_type = ?, subscription_status = ?, subscription_expiry_date = ?');
      values.push(updates.subscription.type, updates.subscription.status, updates.subscription.expiryDate);
    }

    fields.push('updated_at = ?');
    values.push(nowIso());
    values.push(id);

    await db.prepare(`
      UPDATE users SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return this.getUserById(id);
  }

  // ============ Articles ============
  async listArticles(): Promise<NewsPost[]> {
    const db = this.requireDb();
    const result = await db.prepare(
      'SELECT * FROM articles ORDER BY created_at DESC'
    ).all<any>();
    return result.results.map(rowToArticle);
  }

  async getArticleById(id: string): Promise<NewsPost | null> {
    const db = this.requireDb();
    const row = await db.prepare(
      'SELECT * FROM articles WHERE id = ?'
    ).bind(id).first<any>();
    return row ? rowToArticle(row) : null;
  }

  async createArticle(input: NewsPost): Promise<NewsPost> {
    const db = this.requireDb();
    const id = input.id || createId('article');
    const now = nowIso();

    await db.prepare(`
      INSERT INTO articles (id, title, category, excerpt, content, image, author, date, featured, requires_subscription, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.title,
      input.category,
      input.excerpt,
      input.content,
      input.image,
      input.author,
      input.date,
      input.featured ? 1 : 0,
      input.requiresSubscription ? 1 : 0,
      now,
      now
    ).run();

    const article = await this.getArticleById(id);
    if (!article) throw new Error('Failed to create article');
    return article;
  }

  async updateArticle(id: string, updates: Partial<NewsPost>): Promise<NewsPost | null> {
    const db = this.requireDb();
    const article = await this.getArticleById(id);
    if (!article) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.category) { fields.push('category = ?'); values.push(updates.category); }
    if (updates.excerpt) { fields.push('excerpt = ?'); values.push(updates.excerpt); }
    if (updates.content) { fields.push('content = ?'); values.push(updates.content); }
    if (updates.image) { fields.push('image = ?'); values.push(updates.image); }
    if (updates.author) { fields.push('author = ?'); values.push(updates.author); }
    if (updates.date) { fields.push('date = ?'); values.push(updates.date); }
    if (updates.featured !== undefined) { fields.push('featured = ?'); values.push(updates.featured ? 1 : 0); }
    if (updates.requiresSubscription !== undefined) { fields.push('requires_subscription = ?'); values.push(updates.requiresSubscription ? 1 : 0); }

    fields.push('updated_at = ?');
    values.push(nowIso());
    values.push(id);

    await db.prepare(`
      UPDATE articles SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return this.getArticleById(id);
  }

  async deleteArticle(id: string): Promise<NewsPost | null> {
    const db = this.requireDb();
    const article = await this.getArticleById(id);
    if (!article) return null;

    await db.prepare('DELETE FROM articles WHERE id = ?').bind(id).run();
    return article;
  }

  // ============ Magazines ============
  async listMagazines(): Promise<MagazineIssue[]> {
    const db = this.requireDb();
    const result = await db.prepare(
      'SELECT * FROM magazines ORDER BY created_at DESC'
    ).all<any>();
    return result.results.map(rowToMagazine);
  }

  async getMagazineById(id: string): Promise<MagazineIssue | null> {
    const db = this.requireDb();
    const row = await db.prepare(
      'SELECT * FROM magazines WHERE id = ?'
    ).bind(id).first<any>();
    return row ? rowToMagazine(row) : null;
  }

  async createMagazine(input: MagazineIssue): Promise<MagazineIssue> {
    const db = this.requireDb();
    const id = input.id || createId('magazine');
    const now = nowIso();

    await db.prepare(`
      INSERT INTO magazines (id, title, issue_number, cover_image, pdf_url, pages, date, price_digital, price_physical, is_free, gated_page, blur_paywall, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.title,
      input.issueNumber,
      input.coverImage,
      input.pdfUrl || null,
      JSON.stringify(input.pages || []),
      input.date,
      input.priceDigital || 0,
      input.pricePhysical || 499,
      input.isFree ? 1 : 0,
      input.gatedPage || 2,
      input.blurPaywall !== false ? 1 : 0,
      now,
      now
    ).run();

    const magazine = await this.getMagazineById(id);
    if (!magazine) throw new Error('Failed to create magazine');
    return magazine;
  }

  async updateMagazine(id: string, updates: Partial<MagazineIssue>): Promise<MagazineIssue | null> {
    const db = this.requireDb();
    const magazine = await this.getMagazineById(id);
    if (!magazine) return null;

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.title) { fields.push('title = ?'); values.push(updates.title); }
    if (updates.issueNumber) { fields.push('issue_number = ?'); values.push(updates.issueNumber); }
    if (updates.coverImage) { fields.push('cover_image = ?'); values.push(updates.coverImage); }
    if (updates.pdfUrl !== undefined) { fields.push('pdf_url = ?'); values.push(updates.pdfUrl); }
    if (updates.pages) { fields.push('pages = ?'); values.push(JSON.stringify(updates.pages)); }
    if (updates.date) { fields.push('date = ?'); values.push(updates.date); }
    if (updates.priceDigital !== undefined) { fields.push('price_digital = ?'); values.push(updates.priceDigital); }
    if (updates.pricePhysical !== undefined) { fields.push('price_physical = ?'); values.push(updates.pricePhysical); }
    if (updates.isFree !== undefined) { fields.push('is_free = ?'); values.push(updates.isFree ? 1 : 0); }
    if (updates.gatedPage !== undefined) { fields.push('gated_page = ?'); values.push(updates.gatedPage); }
    if (updates.blurPaywall !== undefined) { fields.push('blur_paywall = ?'); values.push(updates.blurPaywall ? 1 : 0); }

    fields.push('updated_at = ?');
    values.push(nowIso());
    values.push(id);

    await db.prepare(`
      UPDATE magazines SET ${fields.join(', ')} WHERE id = ?
    `).bind(...values).run();

    return this.getMagazineById(id);
  }

  async deleteMagazine(id: string): Promise<MagazineIssue | null> {
    const db = this.requireDb();
    const magazine = await this.getMagazineById(id);
    if (!magazine) return null;

    await db.prepare('DELETE FROM magazines WHERE id = ?').bind(id).run();
    return magazine;
  }

  // ============ Ads ============
  async listAds(): Promise<Ad[]> {
    const db = this.requireDb();
    const result = await db.prepare(
      'SELECT * FROM ads ORDER BY position ASC, created_at DESC'
    ).all<any>();
    return result.results.map(rowToAd);
  }

  async replaceAds(ads: Ad[]): Promise<Ad[]> {
    const db = this.requireDb();
    
    // Delete all existing ads
    await db.prepare('DELETE FROM ads').run();
    
    // Insert new ads
    const now = nowIso();
    const statements = ads.map((ad, index) => {
      const id = ad.id || createId('ad');
      return db.prepare(`
        INSERT INTO ads (id, title, image_url, link, position, description, cta_text, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        ad.title,
        ad.imageUrl,
        ad.link,
        ad.position,
        ad.description || null,
        ad.ctaText || null,
        new Date(Date.now() - index * 1000).toISOString(),
        now
      );
    });

    if (statements.length > 0) {
      await db.batch(statements);
    }

    return this.listAds();
  }

  // ============ Media ============
  async listMedia(filters: MediaFilters = {}): Promise<MediaFile[]> {
    const db = this.requireDb();
    let query = 'SELECT * FROM media WHERE 1=1';
    const values: any[] = [];

    if (filters.kind) {
      query += ' AND kind = ?';
      values.push(filters.kind);
    }
    if (filters.search) {
      query += ' AND original_name LIKE ?';
      values.push(`%${filters.search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await db.prepare(query).bind(...values).all<any>();
    return result.results.map(rowToMedia);
  }

  async createMedia(input: Omit<MediaFile, 'id' | 'createdAt'>): Promise<MediaFile> {
    const db = this.requireDb();
    const id = createId('media');

    await db.prepare(`
      INSERT INTO media (id, original_name, stored_name, url, kind, mime_type, size, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.originalName,
      input.storedName,
      input.url,
      input.kind,
      input.mimeType,
      input.size,
      nowIso()
    ).run();

    const media = await db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<any>();
    if (!media) throw new Error('Failed to create media');
    return rowToMedia(media);
  }

  async deleteMedia(id: string): Promise<MediaFile | null> {
    const db = this.requireDb();
    const media = await db.prepare('SELECT * FROM media WHERE id = ?').bind(id).first<any>();
    if (!media) return null;

    await db.prepare('DELETE FROM media WHERE id = ?').bind(id).run();
    return rowToMedia(media);
  }

  // ============ Subscription Requests ============
  async listSubscriptionRequests(): Promise<SubscriptionRequest[]> {
    const db = this.requireDb();
    const result = await db.prepare(
      'SELECT * FROM subscription_requests ORDER BY created_at DESC'
    ).all<any>();
    return result.results.map(rowToSubscriptionRequest);
  }

  async createSubscriptionRequest(input: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { status?: SubscriptionStatus }): Promise<SubscriptionRequest> {
    const db = this.requireDb();
    const id = createId('subscription');
    const now = nowIso();

    await db.prepare(`
      INSERT INTO subscription_requests (id, name, email, phone, access_type, resource_type, resource_id, resource_title, message, status, screenshot_name, screenshot_data, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      input.name,
      input.email,
      input.phone,
      input.accessType,
      input.resourceType,
      input.resourceId,
      input.resourceTitle,
      input.message || null,
      input.status || 'PENDING',
      input.screenshotName || null,
      input.screenshotData || null,
      now,
      now
    ).run();

    const request = await db.prepare('SELECT * FROM subscription_requests WHERE id = ?').bind(id).first<any>();
    if (!request) throw new Error('Failed to create subscription request');
    return rowToSubscriptionRequest(request);
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus): Promise<SubscriptionRequest | null> {
    const db = this.requireDb();
    const request = await db.prepare('SELECT * FROM subscription_requests WHERE id = ?').bind(id).first<any>();
    if (!request) return null;

    await db.prepare(`
      UPDATE subscription_requests SET status = ?, updated_at = ? WHERE id = ?
    `).bind(status, nowIso(), id).run();

    return this.getSubscriptionRequestById(id);
  }

  async getSubscriptionRequestById(id: string): Promise<SubscriptionRequest | null> {
    const db = this.requireDb();
    const row = await db.prepare('SELECT * FROM subscription_requests WHERE id = ?').bind(id).first<any>();
    return row ? rowToSubscriptionRequest(row) : null;
  }

  // ============ Helper Methods ============
  async ensurePhysicalSubscriptionUser(payload: { email: string; name: string; status: SubscriptionStatus }): Promise<UserRecord> {
    const existing = await this.findUserByEmail(payload.email);

    if (!existing) {
      return this.createUser({
        email: payload.email,
        name: payload.name,
        role: UserRole.GENERAL,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        authProvider: 'PASSWORD',
        subscription: {
          type: 'PHYSICAL',
          status: payload.status,
          expiryDate: ''
        }
      });
    }

    const updated = await this.updateUser(existing.id, {
      name: payload.name,
      subscription: {
        type: 'PHYSICAL',
        status: payload.status,
        expiryDate: ''
      }
    });
    if (!updated) throw new Error('Failed to update user');
    return updated;
  }

  async activateDigitalSubscription(payload: { email: string; name: string }): Promise<UserRecord> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const existing = await this.findUserByEmail(normalizedEmail);

    if (!existing) {
      return this.createUser({
        email: normalizedEmail,
        name: payload.name,
        role: UserRole.GENERAL,
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        authProvider: 'PASSWORD',
        subscription: {
          type: 'DIGITAL',
          status: 'ACTIVE',
          expiryDate
        }
      });
    }

    const updated = await this.updateUser(existing.id, {
      name: payload.name,
      subscription: {
        type: 'DIGITAL',
        status: 'ACTIVE',
        expiryDate
      }
    });
    if (!updated) throw new Error('Failed to update user');
    return updated;
  }

  async upsertGoogleUser(payload: { googleId: string; email: string; name: string; avatarUrl?: string }): Promise<UserRecord> {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingByGoogleId = await this.findUserByGoogleId(payload.googleId);
    
    if (existingByGoogleId) {
      const updated = await this.updateUser(existingByGoogleId.id, {
        email: normalizedEmail,
        name: payload.name,
        avatarUrl: payload.avatarUrl,
        authProvider: 'GOOGLE',
        googleId: payload.googleId
      });
      if (!updated) throw new Error('Failed to update user');
      return updated;
    }

    const existingByEmail = await this.findUserByEmail(normalizedEmail);
    if (existingByEmail) {
      const updated = await this.updateUser(existingByEmail.id, {
        name: payload.name || existingByEmail.name,
        avatarUrl: payload.avatarUrl,
        googleId: payload.googleId,
        authProvider: existingByEmail.authProvider === 'PASSWORD' ? 'PASSWORD' : 'GOOGLE'
      });
      if (!updated) throw new Error('Failed to update user');
      return updated;
    }

    return this.createUser({
      email: normalizedEmail,
      name: payload.name,
      role: UserRole.GENERAL,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      authProvider: 'GOOGLE',
      googleId: payload.googleId,
      avatarUrl: payload.avatarUrl
    });
  }

  async updatePhysicalSubscriptionStatus(email: string, status: SubscriptionStatus): Promise<UserRecord | null> {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    const updated = await this.updateUser(user.id, {
      subscription: {
        type: 'PHYSICAL',
        status,
        expiryDate: status === 'ACTIVE' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : ''
      }
    });
    return updated;
  }

  getPublicAppState(): AppStatePayload {
    // This is async in D1 but sync in FileStore
    // We'll need to handle this differently in the API
    throw new Error('Use getPublicAppStateAsync for D1Store');
  }

  async getPublicAppStateAsync(): Promise<AppStatePayload> {
    const [news, magazines, ads, users] = await Promise.all([
      this.listArticles(),
      this.listMagazines(),
      this.listAds(),
      this.listUsers()
    ]);

    return { news, magazines, ads, users };
  }
}

export const d1Store = new D1Store();
