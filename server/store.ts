import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  Ad,
  AppStatePayload,
  MagazineIssue,
  MediaFile,
  NewsPost,
  Subscription,
  SubscriptionRequest,
  SubscriptionStatus,
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
}

interface CreateUserInput {
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  authProvider?: UserRecord['authProvider'];
  googleId?: string;
  avatarUrl?: string;
  subscription?: Subscription;
}

interface MediaFilters {
  search?: string;
  kind?: MediaFile['kind'];
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const SYSTEM_USERS = [
  { name: 'Super Admin', email: 'superadmin@vartmaansarokar.com', role: UserRole.SUPER_ADMIN, password: process.env.STAFF_PASSWORD || 'PassworD@2026' },
  { name: 'Admin', email: 'admin@vartmaansarokar.com', role: UserRole.ADMIN, password: process.env.STAFF_PASSWORD || 'PassworD@2026' },
  { name: 'Editor', email: 'editor@vartmaansarokar.com', role: UserRole.MAGAZINE, password: process.env.STAFF_PASSWORD || 'PassworD@2026' }
] as const;

const INITIAL_NEWS: NewsPost[] = [
  {
    id: 'seed-article-1',
    title: 'Government Announces New Infrastructure Policy',
    category: 'National News',
    excerpt: 'The central government has unveiled a large-scale infrastructure plan spanning rail, roads, and logistics.',
    content:
      'A long-term infrastructure package has been announced with emphasis on modernization, state coordination, and public investment. Analysts expect this to influence regional development, freight movement, and job creation over the coming quarters.',
    image: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
    author: 'Priya Sharma',
    date: 'Oct 24, 2023',
    featured: true,
    requiresSubscription: false
  },
  {
    id: 'seed-article-2',
    title: 'Global Tech Giants Pivot to Sustainable AI',
    category: 'Technology',
    excerpt: 'Major technology companies are investing in energy-efficient AI infrastructure and greener data centers.',
    content:
      'Artificial intelligence adoption continues to accelerate, but the next phase of competition is increasingly focused on efficient compute, power optimization, and sustainable data center design.',
    image: 'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=500&fit=crop',
    author: 'Ravi Kumar',
    date: 'Oct 23, 2023',
    featured: true,
    requiresSubscription: true
  }
];

const INITIAL_MAGAZINES: MagazineIssue[] = [
  {
    id: 'seed-magazine-1',
    title: 'The Future of Urban Living',
    issueNumber: 'October 2023',
    coverImage: 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop',
    pages: [
      'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1200&fit=crop',
      'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=1200&fit=crop'
    ],
    date: '2023-10-01',
    priceDigital: 0,
    pricePhysical: 499,
    isFree: true,
    gatedPage: 3,
    blurPaywall: true
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
  },
  {
    id: 'seed-ad-2',
    title: 'Luxury Real Estate',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop',
    link: 'https://example.com/homes',
    position: 'SIDEBAR_MID',
    description: 'Curated property showcases in premium locations.',
    ctaText: 'View Listings'
  },
  {
    id: 'seed-ad-3',
    title: 'Cloud Computing Services',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    link: 'https://example.com/cloud',
    position: 'SIDEBAR_BOTTOM',
    description: 'Enterprise infrastructure for teams ready to scale.',
    ctaText: 'Book Demo'
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

function sortByNewest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = Date.parse(left.createdAt ?? '');
    const rightValue = Date.parse(right.createdAt ?? '');
    return rightValue - leftValue;
  });
}

function sortByOldest<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftValue = Date.parse(left.createdAt ?? '');
    const rightValue = Date.parse(right.createdAt ?? '');
    return leftValue - rightValue;
  });
}

function sortAds(items: Ad[]) {
  const order: Record<Ad['position'], number> = {
    SIDEBAR_TOP: 0,
    SIDEBAR_MID: 1,
    SIDEBAR_BOTTOM: 2,
    HOMEPAGE_BANNER: 3
  };

  return [...items].sort((left, right) => order[left.position] - order[right.position]);
}

