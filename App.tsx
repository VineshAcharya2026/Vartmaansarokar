import React, { Suspense, useLayoutEffect, useRef, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { useTranslation } from 'react-i18next';
import { AppProvider, useApp } from './AppContext';
import { TranslationProvider } from './context/TranslationContext';
import Home from './pages/Home';
import Sidebar from './components/Sidebar';
import AuthAccessModal, {
  AuthAccessModalLaunchOptions,
  AuthModalView,
  AccessType,
  MainAuthTab
} from './components/AuthAccessModal';
import SiteNavbar from './components/SiteNavbar';
import SiteFooter from './components/SiteFooter';
import ErrorBoundary from './components/ErrorBoundary';
import ToastProvider from './components/ToastProvider';

const Magazine = React.lazy(() => import('./pages/Magazine'));
const Admin = React.lazy(() => import('./pages/Admin'));
const StaffLogin = React.lazy(() => import('./pages/StaffLogin'));
const NewsDetail = React.lazy(() => import('./pages/NewsDetail'));
const Category = React.lazy(() => import('./pages/Category'));
const Verify = React.lazy(() => import('./pages/Verify'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Profile = React.lazy(() => import('./pages/Profile'));
const Articles = React.lazy(() => import('./pages/Articles'));
const Subscribe = React.lazy(() => import('./pages/Subscribe'));
const ArticleEditor = React.lazy(() => import('./pages/ArticleEditor'));

const AdsPage = React.lazy(() => import('./pages/AdsPage'));
const AdDetail = React.lazy(() => import('./pages/AdDetail'));

/**
 * ProtectedRoute — redirects to /staff-login if the user is not authenticated
 * or lacks a required role. Preserves the attempted path for post-login redirect.
 */
const STAFF_ROLES = ['ADMIN', 'SUPER_ADMIN', 'EDITOR'] as const;
type StaffRole = typeof STAFF_ROLES[number];

const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRoles?: StaffRole[] }> = ({ children, requiredRoles }) => {
  const { currentUser } = useApp();
  const location = useLocation();

  if (!currentUser) {
    return <Navigate to="/staff-login" state={{ from: location }} replace />;
  }

  if (requiredRoles && !requiredRoles.includes(currentUser.role as StaffRole)) {
    // Authenticated but wrong role — send home
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const NewsTicker: React.FC = () => {
  const { news } = useApp();
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const tickerItems = news.slice(0, 12);

  useLayoutEffect(() => {
    if (!trackRef.current || tickerItems.length === 0) return;
    const totalWidth = trackRef.current.scrollWidth / 2;
    const pixelsPerSecond = 42;
    const tween = gsap.fromTo(trackRef.current, { x: 0 }, {
      x: -totalWidth,
      duration: Math.max(totalWidth / pixelsPerSecond, 36),
      ease: 'none',
      repeat: -1
    });

    return () => {
      tween.kill();
    };
  }, [tickerItems.length]);

  if (tickerItems.length === 0) return null;

  return (
    <div className="sticky top-14 lg:top-[76px] z-[109] bg-[#1A1A2E] text-white border-b border-white/10 shadow-lg">
      <div className="max-w-[1600px] mx-auto flex items-center">
        <div className="shrink-0 bg-[#800000] px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.35em]">
          {t('ticker.newsflash')}
        </div>
        <div className="overflow-hidden py-2.5 flex-1">
          <div ref={trackRef} className="flex items-center whitespace-nowrap">
            {[...tickerItems, ...tickerItems].map((item, index) => (
              <Link key={`${item.id}-${index}`} to={`/news/${item.id}`} className="inline-flex items-center px-6 text-sm text-white/90 hover:text-white transition-colors">
                <span className="mr-3 text-[#800000]">&bull;</span>
                <span className="font-semibold">{item.title}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const NotFound: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold serif mb-4 text-[#001f3f]">{t('notFound.title')}</h1>
      <p className="text-gray-600 mb-6">{t('notFound.message')}</p>
      <Link to="/" className="inline-flex bg-[#800000] text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors">
        {t('common.returnHome')}
      </Link>
    </div>
  );
};

const AppContent: React.FC = () => {
  const location = useLocation();
  const { t } = useTranslation();
  const { isReady } = useApp();
  const isAdminPage = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const allowContentBeforeDataReady =
    location.pathname === '/staff-login' || location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterMessage, setNewsletterMessage] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSent, setNewsletterSent] = useState(false);

  const handleNewsletterSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setNewsletterMessage('');
    setNewsletterError('');

    if (!newsletterEmail.trim()) {
      setNewsletterError(t('footer.newsletterErrorEmpty'));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
      setNewsletterError(t('footer.newsletterErrorInvalid'));
      return;
    }

    setNewsletterSent(true);
    setNewsletterMessage(t('footer.newsletterSuccess'));
    setNewsletterEmail('');
  };
  const [authModalState, setAuthModalState] = React.useState<{
    isOpen: boolean;
    initialView: AuthModalView;
    initialAccessType: AccessType;
    initialMainTab?: MainAuthTab;
    prefillEmail?: string;
  }>({
    isOpen: false,
    initialView: 'subscribe',
    initialAccessType: 'DIGITAL'
  });

  const openAuthModal = React.useCallback((options: AuthAccessModalLaunchOptions = {}) => {
    setAuthModalState({
      isOpen: true,
      initialView: options.initialView ?? 'subscribe',
      initialAccessType: options.initialAccessType ?? 'DIGITAL',
      initialMainTab: options.initialMainTab,
      prefillEmail: options.prefillEmail
    });
  }, []);

  const closeAuthModal = React.useCallback(() => {
    setAuthModalState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  if (!isReady && !allowContentBeforeDataReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white px-8 py-6 rounded-2xl shadow-xl border border-gray-100">
          <p className="text-sm font-bold tracking-widest text-[#800000] uppercase">{t('loading.experience')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SiteNavbar onOpenAuthModal={openAuthModal} />
      {!isAdminPage && <NewsTicker />}
      <main className={`flex-1 ${isAdminPage ? 'bg-gray-50' : 'max-w-7xl mx-auto w-full px-4 py-6 md:py-10'}`}>
        <div className={`flex flex-col lg:flex-row gap-8 ${isAdminPage ? 'max-w-none' : ''}`}>
          <div className="flex-1 overflow-hidden">
            <Suspense fallback={<div className="flex items-center justify-center py-20"><p className="text-sm font-bold tracking-widest text-[#800000] uppercase">{t('loading.experience')}</p></div>}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/news/:id" element={<NewsDetail />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/category/:slug" element={<Category />} />
                <Route path="/magazine" element={<Magazine />} />
                <Route path="/subscribe" element={<Subscribe />} />
                <Route path="/staff-login" element={<StaffLogin />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute requiredRoles={[...STAFF_ROLES]}>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/news/new"
                  element={
                    <ProtectedRoute requiredRoles={[...STAFF_ROLES]}>
                      <ArticleEditor />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/news/edit/:id"
                  element={
                    <ProtectedRoute requiredRoles={[...STAFF_ROLES]}>
                      <ArticleEditor />
                    </ProtectedRoute>
                  }
                />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/verify" element={<Verify />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/advertisers" element={<div className="bg-white p-12 rounded-2xl shadow-xl text-center max-w-4xl mx-auto"><h1 className="text-4xl font-bold serif mb-6 text-[#001f3f]">{t('routes.advertisers.title')}</h1><p className="text-gray-600">{t('routes.advertisers.body')}</p></div>} />
                <Route path="/gallery" element={<div className="bg-white p-8 rounded-xl shadow-xl text-center"><h1 className="text-3xl font-bold serif mb-4">{t('routes.gallery.title')}</h1><p>{t('routes.gallery.body')}</p></div>} />
                <Route path="/ads" element={<AdsPage />} />
                <Route path="/ads/:id" element={<AdDetail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </div>
          {!isAdminPage && <Sidebar />}
        </div>
      </main>
      <SiteFooter />
      <AuthAccessModal {...authModalState} onClose={closeAuthModal} />
    </div>
  );
};

const App: React.FC = () => (
  <ErrorBoundary>
    <TranslationProvider>
      <AppProvider>
        <Router>
          <ToastProvider />
          <AppContent />
        </Router>
      </AppProvider>
    </TranslationProvider>
  </ErrorBoundary>
);

export default App;
