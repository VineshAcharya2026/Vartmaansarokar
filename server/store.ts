import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Ad,
  AppStatePayload,
  AuditAction,
  AuditLog,
  ContentStatus,
  DashboardStats,
  MagazineIssue,
  MediaFile,
  NewsPost,
  SubscriptionRequest,
  SubscriptionStatus,
  SubscriptionType,
  User,
  UserRole
} from '../types.js';

export interface UserRecord extends User {
  passwordHash: string;
}

interface PersistedDatabase {
  users: UserRecord[];
  articles: NewsPost[];
  magazines: MagazineIssue[];
  ads: Ad[];
  media: MediaFile[];
  subscriptionRequests: SubscriptionRequest[];
  auditLogs: AuditLog[];
}

interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  authProvider?: UserRecord['authProvider'];
  googleId?: string;
  avatarUrl?: string;
  isActive?: boolean;
}

interface ContentReviewInput {
  reviewedBy: UserRecord;
  reason?: string;
}

interface MediaFilters {
  search?: string;
  kind?: MediaFile['kind'];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const DEFAULT_ACCOUNTS = [
  // Legacy cms.com accounts (kept for backward compatibility)
  { name: 'Editor', email: 'editor@cms.com', role: UserRole.EDITOR, password: 'Editor@1234' },
  { name: 'Admin', email: 'admin@cms.com', role: UserRole.ADMIN, password: 'Admin@1234' },
  { name: 'Super Admin', email: 'superadmin@cms.com', role: UserRole.SUPER_ADMIN, password: 'SuperAdmin@1234' },
  // New vartmaan.in domain accounts required by the task
  { name: 'Admin', email: 'admin@vartmaan.in', role: UserRole.ADMIN, password: 'PassworD@2026' },
  { name: 'Editor', email: 'editor@vartmaan.in', role: UserRole.EDITOR, password: 'PassworD@2026' },
  // Primary staff accounts (vartmaansarokar.com)
  { name: 'Super Admin', email: 'superadmin@vartmaansarokar.com', role: UserRole.SUPER_ADMIN, password: 'PassworD@2026' },
  { name: 'Admin', email: 'admin@vartmaansarokar.com', role: UserRole.ADMIN, password: 'PassworD@2026' },
  { name: 'Editor', email: 'editor@vartmaansarokar.com', role: UserRole.EDITOR, password: 'PassworD@2026' }
] as const;

const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'seed-article-1',
    title: 'Government Announces New Infrastructure Policy',
    category: 'National News',
    excerpt: 'The central government has unveiled a large-scale infrastructure plan spanning rail, roads, and logistics.',
    content: 'A long-term infrastructure package has been announced with emphasis on modernization, state coordination, and public investment.',
    image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
    author: 'Editorial Desk',
    date: '2026-04-01',
    featured: true,
    requiresSubscription: false,
    status: 'APPROVED'
  }
];

const INITIAL_MAGAZINES: MagazineIssue[] = [
  {
    id: 'seed-magazine-1',
    title: 'The Future of Urban Living',
    issueNumber: 'April 2026',
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=1200&fit=crop'
    ],
    date: '2026-04-01',
    priceDigital: 0,
    pricePhysical: 499,
    isFree: true,
    gatedPage: 2,
    blurPaywall: false,
    status: 'APPROVED'
  }
];

const INITIAL_ADS: Ad[] = [
  {
    id: 'seed-ad-1',
    title: 'Premium Watches',
    imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=400&fit=crop',
    link: 'https://example.com/watches',
    position: 'SIDEBAR_TOP',
    description: 'Precision-made timepieces for a discerning audience.',
    ctaText: 'Explore Collection'
  }
];

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

function withTimestamps<T extends object>(value: T, createdAt = nowIso()) {
  return {
    ...value,
    createdAt,
    updatedAt: createdAt
  };
}