async function createDefaultDatabase(): Promise<PersistedDatabase> {
  const createdAtBase = Date.now();

  const users = await Promise.all(
    SYSTEM_USERS.map(async (user, index) => {
      const createdAt = new Date(createdAtBase - index * 60000).toISOString();
      return withTimestamps<UserRecord>(
        {
          id: createId('user'),
          email: user.email,
          name: user.name,
          role: user.role,
          authProvider: 'PASSWORD',
          passwordHash: await bcrypt.hash(user.password, 10)
        },
        createdAt
      );
    })
  );

  const articles = INITIAL_NEWS.map((article, index) =>
    withTimestamps<NewsPost>(
      {
        ...article,
        featured: article.featured ?? false,
        requiresSubscription: article.requiresSubscription ?? false
      },
      new Date(createdAtBase - index * 3600000).toISOString()
    )
  );

  const magazines = INITIAL_MAGAZINES.map((magazine, index) =>
    withTimestamps<MagazineIssue>(
      {
        ...magazine,
        isFree: magazine.isFree ?? false,
        blurPaywall: magazine.blurPaywall ?? false
      },
      new Date(createdAtBase - index * 86400000).toISOString()
    )
  );

  const ads = INITIAL_ADS.map((ad, index) =>
    withTimestamps<Ad>({ ...ad }, new Date(createdAtBase - index * 300000).toISOString())
  );

  return {
    users,
    articles,
    magazines,
    ads,
    media: [],
    subscriptionRequests: []
  };
}

export class FileStore {
  private data: PersistedDatabase | null = null;

  async init() {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      const content = await fs.readFile(DB_FILE, 'utf8');
      this.data = JSON.parse(content) as PersistedDatabase;
    } catch (error) {
      this.data = await createDefaultDatabase();
      await this.persist();
    }

