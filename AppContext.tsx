import React, { createContext, useContext, useState, useEffect } from 'react';
import api from './lib/api';
import { 
  NewsItem, 
  MagazineItem, 
  User, 
  AdItem, 
  MediaItem, 
  UserRole, 
  NewsStatus 
} from './types';
import toast from 'react-hot-toast';
import { SESSION_STORAGE_KEY, AUTH_TOKEN_KEY } from './utils/app';

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
  magazines: MagazineItem[];
  ads: AdItem[];
  media: MediaItem[];
  users: User[];
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
  approveNews: (id: string) => Promise<void>;
  rejectNews: (id: string, reason: string) => Promise<void>;
  reworkNews: (id: string, reason: string) => Promise<void>;

  // Magazines
  fetchMagazines: () => Promise<void>;
  addMagazine: (mag: Partial<MagazineItem>) => Promise<void>;
  deleteMagazine: (id: string) => Promise<void>;

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
  approveUser: (id: string) => Promise<void>;
  rejectUser: (id: string, reason: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

  // Global Config
  updateSettings: (data: Partial<SiteSettings>) => Promise<void>;
  updateHero: (data: Partial<HeroData>) => Promise<void>;
  fetchSettings: () => Promise<void>;
  fetchHero: () => Promise<void>;
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
  const [magazines, setMagazines] = useState<MagazineItem[]>([]);
  const [ads, setAds] = useState<AdItem[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
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
    const { data: resp } = await api.post('/auth/login', { email, password });
    // Server wraps payload in { success, data: { token, user } }
    const token: string = resp.data?.token ?? resp.token;
    const user = resp.data?.user ?? resp.user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome, ${user.name}`);
    return user;
  };

  const loginWithGoogle = async (credential: string) => {
    const { data: resp } = await api.post('/auth/google', { credential });
    const token: string = resp.data?.token ?? resp.token;
    const user = resp.data?.user ?? resp.user;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome!`);
    return user;
  };

  const logout = () => {
    // Attempt server-side cookie/session cleanup (fire and forget)
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
    setCurrentUser(null);
    toast.info('Logged out');
  };

  const registerReader = async (formData: any) => {
    await api.post('/auth/register', formData);
  };

  const fetchNews = async () => {
    try {
      const { data: resp } = await api.get('/articles');
      setNews(resp.data?.articles ?? resp.news ?? []);
    } catch (e) { console.error('Articles fetch failed'); }
  };

  const fetchStaffArticles = async () => {
    try {
      // /articles returns all articles for authenticated staff via the modular server
      const { data: resp } = await api.get('/articles');
      setStaffArticles(resp.data?.articles ?? resp.news ?? []);
    } catch (e) { console.error('Staff articles fetch failed'); }
  };

  const addNews = async (item: Partial<NewsItem>) => {
    await api.post('/articles', item);
    toast.success('Article saved');
    fetchNews();
    if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) fetchStaffArticles();
  };

  const updateNews = async (id: string, item: Partial<NewsItem>) => {
    await api.put(`/articles/${id}`, item);
    toast.success('Article updated');
    fetchNews();
    fetchStaffArticles();
  };

  const deleteNews = async (id: string) => {
    await api.delete(`/articles/${id}`);
    toast.success('Deleted');
    fetchStaffArticles();
  };

  const approveNews = async (id: string) => {
    await api.post(`/articles/${id}/approve`);
    toast.success('Approved');
    fetchStaffArticles();
  };

  const rejectNews = async (id: string, reason: string) => {
    await api.post(`/articles/${id}/reject`, { reason });
    toast.info('Rejected');
    fetchStaffArticles();
  };

  const reworkNews = async (id: string, reason: string) => {
    await api.post(`/articles/${id}/rework`, { reason });
    toast.info('Sent for rework');
    fetchStaffArticles();
  };

  const fetchMagazines = async () => {
    try {
      const { data: resp } = await api.get('/magazines');
      setMagazines(resp.data?.magazines ?? resp.magazines ?? []);
    } catch (e) { console.error('Magazines fetch failed'); }
  };

  const addMagazine = async (mag: Partial<MagazineItem>) => {
    await api.post('/magazines', mag);
    toast.success('Magazine added');
    fetchMagazines();
  };

  const deleteMagazine = async (id: string) => {
    await api.delete(`/magazines/${id}`);
    toast.success('Deleted');
    fetchMagazines();
  };

  const fetchAds = async () => {
    try {
      const { data: resp } = await api.get('/ads');
      setAds(resp.data?.ads ?? resp.ads ?? []);
    } catch (e) { console.error('Ads fetch failed'); }
  };

  const fetchAdminAds = async () => {
    const { data: resp } = await api.get('/ads');
    return resp.data?.ads ?? resp.ads ?? [];
  };

  const createAd = async (ad: Partial<AdItem>) => {
    await api.post('/ads', ad);
    toast.success('Ad created');
    fetchAds();
  };

  const updateAd = async (id: string, ad: Partial<AdItem>) => {
    await api.put(`/ads/${id}`, ad);
    toast.success('Ad updated');
    fetchAds();
  };

  const deleteAd = async (id: string) => {
    await api.delete(`/ads/${id}`);
    toast.success('Ad deleted');
    fetchAds();
  };

  const fetchMedia = async () => {
    try {
      const { data: resp } = await api.get('/media');
      setMedia(resp.data?.media ?? resp.media ?? []);
    } catch (e) { console.error('Media fetch failed'); }
  };

  const uploadFile = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const { data: resp } = await api.post('/uploads', formData);
    const media = resp.data?.media ?? resp.media;
    return { url: media?.url ?? '' };
  };

  const fetchUsers = async () => {
    try {
      const { data: resp } = await api.get('/users');
      setUsers(resp.data?.users ?? resp.users ?? []);
    } catch (e) { console.error('Users fetch failed'); }
  };

  const approveUser = async (id: string) => {
    await api.post(`/users/${id}/approve`);
    toast.success('Approved');
    fetchUsers();
  };

  const rejectUser = async (id: string, reason: string) => {
    await api.post(`/users/${id}/reject`, { reason });
    toast.info('Rejected');
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/users/${id}`);
    toast.success('Deleted');
    fetchUsers();
  };

  const fetchSettings = async () => {
     try {
       const { data: resp } = await api.get('/settings');
       const s = resp.data?.settings ?? resp.settings;
       if (s) setSiteSettings(s);
     } catch(e) {}
  };

  const fetchHero = async () => {
     try {
       const { data: resp } = await api.get('/hero');
       const h = resp.data?.hero ?? resp.hero;
       if (h) setHeroData(h);
     } catch(e) {}
  };

  const updateSettings = async (data: Partial<SiteSettings>) => {
    await api.put('/settings', data);
    toast.success('Settings Saved');
    fetchSettings();
  };

  const updateHero = async (data: Partial<HeroData>) => {
    await api.put('/hero', data);
    toast.success('Hero Updated');
    fetchHero();
  };

  useEffect(() => {
    const init = async () => {
      await Promise.all([fetchNews(), fetchMagazines(), fetchAds(), fetchSettings(), fetchHero()]);
      if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) {
         await Promise.all([fetchStaffArticles(), fetchMedia(), fetchUsers()]);
      }
      setIsReady(true);
    };
    init();
  }, [currentUser]);

  const value = {
    isReady, currentUser, news, staffArticles, magazines, ads, media, users, siteSettings, heroData,
    login, loginWithGoogle, registerReader, logout,
    fetchNews, fetchStaffArticles, addNews, updateNews, deleteNews, approveNews, rejectNews, reworkNews,
    fetchMagazines, addMagazine, deleteMagazine,
    fetchAds, fetchAdminAds, createAd, updateAd, deleteAd,
    fetchMedia, uploadFile,
    fetchUsers, approveUser, rejectUser, deleteUser,
    updateSettings, updateHero, fetchSettings, fetchHero
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
