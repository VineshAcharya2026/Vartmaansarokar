export enum UserRole {
  GENERAL = 'GENERAL',
  MAGAZINE = 'MAGAZINE',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN'
}

export type SubscriptionType = 'DIGITAL' | 'PHYSICAL';
export type SubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'PENDING';
export type ResourceType = 'MAGAZINE' | 'NEWS';
export type MediaKind = 'image' | 'audio' | 'pdf' | 'other';
export type AdPosition = 'SIDEBAR_TOP' | 'SIDEBAR_MID' | 'SIDEBAR_BOTTOM' | 'HOMEPAGE_BANNER';
export type AuthProvider = 'PASSWORD' | 'GOOGLE';
export type CategoryName =
  | 'National News'
  | 'International News'
  | 'Politics'
  | 'Business'
  | 'Economy'
  | 'Sports'
  | 'Entertainment'
  | 'Technology'
  | 'Health'
  | 'Environment'
  | 'Education';

export interface Subscription {
  type: SubscriptionType;
  expiryDate: string;
  status: SubscriptionStatus;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  authProvider?: AuthProvider;
  googleId?: string;
  avatarUrl?: string;
  subscription?: Subscription;
  createdAt?: string;
  updatedAt?: string;
}

export interface Article {
  id: string;
  title: string;
  category: CategoryName | string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  featured: boolean;
  requiresSubscription: boolean;
  createdAt?: string;
  updatedAt?: string;
}

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
  createdAt?: string;
  updatedAt?: string;
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: AdPosition;
  description?: string;
  ctaText?: string;
  createdAt?: string;
  updatedAt?: string;
}

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

export interface SubscriptionRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  accessType: SubscriptionType;
  message?: string;
  screenshotName?: string;
  screenshotData?: string;
  resourceType: ResourceType;
  resourceId: string;
  resourceTitle: string;
  status: SubscriptionStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface AppState {
  news: NewsPost[];
  magazines: MagazineIssue[];
  ads: Ad[];
  users: User[];
  currentUser: User | null;
}

export interface ApiError {
  code?: string;
  details?: string;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error?: ApiError | string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message?: string;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export interface AppStatePayload {
  news: NewsPost[];
  magazines: MagazineIssue[];
  ads: Ad[];
  users: User[];
}

export interface AuthPayload {
  token: string;
  user: User;
  users?: User[];
}

export interface AuthMePayload {
  user: User;
}

export interface UsersPayload {
  users: User[];
}

export interface ArticlesPayload {
  articles: NewsPost[];
}

export interface ArticlePayload {
  article: NewsPost;
  news?: NewsPost[];
}

export interface MagazinesPayload {
  magazine?: MagazineIssue;
  magazines: MagazineIssue[];
}

export interface AdsPayload {
  ads: Ad[];
}

export interface MediaPayload {
  media: MediaFile[];
}

export interface MediaItemPayload {
  media: MediaFile;
}

export interface DeleteMediaPayload {
  deletedId: string;
}

export interface SubscriptionRequestPayload {
  requestId: string;
  request?: SubscriptionRequest;
}

export interface ChatPayload {
  answer: string;
}

export interface ScrapePayload {
  title: string;
  text: string;
}
