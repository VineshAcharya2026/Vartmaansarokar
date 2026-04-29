import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './lib/api';
import { 
  NewsItem, 
  MagazineItem, 
  User, 
  AdItem, 
  MediaItem, 
  SubscriptionRequest,
  UserRole, 
  NewsStatus 
} from './vartmaan-shared-types';
import toast from 'react-hot-toast';
import { SESSION_STORAGE_KEY, AUTH_TOKEN_KEY } from './utils/app';
import SubscriptionPopup from './components/SubscriptionPopup';

interface SiteSettings {
  site_name: string;
  org_name: string;
  twitter_link: string;
  instagram_link: string;
  facebook_link: string;
}

interface HeroData {
  headline: string;
  subtitle: string;
  bg_image: string;
}

interface AppContextType {
  isReady: boolean;
  currentUser: User | null;
  news: NewsItem[];
  staffArticles: NewsItem[];
  articleApprovalQueue: NewsItem[];
  magazineApprovalQueue: MagazineItem[];
  magazines: MagazineItem[];
  ads: AdItem[];
  media: MediaItem[];
  users: User[];
  subscriptionRequests: SubscriptionRequest[];
  siteSettings: SiteSettings;
  heroData: HeroData;
  
  // Auth
  login: (email: string, pass: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  registerReader: (data: any) => Promise<void>;
  logout: () => void;

  // News
  fetchNews: () => Promise<void>;
  fetchStaffArticles: () => Promise<void>;
  addNews: (news: Partial<NewsItem>) => Promise<void>;
  updateNews: (id: string, news: Partial<NewsItem>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  submitNews: (id: string) => Promise<void>;
  approveNews: (id: string) => Promise<void>;
  rejectNews: (id: string, reason: string) => Promise<void>;
  reworkNews: (id: string, reason: string) => Promise<void>;

  // Magazines
  fetchMagazines: () => Promise<void>;
  addMagazine: (mag: Partial<MagazineItem>) => Promise<void>;
  updateMagazine: (id: string, mag: Partial<MagazineItem>) => Promise<void>;
  deleteMagazine: (id: string) => Promise<void>;
  submitMagazine: (id: string) => Promise<void>;
  approveMagazine: (id: string) => Promise<void>;
  rejectMagazine: (id: string, reason: string) => Promise<void>;
  reworkMagazine: (id: string, reason: string) => Promise<void>;

  // Ads
  fetchAds: () => Promise<void>;
  fetchAdminAds: () => Promise<AdItem[]>;
  createAd: (ad: Partial<AdItem>) => Promise<void>;
  updateAd: (id: string, ad: Partial<AdItem>) => Promise<void>;
  deleteAd: (id: string) => Promise<void>;

  // Media
  fetchMedia: () => Promise<void>;
  uploadFile: (file: File) => Promise<{ url: string }>;

  // Users
  fetchUsers: () => Promise<void>;
  fetchSubscriptionRequests: () => Promise<void>;
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Global Config
  updateSettings: (data: Partial<SiteSettings>) => Promise<void>;
  updateHero: (data: Partial<HeroData>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchHero: () => Promise<void>;

  /** Full-screen subscription popup (digital + print) */
  subscriptionPopupOpen: boolean;
  openSubscriptionPopup: () => void;
  closeSubscriptionPopup: () => void;
}

const AppContext = createContext<AppContextType | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  });
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [staffArticles, setStaffArticles] = useState<NewsItem[]>([]);
  const [articleApprovalQueue, setArticleApprovalQueue] = useState<NewsItem[]>([]);
  const [magazineApprovalQueue, setMagazineApprovalQueue] = useState<MagazineItem[]>([]);
  const [magazines, setMagazines] = useState<MagazineItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionRequest[]>([]);
  const [subscriptionPopupOpen, setSubscriptionPopupOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({
    site_name: 'Vartmaan Sarokaar',
    org_name: 'Vinesh Acharya Foundation',
    twitter_link: '',
    instagram_link: '',
    facebook_link: ''
  });
  const [heroData, setHeroData] = useState<HeroData>({
    headline: 'Investigating The Truth.',
    subtitle: 'Premium independent journalism from the heart of India.',
    bg_image: ''
  });

  const login = async (email: string, password?: string) => {
    const { data: resp } = await api.post('/api/auth/login', { email, password });
    const token: string = (resp as { token: string }).token;
    const user = (resp as { user: User }).user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome, ${user.name}`);
    return user;
  };

  const loginWithGoogle = async (credential: string) => {
    const { data: resp } = await api.post('/api/auth/google', { credential });
    const token: string = (resp as { token: string }).token;
    const user = (resp as { user: User }).user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome!`);
    return user;
  };

