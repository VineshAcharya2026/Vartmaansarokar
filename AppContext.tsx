import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Ad,
  AdsPayload,
  AppState,
  AppStatePayload,
  AuthMePayload,
  AuthPayload,
  MagazineIssue,
  MagazinesPayload,
  NewsPost,
  User,
  UserRole,
  UsersPayload
} from './types';
import { INITIAL_ADS, INITIAL_MAGAZINES, INITIAL_NEWS } from './constants';
import { API_BASE, AUTH_TOKEN_KEY, SESSION_STORAGE_KEY, STAFF_LOGIN_EMAILS, getAuthHeaders } from './utils/app';
import { fetchApi, parseApiResponse } from './utils/api';

interface AppContextType extends AppState {
  isReady: boolean;
  login: (payload: { email: string; password: string } | string) => Promise<User | null>;
  loginWithGoogle: (credential: string) => Promise<User | null>;
  logout: () => void;
  activateDigitalSubscription: (payload: { name: string; email: string; phone: string }) => Promise<User | null>;
  addNews: (post: NewsPost) => Promise<void>;
  updateNews: (id: string, updates: Partial<NewsPost>) => Promise<void>;
  deleteNews: (id: string) => Promise<void>;
  addMagazine: (magazine: MagazineIssue) => Promise<void>;
  updateMagazine: (id: string, updates: Partial<MagazineIssue>) => Promise<void>;
  deleteMagazine: (id: string) => Promise<void>;
  updateUserRole: (userId: string, role: UserRole) => Promise<void>;
  updateAds: (ads: Ad[]) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_USERS: User[] = [
  { id: '1', name: 'Super Admin', email: STAFF_LOGIN_EMAILS.superAdmin, role: UserRole.SUPER_ADMIN, authProvider: 'PASSWORD' },
  { id: '2', name: 'Admin', email: STAFF_LOGIN_EMAILS.admin, role: UserRole.ADMIN, authProvider: 'PASSWORD' },
  { id: '3', name: 'Editor', email: STAFF_LOGIN_EMAILS.editor, role: UserRole.MAGAZINE, authProvider: 'PASSWORD' }
];

function mergeById<T extends { id: string }>(primary: T[] = [], fallback: T[] = []) {
  const map = new Map<string, T>();
  [...fallback, ...primary].forEach((item) => {
    map.set(item.id, item);
  });
  return Array.from(map.values());
}

function storeAuthenticatedUser(user: User | null, token?: string) {
  if (user?.id) {
    window.localStorage.setItem(SESSION_STORAGE_KEY, user.id);
  }

  if (token) {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

function clearStoredAuth() {
  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

export const AppProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [state, setState] = useState<AppState>({
    news: INITIAL_NEWS,
    magazines: INITIAL_MAGAZINES,
    ads: INITIAL_ADS,
    users: DEFAULT_USERS,
    currentUser: null
  });

  useEffect(() => {
    const loadAppState = async () => {
      try {
        const mePromise = fetch(API_BASE + '/api/auth/me', {
          headers: {
            ...getAuthHeaders()
          }
        })
          .then((response) => (response.ok ? parseApiResponse<AuthMePayload>(response) : null))
          .catch(() => null);

        const [appStateData, meData] = await Promise.all([
          fetchApi<AppStatePayload>(API_BASE + '/api/app-state'),
          mePromise
        ]);

        const mergedNews = mergeById(
          appStateData.news.map((item) => {
            const fallback = INITIAL_NEWS.find((entry) => entry.id === item.id);
            return {
              ...fallback,
              ...item,
              featured: item.featured ?? fallback?.featured ?? false,
              requiresSubscription: item.requiresSubscription ?? fallback?.requiresSubscription ?? false
            };
          }),
          INITIAL_NEWS
        );
        const mergedMagazines = mergeById(appStateData.magazines, INITIAL_MAGAZINES);
        const mergedAds = mergeById(appStateData.ads, INITIAL_ADS);
        const mergedUsers = mergeById(appStateData.users, DEFAULT_USERS);
        const storedUserId = window.localStorage.getItem(SESSION_STORAGE_KEY);

        setState((prev) => ({
          ...prev,
          news: mergedNews,
          magazines: mergedMagazines,
          ads: mergedAds,
          users: mergedUsers,
          currentUser: meData?.user ?? mergedUsers.find((user) => user.id === storedUserId) ?? null
        }));
      } catch (error) {
        console.warn('Using local fallback app state:', error);
      } finally {
        setIsReady(true);
      }
    };

    void loadAppState();
  }, []);

  const syncAuthenticatedState = (payload: AuthPayload) => {
    setState((prev) => ({
      ...prev,
      users: payload.users
        ? payload.users
        : payload.user
          ? prev.users.some((user) => user.id === payload.user.id)
            ? prev.users.map((user) => (user.id === payload.user.id ? payload.user : user))
            : [...prev.users, payload.user]
          : prev.users,
      currentUser: payload.user ?? prev.currentUser
    }));
    storeAuthenticatedUser(payload.user ?? null, payload.token);
  };

  const login = async (payload: { email: string; password: string } | string) => {
    if (typeof payload === 'string') {
      const email = payload.trim().toLowerCase();
      const data = await fetchApi<AuthPayload>(API_BASE + '/api/auth/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      syncAuthenticatedState(data);
      return data.user ?? null;
    }

    const data = await fetchApi<AuthPayload>(API_BASE + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: payload.email.trim().toLowerCase(), password: payload.password })
    });

    syncAuthenticatedState(data);
    return data.user ?? null;
  };

  const loginWithGoogle = async (credential: string) => {
    const data = await fetchApi<AuthPayload>(API_BASE + '/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential })
    });

    syncAuthenticatedState(data);
    return data.user ?? null;
  };