function sanitizeUser(user: UserRecord): User {
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

function normalizeRole(role: unknown): UserRole {
  const value = typeof role === 'string' ? role.toUpperCase() : '';
  if (value === UserRole.ADMIN || value === UserRole.SUPER_ADMIN || value === UserRole.EDITOR || value === UserRole.SUBSCRIBER) {
    return value;
  }
  if (value === 'MAGAZINE') return UserRole.EDITOR;
  if (value === 'GENERAL') return UserRole.SUBSCRIBER;
  return UserRole.SUBSCRIBER;
}

function normalizeContentStatus(status: unknown): ContentStatus {
  const value = typeof status === 'string' ? status.toUpperCase() : '';
  if (value === 'DRAFT' || value === 'IN_REVIEW' || value === 'APPROVED' || value === 'REJECTED' || value === 'PUBLISHED') {
    return value;
  }
  return 'APPROVED';
}

function normalizeSubscriptionStatus(status: unknown): SubscriptionStatus {
  const value = typeof status === 'string' ? status.toUpperCase() : '';
  if (value === 'ACTIVE' || value === 'EXPIRED' || value === 'PENDING' || value === 'APPROVED' || value === 'REJECTED') {
    return value;
  }
  return 'PENDING';
}

function sortByNewest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => Date.parse(right.createdAt ?? '') - Date.parse(left.createdAt ?? ''));
}

function sortByOldest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => Date.parse(left.createdAt ?? '') - Date.parse(right.createdAt ?? ''));
}

async function createDefaultDatabase(): Promise<PersistedDatabase> {
  const createdAtBase = Date.now();
  const users = await Promise.all(
    DEFAULT_ACCOUNTS.map(async (account, index) =>
      withTimestamps<UserRecord>(
        {
          id: createId('user'),
          email: account.email,
          name: account.name,
          role: account.role,
          authProvider: 'PASSWORD',
          isActive: true,
          passwordHash: await bcrypt.hash(account.password, 10)
        },
        new Date(createdAtBase - index * 60000).toISOString()
      )
    )
  );

  return {
    users,
    articles: INITIAL_NEWS.map((article) => withTimestamps(article)),
    magazines: INITIAL_MAGAZINES.map((magazine) => withTimestamps(magazine)),
    ads: INITIAL_ADS.map((ad) => withTimestamps(ad)),
    media: [],
    subscriptionRequests: [],
    auditLogs: []
  };
}

export class FileStore {
  private data: PersistedDatabase | null = null;

