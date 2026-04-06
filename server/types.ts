import type { Request } from '@cloudflare/workers-types';

export type { Request };

export type Article = {
  id: string;
  title: string;
  content: string;
  author?: string;
  publishedAt?: string;
};

export type MagazineIssue = {
  id: string;
  title: string;
  publishedAt: string;
  articles: Article[];
};

export type SubscriptionStatus = 'active' | 'inactive' | 'pending';

export type SubscriptionRequest = {
  userId: string;
  planId: string;
  status?: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
  id?: string;
};

export type Ad = {
  id: string;
  url: string;
  message: string;
  role?: string;
  enabled: boolean;
};

export interface Env {
  // Add your Cloudflare bindings here
  DB?: D1Database;
  MEDIA_BUCKET?: R2Bucket;
  JWT_SECRET?: string;
  OPENAI_API_KEY?: string;
  GOOGLE_CLIENT_ID?: string;
  STAFF_PASSWORD?: string;
  NODE_ENV?: string;
  ALLOWED_ORIGINS?: string;
  MAX_UPLOAD_SIZE_BYTES?: string;
  OPENAI_MODEL?: string;
}