    await this.ensureSystemUsers();
  }

  getDatabaseFilePath() {
    return DB_FILE;
  }

  getPublicAppState(): AppStatePayload {
    return {
      news: this.listArticles(),
      magazines: this.listMagazines(),
      ads: this.listAds(),
      users: this.listUsers()
    };
  }

  listUsers() {
    return sortByOldest(this.requireData().users).map(sanitizeUser);
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
      passwordHash: input.passwordHash,
      subscription: input.subscription
    });

    this.requireData().users.push(record);
    await this.persist();
    return record;
  }

  async updateUser(id: string, updates: Partial<Omit<UserRecord, 'id' | 'createdAt'>>) {
    const data = this.requireData();
    const index = data.users.findIndex((user) => user.id === id);
    if (index === -1) {
      return null;
    }

    data.users[index] = {
      ...data.users[index],
      ...updates,
      updatedAt: nowIso()
    };
    await this.persist();
    return data.users[index];
  }

  listArticles() {
    return sortByNewest(this.requireData().articles);
  }

  getArticleById(id: string) {
    return this.requireData().articles.find((article) => article.id === id) ?? null;
  }

  async createArticle(input: NewsPost) {
    const article = withTimestamps<NewsPost>({
      ...input,
      id: input.id || createId('article'),
      featured: input.featured ?? false,
      requiresSubscription: input.requiresSubscription ?? false
    });
    this.requireData().articles.push(article);
    await this.persist();
    return article;
  }

  async updateArticle(id: string, updates: Partial<NewsPost>) {
    const data = this.requireData();
    const index = data.articles.findIndex((article) => article.id === id);
    if (index === -1) {
      return null;
    }

    data.articles[index] = {
      ...data.articles[index],
      ...updates,
      featured: updates.featured ?? data.articles[index].featured,
      requiresSubscription: updates.requiresSubscription ?? data.articles[index].requiresSubscription,
      updatedAt: nowIso()
    };
    await this.persist();
    return data.articles[index];
  }

  async deleteArticle(id: string) {
    const data = this.requireData();
    const index = data.articles.findIndex((article) => article.id === id);
    if (index === -1) {
      return null;
    }

    const [deleted] = data.articles.splice(index, 1);
    await this.persist();
    return deleted;
  }

  listMagazines() {
    return sortByNewest(this.requireData().magazines);
  }

  getMagazineById(id: string) {
    return this.requireData().magazines.find((magazine) => magazine.id === id) ?? null;
  }

  async createMagazine(input: MagazineIssue) {
    const magazine = withTimestamps<MagazineIssue>({
      ...input,
      id: input.id || createId('magazine'),
      isFree: input.isFree ?? false,
      blurPaywall: input.blurPaywall ?? false
    });
    this.requireData().magazines.push(magazine);
    await this.persist();
    return magazine;
  }

  async updateMagazine(id: string, updates: Partial<MagazineIssue>) {
    const data = this.requireData();
    const index = data.magazines.findIndex((magazine) => magazine.id === id);
    if (index === -1) {
      return null;
    }

    data.magazines[index] = {
      ...data.magazines[index],
      ...updates,
      updatedAt: nowIso()
    };
    await this.persist();
    return data.magazines[index];
  }

  async deleteMagazine(id: string) {
    const data = this.requireData();
    const index = data.magazines.findIndex((magazine) => magazine.id === id);
    if (index === -1) {
      return null;
    }

    const [deleted] = data.magazines.splice(index, 1);
    await this.persist();
    return deleted;
  }

  listAds() {
    return sortAds(this.requireData().ads);
  }

  async replaceAds(ads: Ad[]) {
    this.requireData().ads = ads.map((ad, index) =>
      withTimestamps<Ad>(
        {
          ...ad,
          id: ad.id || createId('ad')
        },
        new Date(Date.now() - index * 1000).toISOString()
      )
    );
    await this.persist();
    return this.listAds();
  }

  listMedia(filters: MediaFilters = {}) {
    const { search = '', kind } = filters;
    const normalizedSearch = search.trim().toLowerCase();

    return sortByNewest(
      this.requireData().media.filter((item) => {
        if (kind && item.kind !== kind) {
          return false;
        }

        if (normalizedSearch && !item.originalName.toLowerCase().includes(normalizedSearch)) {
          return false;
        }

        return true;
      })
    );
  }

  async createMedia(input: Omit<MediaFile, 'id' | 'createdAt' | 'updatedAt'>) {
    const media = withTimestamps({
      ...input,
      id: createId('media')
    });
    this.requireData().media.push(media);
    await this.persist();
    return media;
  }

  async deleteMedia(id: string) {
    const data = this.requireData();
    const index = data.media.findIndex((item) => item.id === id);
    if (index === -1) {
      return null;
    }

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
      id: createId('subscription'),
      status: input.status ?? 'PENDING'
    });
    this.requireData().subscriptionRequests.push(request);
    await this.persist();
    return request;
  }

  async updateSubscriptionRequest(id: string, status: SubscriptionStatus) {
    const data = this.requireData();
    const index = data.subscriptionRequests.findIndex((request) => request.id === id);
    if (index === -1) {
      return null;
    }

    data.subscriptionRequests[index] = {
      ...data.subscriptionRequests[index],
      status,
      updatedAt: nowIso()
    };
    await this.persist();
    return data.subscriptionRequests[index];
  }

  async ensurePhysicalSubscriptionUser(payload: { email: string; name: string; status: SubscriptionStatus }) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const existing = this.findUserByEmail(normalizedEmail);

    if (!existing) {
      return this.createUser({
        email: normalizedEmail,
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

    return this.updateUser(existing.id, {
      name: payload.name,
      subscription: {
        type: 'PHYSICAL',
        status: payload.status,
        expiryDate: ''
      }
    });
  }

  async activateDigitalSubscription(payload: { email: string; name: string }) {
    const normalizedEmail = payload.email.trim().toLowerCase();
    const expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    const existing = this.findUserByEmail(normalizedEmail);

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

    return this.updateUser(existing.id, {
      name: payload.name,
      role: existing.role,
      subscription: {
        type: 'DIGITAL',
        status: 'ACTIVE',
        expiryDate
      }
    });
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
      role: UserRole.GENERAL,
      passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
      authProvider: 'GOOGLE',
      googleId: payload.googleId,
      avatarUrl: payload.avatarUrl
    });
  }

  async updatePhysicalSubscriptionStatus(email: string, status: SubscriptionStatus) {
    const user = this.findUserByEmail(email);
    if (!user) {
      return null;
    }

    return this.updateUser(user.id, {
      subscription: {
        type: 'PHYSICAL',
        status,
        expiryDate: status === 'ACTIVE' ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() : ''
      }
    });
  }

  private requireData() {
    if (!this.data) {
      throw new Error('File store has not been initialized.');
    }

    return this.data;
  }

  private async ensureSystemUsers() {
    const data = this.requireData();
    let changed = false;

    for (const [index, systemUser] of SYSTEM_USERS.entries()) {
      const existing = data.users.find((user) => user.email.toLowerCase() === systemUser.email.toLowerCase());

      if (!existing) {
        data.users.push(
          withTimestamps<UserRecord>(
            {
              id: createId('user'),
              email: systemUser.email,
              name: systemUser.name,
              role: systemUser.role,
              authProvider: 'PASSWORD',
              passwordHash: await bcrypt.hash(systemUser.password, 10)
            },
            new Date(Date.now() - index * 60000).toISOString()
          )
        );
        changed = true;
        continue;
      }

      const passwordMatches = await bcrypt.compare(systemUser.password, existing.passwordHash).catch(() => false);
      if (
        existing.name !== systemUser.name ||
        existing.role !== systemUser.role ||
        existing.authProvider !== 'PASSWORD' ||
        !passwordMatches
      ) {
        existing.name = systemUser.name;
        existing.role = systemUser.role;
        existing.authProvider = 'PASSWORD';
        existing.passwordHash = passwordMatches ? existing.passwordHash : await bcrypt.hash(systemUser.password, 10);
        existing.updatedAt = nowIso();
        changed = true;
      }
    }

    if (changed) {
      await this.persist();
    }
  }

  private async persist() {
    if (!this.data) {
      return;
    }

    await fs.writeFile(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
  }
}

export const sharedStore = new FileStore();
