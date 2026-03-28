
export enum UserRole {
  GENERAL = 'GENERAL',
  MAGAZINE = 'MAGAZINE',
  ADMIN = 'ADMIN'
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  subscription?: {
    type: 'DIGITAL' | 'PHYSICAL';
    expiryDate: string;
    status: 'ACTIVE' | 'EXPIRED';
  };
}

export interface NewsPost {
  id: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: string;
  featured?: boolean;
}

export interface MagazineIssue {
  id: string;
  title: string;
  issueNumber: string;
  coverImage: string;
  pdfUrl?: string;
  pages: string[]; // URLs of page images
  date: string;
  priceDigital: number;
  pricePhysical: number;
  isFree?: boolean;
  gatedPage?: number; // The page number after which the subscription popup appears
  blurPaywall?: boolean; // Enable blur effect for paywall
}

export interface Ad {
  id: string;
  title: string;
  imageUrl: string;
  link: string;
  position: 'SIDEBAR_TOP' | 'SIDEBAR_MID' | 'SIDEBAR_BOTTOM' | 'HOMEPAGE_BANNER';
}

export interface AppState {
  news: NewsPost[];
  magazines: MagazineIssue[];
  ads: Ad[];
  users: User[];
  currentUser: User | null;
}
