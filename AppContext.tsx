import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from './lib/api';
import {
  NewsItem,
  MagazineItem,
  User,
  AdItem,
  MediaItem,
  SubscriptionTableRow
} from './types';
import toast from 'react-hot-toast';
import { SESSION_STORAGE_KEY, AUTH_TOKEN_KEY } from './utils/app';
import {
  mapNewsRow,
  mapMagazineRow,
  mapUserRow,
  mapAdRow,
  mapSubscriptionRow,
  extractNewsListPayload
} from './utils/apiMappers';

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
  /** All magazine issues for admin (includes non-published). */
  adminMagazines: MagazineItem[];
  pendingArticles: NewsItem[];
  subscriptionRequests: SubscriptionTableRow[];
  ads: AdItem[];
  media: MediaItem[];
  users: User[];
  siteSettings: SiteSettings;
  heroData: HeroData;
  
  // Auth
  login: (email: string, pass: string) => Promise<User>;
  loginStaff: (email: string, pass: string) => Promise<User>;
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
  fetchAdminMagazines: () => Promise<void>;
  addMagazine: (mag: Partial<MagazineItem>) => Promise<void>;
  deleteMagazine: (id: string) => Promise<void>;

  // Approvals (admin)
  fetchPendingArticles: () => Promise<void>;
  fetchSubscriptionRequests: () => Promise<void>;
  approveSubscription: (id: string) => Promise<void>;
  rejectSubscription: (id: string, reason: string) => Promise<void>;

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

  /** Client-side: translate in-memory article fields via public `/api/translate/batch`. */
  batchTranslateNews: (ids: string[], targetLang: string) => Promise<void>;
  translateNewsContent: (id: string, targetLang: string) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