  const logout = () => {
    // Attempt server-side cookie/session cleanup (fire and forget)
    api.post('/api/auth/logout').catch(() => {});
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    toast.info('Logged out');
  };

  const registerReader = async (formData: any) => {
    await api.post('/api/auth/register', formData);
  };

  const fetchNews = async () => {
    try {
      const { data: resp } = await api.get('/api/articles');
      const r = resp as { news?: NewsItem[]; articles?: NewsItem[] };
      setNews(r.news ?? r.articles ?? []);
    } catch (e) { console.error('Articles fetch failed'); }
  };

  const fetchStaffArticles = async () => {
    try {
      const { data: resp } = await api.get('/api/articles');
      const r = resp as { news?: NewsItem[]; articles?: NewsItem[]; queue?: NewsItem[] };
      const list = r.news ?? r.articles ?? [];
      setStaffArticles(list);
      setArticleApprovalQueue(Array.isArray(r.queue) ? r.queue : list.filter((a) => a.status === 'IN_REVIEW'));
    } catch (e) { console.error('Staff articles fetch failed'); }
  };

  const addNews = async (item: Partial<NewsItem>) => {
    await api.post('/api/articles', item);
    toast.success('Article saved');
    await fetchNews();
    if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) await fetchStaffArticles();
  };

  const updateNews = async (id: string, item: Partial<NewsItem>) => {
    await api.patch(`/api/articles/${id}`, item);
    toast.success('Article updated');
    await Promise.all([fetchNews(), fetchStaffArticles()]);
  };

  const deleteNews = async (id: string) => {
    await api.delete(`/api/articles/${id}`);
    toast.success('Deleted');
    await Promise.all([fetchNews(), fetchStaffArticles()]);
  };

  const submitNews = async (id: string) => {
    await api.post(`/api/articles/${id}/submit`);
    toast.success('Submitted for review');
    await Promise.all([fetchNews(), fetchStaffArticles()]);
  };

  const approveNews = async (id: string) => {
    await api.post(`/api/articles/${id}/approve`);
    toast.success('Approved');
    await Promise.all([fetchNews(), fetchStaffArticles()]);
  };

  const rejectNews = async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/reject`, { reason });
    toast.info('Rejected');
    await fetchStaffArticles();
  };

  const reworkNews = async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/rework`, { reason });
    toast.info('Sent for rework');
    await fetchStaffArticles();
  };

  const fetchMagazines = async () => {
    try {
      const { data: resp } = await api.get('/api/magazines');
      const r = resp as { magazines?: MagazineItem[]; queue?: MagazineItem[] };
      const list = r.magazines ?? [];
      setMagazines(list);
      setMagazineApprovalQueue(Array.isArray(r.queue) ? r.queue : list.filter((m) => m.status === 'IN_REVIEW'));
    } catch (e) { console.error('Magazines fetch failed'); }
  };

  const addMagazine = async (mag: Partial<MagazineItem>) => {
    try {
      await api.post('/api/magazines', mag);
      toast.success('Magazine created successfully');
      await fetchMagazines();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to create magazine. Please try again.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const updateMagazine = async (id: string, mag: Partial<MagazineItem>) => {
    await api.patch(`/api/magazines/${id}`, mag);
    toast.success('Magazine updated');
    await fetchMagazines();
  };

  const deleteMagazine = async (id: string) => {
    await api.delete(`/api/magazines/${id}`);
    toast.success('Deleted');
    await fetchMagazines();
  };

  const submitMagazine = async (id: string) => {
    await api.post(`/api/magazines/${id}/submit`);
    toast.success('Submitted for review');
    await fetchMagazines();
  };

  const approveMagazine = async (id: string) => {
    await api.post(`/api/magazines/${id}/approve`);
    toast.success('Magazine approved');
    await fetchMagazines();
  };

  const rejectMagazine = async (id: string, reason: string) => {
    await api.post(`/api/magazines/${id}/reject`, { reason });
    toast.info('Magazine rejected');
    await fetchMagazines();
  };

  const reworkMagazine = async (id: string, reason: string) => {
    await api.post(`/api/magazines/${id}/rework`, { reason });
    toast.info('Sent for rework');
    await fetchMagazines();
  };

  const fetchAds = async () => {
    try {
      const { data: resp } = await api.get('/api/ads');
      const r = resp as { ads?: AdItem[] };
      setAds(r.ads ?? []);
    } catch (e) { console.error('Ads fetch failed'); }
  };

  const fetchAdminAds = async () => {
    const { data: resp } = await api.get('/api/ads');
    const r = resp as { ads?: AdItem[] };
    return r.ads ?? [];
  };

  const createAd = async (ad: Partial<AdItem>) => {
    await api.post('/api/ads', ad);
    toast.success('Ad created');
    fetchAds();
  };

  const updateAd = async (id: string, ad: Partial<AdItem>) => {
    await api.put(`/api/ads/${id}`, ad);
    toast.success('Ad updated');
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    await api.delete(`/api/ads/${id}`);
    toast.success('Ad deleted');
    fetchAds();
  };

  const fetchMedia = async () => {
    try {
      const { data: resp } = await api.get('/api/media');
      const r = resp as { media?: MediaItem[] };
      setMedia(r.media ?? []);
    } catch (e) { console.error('Media fetch failed'); }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: resp } = await api.post('/api/uploads', formData);
    const r = resp as { url?: string; media?: { url?: string } };
    const media = r.media;
    return { url: media?.url ?? r.url ?? '' };
  };

  const fetchUsers = async () => {
    try {
      const { data: resp } = await api.get('/api/users');
      const r = resp as { users?: User[] };
      setUsers(r.users ?? []);
    } catch (e) { console.error('Users fetch failed'); }
  };

  const approveUser = async (id: string) => {
    await api.post(`/api/subscription-requests/${id}/approve`);
    toast.success('Approved');
    await Promise.all([fetchSubscriptionRequests(), fetchUsers()]);
  };

  const rejectUser = async (id: string, reason: string) => {
    await api.post(`/api/subscription-requests/${id}/reject`, { reason });
    toast.info('Rejected');
    await fetchSubscriptionRequests();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/api/subscription-requests/${id}`);
    toast.success('Deleted');
    await fetchSubscriptionRequests();
  };

  const fetchSubscriptionRequests = async () => {
    try {
      const { data: resp } = await api.get('/api/subscription-requests');
      const r = resp as { requests?: SubscriptionRequest[] };
      setSubscriptionRequests(r.requests ?? []);
    } catch (e) {
      console.error('Subscription requests fetch failed');
    }
  };

  const fetchSettings = async () => {
     try {
       const { data: resp } = await api.get('/api/settings');
       const s = (resp as { settings?: SiteSettings }).settings;
       if (s) setSiteSettings(s);
     } catch(e) {}
  };

  const fetchHero = async () => {
     try {
       const { data: resp } = await api.get('/api/hero');
       const h = (resp as { hero?: HeroData }).hero;
       if (h) setHeroData(h);
     } catch(e) {}
  };

  const updateSettings = async (data: Partial<SiteSettings>) => {
    await api.put('/api/settings', data);
    toast.success('Settings Saved');
    fetchSettings();
  };

  const updateHero = async (data: Partial<HeroData>) => {
    await api.put('/api/hero', data);
    toast.success('Hero Updated');
    fetchHero();
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchNews(), fetchMagazines(), fetchAds(), fetchSettings(), fetchHero()]);
      if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) {
         await Promise.all([fetchStaffArticles(), fetchMedia()]);
      }
      if (['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role || '')) {
         await Promise.all([fetchUsers(), fetchSubscriptionRequests()]);
      }
      setIsReady(true);
    };
    init();
  }, [currentUser]);

  const openSubscriptionPopup = () => setSubscriptionPopupOpen(true);
  const closeSubscriptionPopup = () => setSubscriptionPopupOpen(false);

  const value = {
    isReady, currentUser, news, staffArticles, articleApprovalQueue, magazineApprovalQueue, magazines, ads, media, users, subscriptionRequests, siteSettings, heroData,
    subscriptionPopupOpen,
    openSubscriptionPopup,
    closeSubscriptionPopup,
    login, loginWithGoogle, registerReader, logout,
    fetchNews, fetchStaffArticles, addNews, updateNews, deleteNews, submitNews, approveNews, rejectNews, reworkNews,
    fetchMagazines, addMagazine, updateMagazine, deleteMagazine, submitMagazine, approveMagazine, rejectMagazine, reworkMagazine,
    fetchAds, fetchAdminAds, createAd, updateAd, deleteAd,
    fetchMedia, uploadFile,
    fetchUsers, fetchSubscriptionRequests, approveUser, rejectUser, deleteUser,
    updateSettings, updateHero, fetchSettings, fetchHero
  };

  return (
    <AppContext.Provider value={value}>
      <SubscriptionPopup />
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
