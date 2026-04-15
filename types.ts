export enum UserRole {
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUBSCRIBER = 'SUBSCRIBER',
  READER = 'READER'
}

export type SubscriptionType = 'DIGITAL' | 'PHYSICAL';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ResourceType = 'MAGAZINE' | 'NEWS';
export type MediaKind = 'image' | 'audio' | 'pdf' | 'other';
export type AdPosition = 'SIDEBAR_TOP' | 'SIDEBAR_MID' | 'SIDEBAR_BOTTOM' | 'HOMEPAGE_BANNER';
export type AuthProvider = 'PASSWORD' | 'GOOGLE';
export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'PUBLISHED' | 'PENDING_REVIEW';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_ROLE_CHANGED'
  | 'USER_DEACTIVATED'
  | 'ARTICLE_CREATED'
  | 'ARTICLE_UPDATED'
  | 'ARTICLE_SUBMITTED'
  | 'ARTICLE_APPROVED'
  | 'ARTICLE_REJECTED'
  | 'ARTICLE_DELETED'
  | 'MAGAZINE_CREATED'
  | 'MAGAZINE_UPDATED'
  | 'MAGAZINE_SUBMITTED'
  | 'MAGAZINE_APPROVED'
  | 'MAGAZINE_REJECTED'
  | 'MAGAZINE_DELETED'
  | 'SUBSCRIBER_APPROVED'
  | 'SUBSCRIBER_REJECTED'
  | 'SUBSCRIBER_DELETED'
  | 'LOGIN';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  address?: string;
  subscription_plan?: string;
  subscription_status?: string;
  payment_proof?: string;
  isActive?: boolean;
  avatarUrl?: string;
  authProvider?: AuthProvider;
  googleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  author_id?: string;
  date: string;
  featured: boolean;
  requiresSubscription: boolean;
  status?: ContentStatus;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  published_at?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type NewsItem = Article;
export type NewsPost = Article;

export interface MagazineIssue {
  id: string;
  title: string;
  issueNumber: string;
  coverImage: string;
  pdfUrl?: string;
  pages: string[];
  date: string;
  priceDigital: number;
  pricePhysical: number;
  isFree?: boolean;
  gatedPage?: number;
  blurPaywall?: boolean;
  status?: ContentStatus;
  submittedBy?: string;
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type MagazineItem = MagazineIssue;

export interface AdItem {
  id: string;
  title: string;
  description?: string;
  image?: string;
  imageUrl?: string;
  redirect_url?: string;
  link?: string;
  position?: AdPosition | string;
  ctaText?: string;
  status?: string;
  created_at?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type Ad = AdItem;

export interface MediaFile {
  id: string;
  originalName: string;
  storedName: string;
  url: string;
  kind: MediaKind;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt?: string;
}

export type MediaItem = MediaFile;

export interface SubscriptionRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessType: SubscriptionType;
  resourceId: string;
  resourceTitle: string;
  status: SubscriptionStatus;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  totalArticles: number;
  pendingArticles: number;
  totalMagazines: number;
  pendingMagazines: number;
  pendingSubscribers: number;
  activeUsers: number;
  editors: number;
  admins: number;
  auditLogCount: number;
}

export interface AuditLog {
  id: string;
  actorId: string;
  actorEmail: string;
  actorRole: UserRole;
  action: AuditAction;
  targetType: string;
  targetId: string;
  details?: any;
  createdAt: string;
}

export interface AppStatePayload {
  news: NewsPost[];
  magazines: MagazineIssue[];
  ads: AdItem[];
  users: User[];
}