  async init() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      const content = await fs.readFile(DB_FILE, 'utf8');
      this.data = this.normalizeDatabase(JSON.parse(content) as Partial<PersistedDatabase>);
    } catch {
      this.data = await createDefaultDatabase();
      await this.persist();
    }

    await this.ensureDefaultAccounts();
  }

  getDatabaseFilePath() {
    return DB_FILE;
  }

  getPublicAppState(): AppStatePayload {
    return {
      news: this.listArticles({ includeUnapproved: false }),
      magazines: this.listMagazines({ includeUnapproved: false }),
      ads: this.listAds(),
      users: this.listUsers()
    };
  }

  listUsers(includeInactive = true) {
    const users = sortByOldest(this.requireData().users)
      .filter((user) => includeInactive || user.isActive !== false)
      .map(sanitizeUser);
    return users;
  }

  getUserById(id: string) {
    return this.requireData().users.find((user) => user.id === id) ?? null;
  }

  findUserByEmail(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    return this.requireData().users.find((user) => user.email.toLowerCase() === normalizedEmail) ?? null;
  }

  findUserByGoogleId(googleId: string) {
    return this.requireData().users.find((user) => user.googleId === googleId) ?? null;
  }

  async createUser(input: CreateUserInput) {
    const record = withTimestamps<UserRecord>({
      id: createId('user'),
      email: input.email.trim().toLowerCase(),
      name: input.name.trim(),
      role: input.role,
      authProvider: input.authProvider ?? 'PASSWORD',
      googleId: input.googleId,
      avatarUrl: input.avatarUrl,
      isActive: input.isActive ?? true,
      passwordHash: input.passwordHash
    });

    this.requireData().users.push(record);
    await this.persist();
    return record;
  }

  async updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) {
    const data = this.requireData();
    const index = data.users.findIndex((user) => user.id === id);
    if (index === -1) return null;

    data.users[index] = { ...data.users[index], ...updates, updatedAt: nowIso() };
    await this.persist();
    return data.users[index];
  }

  listArticles(options: { includeUnapproved?: boolean; authorId?: string } = {}) {
    const { includeUnapproved = true, authorId } = options;
    return sortByNewest(
      this.requireData().articles.filter((article) => {
        if (!includeUnapproved && !['APPROVED', 'PUBLISHED'].includes(article.status ?? '')) return false;
        if (authorId && article.submittedBy !== authorId) return false;
        return true;
      })
    );
  }

  listArticleQueue() {
    return this.listArticles().filter((article) => article.status === 'IN_REVIEW');
  }

  getArticleById(id: string) {
    return this.requireData().articles.find((article) => article.id === id) ?? null;
  }

  async createArticle(input: NewsPost) {
    const article = withTimestamps<NewsPost>({
      ...input,
      id: input.id || createId('article'),
      featured: input.featured ?? false,
      requiresSubscription: input.requiresSubscription ?? false,
      status: input.status ?? 'DRAFT'
    });
    this.requireData().articles.push(article);
    await this.persist();
    return article;
  }

  async updateArticle(id: string, updates: Partial<NewsPost>) {
    const data = this.requireData();
    const index = data.articles.findIndex((article) => article.id === id);
    if (index === -1) return null;

    data.articles[index] = { ...data.articles[index], ...updates, updatedAt: nowIso() };
    await this.persist();
    return data.articles[index];
  }

  async reviewArticle(id: string, status: Extract<ContentStatus, 'APPROVED' | 'REJECTED'>, input: ContentReviewInput) {
    return this.updateArticle(id, {
      status,
      approvedBy: status === 'APPROVED' ? input.reviewedBy.id : undefined,
      approvedAt: status === 'APPROVED' ? nowIso() : undefined,
      rejectedBy: status === 'REJECTED' ? input.reviewedBy.id : undefined,
      rejectedAt: status === 'REJECTED' ? nowIso() : undefined,
      rejectionReason: status === 'REJECTED' ? input.reason ?? 'Rejected by reviewer' : undefined
    });
  }

  async deleteArticle(id: string) {
    const data = this.requireData();
    const index = data.articles.findIndex((article) => article.id === id);
    if (index === -1) return null;

    const [deleted] = data.articles.splice(index, 1);
    await this.persist();
    return deleted;
  }

  listMagazines(options: { includeUnapproved?: boolean; authorId?: string } = {}) {
    const { includeUnapproved = true, authorId } = options;
    return sortByNewest(
      this.requireData().magazines.filter((magazine) => {
        if (!includeUnapproved && !['APPROVED', 'PUBLISHED'].includes(magazine.status ?? '')) return false;
        if (authorId && magazine.submittedBy !== authorId) return false;
        return true;
      })
    );
  }

  listMagazineQueue() {
    return this.listMagazines().filter((magazine) => magazine.status === 'IN_REVIEW');
  }

  getMagazineById(id: string) {
    return this.requireData().magazines.find((magazine) => magazine.id === id) ?? null;
  }

  async createMagazine(input: MagazineIssue) {
    const magazine = withTimestamps<MagazineIssue>({
      ...input,
      id: input.id || createId('magazine'),
      isFree: input.isFree ?? false,
      blurPaywall: input.blurPaywall ?? false,
      status: input.status ?? 'DRAFT'
    });
    this.requireData().magazines.push(magazine);
    await this.persist();
    return magazine;
  }

  async updateMagazine(id: string, updates: Partial<MagazineIssue>) {
    const data = this.requireData();
    const index = data.magazines.findIndex((magazine) => magazine.id === id);
    if (index === -1) return null;

    data.magazines[index] = { ...data.magazines[index], ...updates, updatedAt: nowIso() };
    await this.persist();
    return data.magazines[index];
  }

  async reviewMagazine(id: string, status: Extract<ContentStatus, 'APPROVED' | 'REJECTED'>, input: ContentReviewInput) {
    return this.updateMagazine(id, {
      status,
      approvedBy: status === 'APPROVED' ? input.reviewedBy.id : undefined,
      approvedAt: status === 'APPROVED' ? nowIso() : undefined,
      rejectedBy: status === 'REJECTED' ? input.reviewedBy.id : undefined,
      rejectedAt: status === 'REJECTED' ? nowIso() : undefined,
      rejectionReason: status === 'REJECTED' ? input.reason ?? 'Rejected by reviewer' : undefined
    });
  }

  async deleteMagazine(id: string) {
    const data = this.requireData();
    const index = data.magazines.findIndex((magazine) => magazine.id === id);
    if (index === -1) return null;

    const [deleted] = data.magazines.splice(index, 1);
    await this.persist();
    return deleted;
  }

  listAds() {
    return sortByOldest(this.requireData().ads);
  }

  async replaceAds(ads: Ad[]) {
    this.requireData().ads = ads.map((ad, index) =>
      withTimestamps<Ad>({ ...ad, id: ad.id || createId('ad') }, new Date(Date.now() - index * 1000).toISOString())
    );
    await this.persist();
    return this.listAds();
  }

  listMedia(filters: MediaFilters = {}) {
    const { search = '', kind } = filters;
    const normalizedSearch = search.trim().toLowerCase();

    return sortByNewest(
      this.requireData().media.filter((item) => {
        if (kind && item.kind !== kind) return false;
        if (normalizedSearch && !item.originalName.toLowerCase().includes(normalizedSearch)) return false;
        return true;
      })
    );
  }

  async createMedia(input: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>) {
    const media = withTimestamps({ ...input, id: createId('media') });
    this.requireData().media.push(media);
    await this.persist();
    return media;
  }

  async deleteMedia(id: string) {
    const data = this.requireData();
    const index = data.media.findIndex((item) => item.id === id);
    if (index === -1) return null;

    const [deleted] = data.media.splice(index, 1);
    await this.persist();
    return deleted;
  }

  listSubscriptionRequests() {
    return sortByNewest(this.requireData().subscriptionRequests);
  }

  async createSubscriptionRequest(input: Omit<SubscriptionRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'> & { status?: SubscriptionStatus }) {
    const request = withTimestamps<SubscriptionRequest>({
      ...input,
      id: createId('subscriber'),
      status: input.status ?? 'PENDING'
    });
    this.requireData().subscriptionRequests.push(request);
    await this.persist();
    return request;
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus, reviewer?: UserRecord) {
    const data = this.requireData();
    const index = data.subscriptionRequests.findIndex((request) => request.id === id);
    if (index === -1) return null;

    data.subscriptionRequests[index] = {
      ...data.subscriptionRequests[index],
      status,
      reviewedBy: reviewer?.id,
      reviewedAt: reviewer ? nowIso() : data.subscriptionRequests[index].reviewedAt,
      updatedAt: nowIso()
    };
    await this.persist();
    return data.subscriptionRequests[index];
  }

  async deleteSubscriptionRequest(id: string) {
    const data = this.requireData();
    const index = data.subscriptionRequests.findIndex((request) => request.id === id);
    if (index === -1) return null;

    const [deleted] = data.subscriptionRequests.splice(index, 1);
    await this.persist();
    return deleted;
  }

  async upsertGoogleUser(payload: { googleId: string; email: string; name: string; avatarUrl?: string }) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existingByGoogleId = this.findUserByGoogleId(payload.googleId);
    if (existingByGoogleId) {
      return this.updateUser(existingByGoogleId.id, {
        email: normalizedEmail,
        name: payload.name,
        avatarUrl: payload.avatarUrl,
        authProvider: 'GOOGLE',
        googleId: payload.googleId
      });
    }

    const existingByEmail = this.findUserByEmail(normalizedEmail);
    if (existingByEmail) {
      return this.updateUser(existingByEmail.id, {
        name: payload.name || existingByEmail.name,
        avatarUrl: payload.avatarUrl,
        googleId: payload.googleId,
        authProvider: existingByEmail.authProvider === 'PASSWORD' ? 'PASSWORD' : 'GOOGLE'
      });
    }

    return this.createUser({
      email: normalizedEmail,
      name: payload.name,
      role: UserRole.EDITOR,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      authProvider: 'GOOGLE',
      googleId: payload.googleId,
      avatarUrl: payload.avatarUrl
    });
  }

  async recordAudit(input: {
    actor: UserRecord;
    action: AuditAction;
    targetType: AuditLog['targetType'];
    targetId: string;
    details?: Record<string, unknown>;
  }) {
    this.requireData().auditLogs.unshift({
      id: createId('audit'),
      actorId: input.actor.id,
      actorEmail: input.actor.email,
      actorRole: input.actor.role,
      action: input.action,
      targetType: input.targetType,
      targetId: input.targetId,
      details: input.details,
      createdAt: nowIso()
    });
    await this.persist();
  }

  listAuditLogs() {
    return sortByNewest(this.requireData().auditLogs);
  }

  getDashboardStats(user: UserRecord): DashboardStats {
    const articles = user.role === UserRole.EDITOR ? this.listArticles({ authorId: user.id }) : this.listArticles();
    const magazines = user.role === UserRole.EDITOR ? this.listMagazines({ authorId: user.id }) : this.listMagazines();
    const allUsers = this.listUsers();

    return {
      totalArticles: articles.length,
      pendingArticles: articles.filter((article) => article.status === 'IN_REVIEW').length,
      totalMagazines: magazines.length,
      pendingMagazines: magazines.filter((magazine) => magazine.status === 'IN_REVIEW').length,
      pendingSubscribers: this.listSubscriptionRequests().filter((request) => request.status === 'PENDING').length,
      activeUsers: allUsers.filter((userRecord) => userRecord.isActive !== false).length,
      editors: allUsers.filter((userRecord) => userRecord.role === UserRole.EDITOR).length,
      admins: allUsers.filter((userRecord) => [UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRecord.role)).length,
      auditLogCount: user.role === UserRole.SUPER_ADMIN ? this.listAuditLogs().length : 0
    };
  }

  async clearUsers() {
    this.requireData().users = [];
    await this.persist();
  }

  private normalizeDatabase(value: Partial<PersistedDatabase>): PersistedDatabase {
    return {
      users: (value.users ?? []).map((user) => ({
        ...user,
        role: normalizeRole(user.role),
        isActive: user.isActive !== false,
        createdAt: user.createdAt ?? nowIso(),
        updatedAt: user.updatedAt ?? user.createdAt ?? nowIso()
      })) as UserRecord[],
      articles: (value.articles ?? []).map((article) => ({
        ...article,
        status: normalizeContentStatus(article.status),
        createdAt: article.createdAt ?? nowIso(),
        updatedAt: article.updatedAt ?? article.createdAt ?? nowIso()
      })),
      magazines: (value.magazines ?? []).map((magazine) => ({
        ...magazine,
        status: normalizeContentStatus(magazine.status),
        createdAt: magazine.createdAt ?? nowIso(),
        updatedAt: magazine.updatedAt ?? magazine.createdAt ?? nowIso()
      })),
      ads: (value.ads ?? []).map((ad) => ({
        ...ad,
        createdAt: ad.createdAt ?? nowIso(),
        updatedAt: ad.updatedAt ?? ad.createdAt ?? nowIso()
      })),
      media: (value.media ?? []).map((item) => ({
        ...item,
        createdAt: item.createdAt ?? nowIso(),
        updatedAt: item.updatedAt ?? item.createdAt ?? nowIso()
      })),
      subscriptionRequests: (value.subscriptionRequests ?? []).map((request) => ({
        ...request,
        status: normalizeSubscriptionStatus(request.status),
        createdAt: request.createdAt ?? nowIso(),
        updatedAt: request.updatedAt ?? request.createdAt ?? nowIso()
      })),
      auditLogs: (value.auditLogs ?? []).map((log) => ({
        ...log,
        actorRole: normalizeRole(log.actorRole),
        createdAt: log.createdAt ?? nowIso()
      }))
    };
  }

  private requireData() {
    if (!this.data) throw new Error('File store has not been initialized.');
    return this.data;
  }

  private async ensureDefaultAccounts() {
    const data = this.requireData();
    let changed = false;

    for (const [index, account] of DEFAULT_ACCOUNTS.entries()) {
      const existing = data.users.find((user) => user.email.toLowerCase() === account.email.toLowerCase());
      if (!existing) {
        data.users.push(
          withTimestamps<UserRecord>(
            {
              id: createId('user'),
              email: account.email,
              name: account.name,
              role: account.role,
              authProvider: 'PASSWORD',
              isActive: true,
              passwordHash: await bcrypt.hash(account.password, 10)
            },
            new Date(Date.now() - index * 60000).toISOString()
          )
        );
        changed = true;
        continue;
      }

      const matches = await bcrypt.compare(account.password, existing.passwordHash).catch(() => false);
      if (!matches || existing.role !== account.role || existing.name !== account.name || existing.isActive === false) {
        existing.name = account.name;
        existing.role = account.role;
        existing.isActive = true;
        existing.authProvider = 'PASSWORD';
        existing.passwordHash = matches ? existing.passwordHash : await bcrypt.hash(account.password, 10);
        existing.updatedAt = nowIso();
        changed = true;
      }
    }

    if (changed) await this.persist();
  }

  private async persist() {
    if (!this.data) return;
    await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }
}

export const sharedStore = new FileStore();
