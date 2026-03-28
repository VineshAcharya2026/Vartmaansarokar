
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AppState, User, UserRole, NewsPost, MagazineIssue, Ad } from './types';
import { INITIAL_NEWS, INITIAL_MAGAZINES, INITIAL_ADS } from './constants';

interface AppContextType extends AppState {
  login: (email: string) => void;
  logout: () => void;
  addNews: (post: NewsPost) => void;
  // Added deleteNews to fix Property 'deleteNews' does not exist on type 'AppContextType' in Admin.tsx
  deleteNews: (id: string) => void;
  addMagazine: (mag: MagazineIssue) => void;
  updateMagazine: (id: string, updates: Partial<MagazineIssue>) => void;
  deleteMagazine: (id: string) => void;
  updateUserRole: (userId: string, role: UserRole) => void;
  updateAds: (newAds: Ad[]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    news: INITIAL_NEWS,
    magazines: INITIAL_MAGAZINES,
    ads: INITIAL_ADS,
    users: [
      { id: '1', name: 'Master Admin', email: 'admin@daily.com', role: UserRole.ADMIN },
      { id: '2', name: 'Standard Editor', email: 'editor@daily.com', role: UserRole.MAGAZINE },
      { id: '3', name: 'Premium Subscriber', email: 'user@daily.com', role: UserRole.GENERAL }
    ],
    currentUser: null
  });

  const login = (email: string) => {
    const existingUser = state.users.find(u => u.email === email);
    if (existingUser) {
      setState(prev => ({ ...prev, currentUser: existingUser }));
    } else {
      // Allow dynamic login for demo purposes
      const newUser: User = { 
        id: Date.now().toString(), 
        email, 
        name: email.split('@')[0], 
        role: UserRole.GENERAL 
      };
      setState(prev => ({ 
        ...prev, 
        users: [...prev.users, newUser],
        currentUser: newUser 
      }));
    }
  };

  const logout = () => {
    setState(prev => ({ ...prev, currentUser: null }));
  };

  const addNews = (post: NewsPost) => {
    setState(prev => ({ ...prev, news: [post, ...prev.news] }));
  };

  // Fix: Added deleteNews function implementation to allow deleting news posts
  const deleteNews = (id: string) => {
    setState(prev => ({
      ...prev,
      news: prev.news.filter(n => n.id !== id)
    }));
  };

  const addMagazine = (mag: MagazineIssue) => {
    setState(prev => ({ ...prev, magazines: [mag, ...prev.magazines] }));
  };

  const updateMagazine = (id: string, updates: Partial<MagazineIssue>) => {
    setState(prev => ({
      ...prev,
      magazines: prev.magazines.map(m => m.id === id ? { ...m, ...updates } : m)
    }));
  };

  const deleteMagazine = (id: string) => {
    setState(prev => ({
      ...prev,
      magazines: prev.magazines.filter(m => m.id !== id)
    }));
  };

  const updateUserRole = (userId: string, role: UserRole) => {
    setState(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === userId ? { ...u, role } : u),
      currentUser: prev.currentUser?.id === userId ? { ...prev.currentUser, role } : prev.currentUser
    }));
  };

  const updateAds = (newAds: Ad[]) => {
    setState(prev => ({ ...prev, ads: newAds }));
  };

  return (
    <AppContext.Provider value={{ 
      ...state, 
      login, 
      logout, 
      addNews, 
      deleteNews,
      addMagazine, 
      updateMagazine,
      deleteMagazine,
      updateUserRole,
      updateAds
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