const normalizeUser = (u: User): User => ({
  ...u,
  role: (String(u.role).trim().toUpperCase() as User['role']) || u.role
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!saved) return null;
    try {
      return normalizeUser(JSON.parse(saved) as User);
    } catch {
      return null;
    }
  });
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [staffArticles, setStaffArticles] = useState<NewsItem[]>([]);
  const [magazines, setMagazines] = useState<MagazineItem[]>([]);
  const [adminMagazines, setAdminMagazines] = useState<MagazineItem[]>([]);
  const [pendingArticles, setPendingArticles] = useState<NewsItem[]>([]);
  const [subscriptionRequests, setSubscriptionRequests] = useState<SubscriptionTableRow[]>([]);
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
    const { data: resp } = await api.post('/api/auth/login', { email, password });
    const token: string = (resp as { token: string }).token;
    const user = normalizeUser((resp as { user: User }).user);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome, ${user.name}`);
    return user;
  };

  const loginStaff = async (email: string, password?: string) => {
    const { data: resp } = await api.post('/api/auth/staff/login', { email, password });
    const token: string = (resp as { token: string }).token;
    const user = normalizeUser((resp as { user: User }).user);
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(user));
    setCurrentUser(user);
    toast.success(`Welcome, ${user.name}`);
    return user;
  };

  const loginWithGoogle = async (credential: string) => {
    const { data: resp } = await api.post('/api/auth/google', { credential });
    const token: string = (resp as { token: string }).token;
    const user = normalizeUser((resp as { user: User }).user);
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
    toast('Logged out');
  };

  const registerReader = async (formData: { email: string; password: string; name: string }) => {
    await api.post('/api/auth/register', formData);
  };

  const fetchNews = async () => {
    try {
      const { data: resp } = await api.get('/api/articles');
      const raw = extractNewsListPayload(resp);
      setNews(raw.map((row) => mapNewsRow(row)));
    } catch (e) {
      console.error('Articles fetch failed');
    }
  };

  const fetchStaffArticles = async () => {
    try {
      const { data: resp } = await api.get('/api/articles/all');
      const raw = extractNewsListPayload(resp);
      setStaffArticles(raw.map((row) => mapNewsRow(row)));
    } catch (e) {
      console.error('Staff articles fetch failed');
    }
  };

  const fetchPendingArticles = async () => {
    try {
      const { data: resp } = await api.get('/api/articles/pending');
      const raw = extractNewsListPayload(resp);
      setPendingArticles(raw.map((row) => mapNewsRow(row)));
    } catch (e) {
      console.error('Pending articles fetch failed');
    }
  };

  const fetchSubscriptionRequests = async () => {
    try {
      const { data: resp } = await api.get('/api/subscriptions/admin');
      const r = resp as { subscriptions?: Record<string, unknown>[] };
      const raw = r.subscriptions ?? [];
      setSubscriptionRequests(raw.map((row) => mapSubscriptionRow(row)));
    } catch (e) {
      console.error('Subscription requests fetch failed');
    }
  };

  const addNews = async (item: Partial<NewsItem>) => {
    await api.post('/api/articles', item);
    toast.success('Article saved');
    fetchNews();
    if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) fetchStaffArticles();
  };

  const updateNews = async (id: string, item: Partial<NewsItem>) => {
    await api.put(`/api/articles/${id}`, item);
    toast.success('Article updated');
    fetchNews();
    fetchStaffArticles();
  };

  const deleteNews = async (id: string) => {
    await api.delete(`/api/articles/${id}`);
    toast.success('Deleted');
    fetchStaffArticles();
  };

  const approveNews = async (id: string) => {
    await api.post(`/api/articles/${id}/approve`);
    toast.success('Approved');
    await fetchStaffArticles();
    await fetchNews();
    await fetchPendingArticles();
  };

  const rejectNews = async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/reject`, { reason });
    toast('Rejected');
    await fetchStaffArticles();
    await fetchNews();
    await fetchPendingArticles();
  };

  const reworkNews = async (id: string, reason: string) => {
    await api.post(`/api/articles/${id}/rework`, { reason });
    toast('Sent for rework');
    await fetchStaffArticles();
    await fetchNews();
    await fetchPendingArticles();
  };

  const fetchMagazines = async () => {
    try {
      const { data: resp } = await api.get('/api/magazines');
      const r = resp as { magazines?: Record<string, unknown>[] };
      const raw = r.magazines ?? [];
      setMagazines(raw.map((row) => mapMagazineRow(row)));
    } catch (e) {
      console.error('Magazines fetch failed');
    }
  };

  const fetchAdminMagazines = async () => {
    try {
      const { data: resp } = await api.get('/api/magazines/all');
      const r = resp as { magazines?: Record<string, unknown>[] };
      const raw = r.magazines ?? [];
      setAdminMagazines(raw.map((row) => mapMagazineRow(row)));
    } catch (e) {
      console.error('Admin magazines fetch failed');
    }
  };

  const addMagazine = async (mag: Partial<MagazineItem>) => {
    try {
      await api.post('/api/magazines', mag);
      toast.success('Magazine created successfully');
      await fetchMagazines();
      await fetchAdminMagazines();
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to create magazine. Please try again.';
      toast.error(errorMsg);
      throw new Error(errorMsg);
    }
  };

  const deleteMagazine = async (id: string) => {
    await api.delete(`/api/magazines/${id}`);
    toast.success('Deleted');
    await fetchMagazines();
    await fetchAdminMagazines();
  };

  const fetchAds = async () => {
    try {
      const { data: resp } = await api.get('/api/ads');
      const r = resp as { ads?: AdItem[] };
      setAds(r.ads ?? []);
    } catch (e) { console.error('Ads fetch failed'); }
  };

  const fetchAdminAds = async () => {
    const { data: resp } = await api.get('/api/ads/admin');
    const r = resp as { ads?: Record<string, unknown>[] };
    const raw = r.ads ?? [];
    return raw.map((row) => mapAdRow(row));
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
      const r = resp as { users?: Record<string, unknown>[] };
      const raw = r.users ?? [];
      setUsers(raw.map((row) => mapUserRow(row)));
    } catch (e) {
      console.error('Users fetch failed');
    }
  };

  const approveSubscription = async (id: string) => {
    await api.post(`/api/subscriptions/${id}/approve`);
    toast.success('Subscription approved');
    await fetchSubscriptionRequests();
    await fetchUsers();
  };

  const rejectSubscription = async (id: string, reason: string) => {
    await api.post(`/api/subscriptions/${id}/reject`, { reason });
    toast('Subscription rejected');
    await fetchSubscriptionRequests();
  };

  const approveUser = async (id: string) => {
    await api.post(`/api/users/${id}/approve`);
    toast.success('Approved');
    fetchUsers();
  };

  const rejectUser = async (id: string, reason: string) => {
    await api.post(`/api/users/${id}/reject`, { reason });
    toast('Rejected');
    fetchUsers();
  };

  const deleteUser = async (id: string) => {
    await api.delete(`/api/users/${id}`);
    toast.success('Deleted');
    fetchUsers();
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

  const batchTranslateNews = useCallback(
    async (ids: string[], targetLang: string) => {
      const items = news.filter((n) => ids.includes(n.id));
      if (items.length === 0) return;

      const textEntries: Array<{ id: string; field: 'title' | 'excerpt' | 'content'; text: string }> = [];
      for (const n of items) {
        if (n.title) textEntries.push({ id: n.id, field: 'title', text: n.title });
        if (n.excerpt) textEntries.push({ id: n.id, field: 'excerpt', text: n.excerpt });
        if (n.content) textEntries.push({ id: n.id, field: 'content', text: n.content });
      }
      if (textEntries.length === 0) return;

      const texts = textEntries.map((e) => e.text);
      try {
        const { data: resp } = await api.post<{ translations: Record<string, string> }>('/api/translate/batch', {
          texts,
          targetLang
        });
        const translations = resp?.translations ?? {};
        setNews((prev) =>
          prev.map((article) => {
            if (!ids.includes(article.id)) return article;
            const next = { ...article };
            for (const e of textEntries) {
              if (e.id !== article.id) continue;
              const translated = translations[e.text];
              if (!translated) continue;
              if (e.field === 'title') next.title = translated;
              else if (e.field === 'excerpt') next.excerpt = translated;
              else next.content = translated;
            }
            return next;
          })
        );
      } catch (e) {
        console.error('Batch translate failed', e);
      }
    },
    [news]
  );

  const translateNewsContent = useCallback(
    async (id: string, targetLang: string) => {
      await batchTranslateNews([id], targetLang);
    },
    [batchTranslateNews]
  );

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) return;
    void (async () => {
      try {
        const { data: resp } = await api.get('/api/auth/me');
        const r = resp as { user?: Record<string, unknown> };
        if (r.user) {
          const u = normalizeUser(mapUserRow(r.user) as User);
          setCurrentUser(u);
          localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(u));
        }
      } catch {
        /* token invalid — interceptor may clear session */
      }
    })();
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([fetchNews(), fetchMagazines(), fetchAds(), fetchSettings(), fetchHero()]);
        if (['ADMIN', 'SUPER_ADMIN', 'EDITOR'].includes(currentUser?.role || '')) {
          const staffLoads: Promise<unknown>[] = [fetchStaffArticles(), fetchMedia()];
          if (['ADMIN', 'SUPER_ADMIN'].includes(String(currentUser?.role))) {
            staffLoads.push(
              fetchUsers(),
              fetchAdminMagazines(),
              fetchPendingArticles(),
              fetchSubscriptionRequests()
            );
          }
          await Promise.all(staffLoads);
        }
      } catch (e) {
        console.error('App data init failed', e);
      } finally {
        setIsReady(true);
      }
    };
    void init();
  }, [currentUser]);

  const value = {
    isReady,
    currentUser,
    news,
    staffArticles,
    magazines,
    adminMagazines,
    pendingArticles,
    subscriptionRequests,
    ads,
    media,
    users,
    siteSettings,
    heroData,
    login,
    loginStaff,
    loginWithGoogle,
    registerReader,
    logout,
    fetchNews,
    fetchStaffArticles,
    addNews,
    updateNews,
    deleteNews,
    approveNews,
    rejectNews,
    reworkNews,
    fetchMagazines,
    fetchAdminMagazines,
    addMagazine,
    deleteMagazine,
    fetchPendingArticles,
    fetchSubscriptionRequests,
    approveSubscription,
    rejectSubscription,
    fetchAds,
    fetchAdminAds,
    createAd,
    updateAd,
    deleteAd,
    fetchMedia,
    uploadFile,
    fetchUsers,
    approveUser,
    rejectUser,
    deleteUser,
    updateSettings,
    updateHero,
    fetchSettings,
    fetchHero,
    batchTranslateNews,
    translateNewsContent
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