  const logout = () => {
    clearStoredAuth();
    setState((prev) => ({ ...prev, currentUser: null }));
  };

  const activateDigitalSubscription = async ({
    name,
    email,
    phone
  }: {
    name: string;
    email: string;
    phone: string;
  }) => {
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const data = await fetchApi<AuthPayload>(API_BASE + '/api/subscriptions/digital', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email: normalizedEmail, phone })
      });

      const user = data.user ?? null;
      setState((prev) => ({
        ...prev,
        users: data.users ?? prev.users,
        currentUser: user ?? prev.currentUser
      }));
      storeAuthenticatedUser(user, data.token);
      return user;
    } catch (error) {
      const fallbackUser =
        state.users.find((user) => user.email.toLowerCase() === normalizedEmail) ?? {
          id: Date.now().toString(),
          email: normalizedEmail,
          name,
          role: UserRole.GENERAL,
          subscription: {
            type: 'DIGITAL' as const,
            status: 'ACTIVE' as const,
            expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
          }
        };

      setState((prev) => ({
        ...prev,
        users: prev.users.some((user) => user.email.toLowerCase() === normalizedEmail)
          ? prev.users.map((user) =>
              user.email.toLowerCase() === normalizedEmail
                ? {
                    ...user,
                    name,
                    role: user.role,
                    subscription: {
                      type: 'DIGITAL',
                      status: 'ACTIVE',
                      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
                    }
                  }
                : user
            )
          : [...prev.users, fallbackUser],
        currentUser: fallbackUser
      }));
      storeAuthenticatedUser(fallbackUser);
      return fallbackUser;
    }
  };

  const addNews = async (post: NewsPost) => {
    try {
      const data = await fetchApi<{ news?: NewsPost[] }>(API_BASE + '/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(post)
      });
      setState((prev) => ({ ...prev, news: data.news ?? prev.news }));
    } catch (error) {
      setState((prev) => ({ ...prev, news: [post, ...prev.news] }));
    }
  };

  const updateNews = async (id: string, updates: Partial<NewsPost>) => {
    try {
      const data = await fetchApi<{ news?: NewsPost[] }>(API_BASE + `/api/news/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      setState((prev) => ({ ...prev, news: data.news ?? prev.news }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        news: prev.news.map((item) => (item.id === id ? { ...item, ...updates } : item))
      }));
    }
  };

  const deleteNews = async (id: string) => {
    try {
      const data = await fetchApi<{ news?: NewsPost[] }>(API_BASE + `/api/news/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      setState((prev) => ({ ...prev, news: data.news ?? prev.news }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        news: prev.news.filter((item) => item.id !== id)
      }));
    }
  };

  const addMagazine = async (magazine: MagazineIssue) => {
    try {
      const data = await fetchApi<MagazinesPayload>(API_BASE + '/api/magazines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(magazine)
      });
      setState((prev) => ({ ...prev, magazines: data.magazines ?? prev.magazines }));
    } catch (error) {
      setState((prev) => ({ ...prev, magazines: [magazine, ...prev.magazines] }));
    }
  };

  const updateMagazine = async (id: string, updates: Partial<MagazineIssue>) => {
    try {
      const data = await fetchApi<MagazinesPayload>(API_BASE + `/api/magazines/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updates)
      });
      setState((prev) => ({ ...prev, magazines: data.magazines ?? prev.magazines }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        magazines: prev.magazines.map((magazine) => (magazine.id === id ? { ...magazine, ...updates } : magazine))
      }));
    }
  };

  const deleteMagazine = async (id: string) => {
    try {
      const data = await fetchApi<MagazinesPayload>(API_BASE + `/api/magazines/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      setState((prev) => ({ ...prev, magazines: data.magazines ?? prev.magazines }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        magazines: prev.magazines.filter((magazine) => magazine.id !== id)
      }));
    }
  };

  const updateUserRole = async (userId: string, role: UserRole) => {
    try {
      const data = await fetchApi<UsersPayload>(API_BASE + `/api/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ role })
      });
      setState((prev) => ({
        ...prev,
        users: data.users ?? prev.users,
        currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, role } : prev.currentUser
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        users: prev.users.map((user) => (user.id === userId ? { ...user, role } : user)),
        currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, role } : prev.currentUser
      }));
    }
  };

  const updateAds = async (ads: Ad[]) => {
    try {
      const data = await fetchApi<AdsPayload>(API_BASE + '/api/ads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(ads)
      });
      setState((prev) => ({ ...prev, ads: data.ads ?? prev.ads }));
    } catch (error) {
      setState((prev) => ({ ...prev, ads }));
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        isReady,
        login,
        loginWithGoogle,
        logout,
        activateDigitalSubscription,
        addNews,
        updateNews,
        deleteNews,
        addMagazine,
        updateMagazine,
        deleteMagazine,
        updateUserRole,
        updateAds
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
