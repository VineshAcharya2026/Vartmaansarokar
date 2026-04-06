import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import gsap from 'gsap';
import { Menu, X, User, LogOut, ChevronDown, BookOpen, ShieldCheck, ArrowUpRight, Newspaper } from 'lucide-react';
import { useApp } from '../AppContext';
import { UserRole } from '../types';
import { NEWS_CATEGORIES } from '../constants';
import { APP_BASE, buildCategorySlug } from '../utils/app';
import { translateCategory, translateRole } from '../utils/i18n';
import { AuthAccessModalLaunchOptions } from './AuthAccessModal';

interface SiteNavbarProps {
  onOpenAuthModal: (options?: AuthAccessModalLaunchOptions) => void;
}

const SiteNavbar: React.FC<SiteNavbarProps> = ({ onOpenAuthModal }) => {
  const { currentUser, logout, isReady } = useApp();
  const { t } = useTranslation();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isArticlesOpen, setIsArticlesOpen] = React.useState(false);
  const [isAccountOpen, setIsAccountOpen] = React.useState(false);

  const navRootRef = React.useRef<HTMLDivElement | null>(null);
  const navShellRef = React.useRef<HTMLDivElement | null>(null);
  const navLinksRef = React.useRef<HTMLDivElement | null>(null);
  const actionsRef = React.useRef<HTMLDivElement | null>(null);
  const sectionsTriggerRef = React.useRef<HTMLDivElement | null>(null);
  const sectionsPanelRef = React.useRef<HTMLDivElement | null>(null);
  const accountTriggerRef = React.useRef<HTMLDivElement | null>(null);
  const accountPanelRef = React.useRef<HTMLDivElement | null>(null);
  const drawerBackdropRef = React.useRef<HTMLDivElement | null>(null);
  const drawerPanelRef = React.useRef<HTMLDivElement | null>(null);

  const isActive = (path: string) => (path === '/' ? location.pathname === '/' : location.pathname === path);
  const isCategoryActive = location.pathname.startsWith('/category');
  const hasActiveSubscription = currentUser?.subscription?.status === 'ACTIVE';

  const primaryNavItems = [
    { label: t('common.home'), path: '/' },
    { label: t('common.aboutUs'), path: '/about' },
    { label: t('common.advertisers'), path: '/advertisers' },
    { label: t('common.media', { defaultValue: 'Media' }), path: '/gallery' },
    { label: t('common.contactUs'), path: '/contact' }
  ];

  const accountButtonTitle = currentUser
    ? currentUser.name
    : `${t('common.subscribe')} / ${isReady ? t('common.signIn') : t('common.loading')}`;

  const accountButtonLabel = currentUser
    ? hasActiveSubscription
      ? `${t('common.premium')} ${t('common.account', { defaultValue: 'Account' })}`
      : `${translateRole(t, currentUser.role)} ${t('common.account', { defaultValue: 'Account' })}`
    : `${t('common.subscribe')} / ${t('common.signIn')}`;

  // ── GSAP intro animation ──
  React.useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const navLinks = navLinksRef.current ? Array.from(navLinksRef.current.children) : [];
      const actionItems = actionsRef.current ? Array.from(actionsRef.current.children) : [];
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      tl.fromTo(navShellRef.current, { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 });
      if (navLinks.length > 0) tl.fromTo(navLinks, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.06 }, '-=0.45');
      if (actionItems.length > 0) tl.fromTo(actionItems, { y: -14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08 }, '-=0.38');
    }, navRootRef);
    return () => { ctx.revert(); };
  }, []);

  // ── Close everything on route change ──
  React.useEffect(() => {
    setIsMenuOpen(false);
    setIsArticlesOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  // ── Click-outside for desktop dropdowns ──
  React.useEffect(() => {
    if (isMenuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (sectionsTriggerRef.current && !sectionsTriggerRef.current.contains(target)) setIsArticlesOpen(false);
      if (accountTriggerRef.current && !accountTriggerRef.current.contains(target)) setIsAccountOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => { document.removeEventListener('mousedown', handlePointerDown); };
  }, [isMenuOpen]);

  // ── Animate Articles dropdown ──
  React.useEffect(() => {
    if (isArticlesOpen && sectionsPanelRef.current) {
      gsap.fromTo(sectionsPanelRef.current, { y: 16, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' });
    }
  }, [isArticlesOpen]);

  // ── Animate Account dropdown ──
  React.useEffect(() => {
    if (isAccountOpen && !isMenuOpen && accountPanelRef.current) {
      gsap.fromTo(accountPanelRef.current, { y: 16, opacity: 0, scale: 0.96 }, { y: 0, opacity: 1, scale: 1, duration: 0.22, ease: 'power2.out' });
    }
  }, [isAccountOpen, isMenuOpen]);

  // ── Mobile drawer animation ──
  React.useEffect(() => {
    if (!drawerBackdropRef.current || !drawerPanelRef.current) return;
    if (isMenuOpen) {
      gsap.set(drawerBackdropRef.current, { pointerEvents: 'auto' });
      gsap.to(drawerBackdropRef.current, { autoAlpha: 1, duration: 0.2, ease: 'power2.out' });
      gsap.to(drawerPanelRef.current, { xPercent: 0, duration: 0.42, ease: 'power3.out' });
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
    gsap.to(drawerBackdropRef.current, {
      autoAlpha: 0, duration: 0.2, ease: 'power2.inOut',
      onComplete: () => { if (drawerBackdropRef.current) gsap.set(drawerBackdropRef.current, { pointerEvents: 'none' }); }
    });
    gsap.to(drawerPanelRef.current, { xPercent: 100, duration: 0.34, ease: 'power3.inOut' });
    document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isMenuOpen]);

  const handleAccountClick = () => {
    if (currentUser) {
      setIsAccountOpen((o) => !o);
      setIsArticlesOpen(false);
    } else {
      onOpenAuthModal({ initialView: 'login', initialAccessType: 'DIGITAL' });
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-[130] w-full bg-white/95 shadow-[0_4px_20px_-6px_rgba(0,31,63,0.25)] backdrop-blur-md">
        {/* Brand accent strip */}
        <div className="h-1 w-full bg-gradient-to-r from-[#800000] via-[#a11f2d] to-[#001f3f]" />
        <div ref={navRootRef} className="w-full">
          <div ref={navShellRef} className="relative flex flex-nowrap items-center gap-4 px-4 py-2.5 sm:px-5 md:gap-5 md:px-6 md:py-3">

            {/* ── Logo ── */}
            <Link to="/" className="group flex shrink-0 items-center" data-brand>
              <img src={`${APP_BASE}logo.png`} alt="Vartmaan Sarokar" className="h-14 w-14 object-contain transition-transform duration-500 group-hover:scale-105 md:h-[72px] md:w-[72px]" />
            </Link>

            {/* ── Desktop Navigation ── */}
            <div className="hidden xl:flex min-w-0 flex-1 justify-center px-3">
              <div ref={navLinksRef} className="flex min-w-0 flex-nowrap items-center gap-0.5 whitespace-nowrap bg-[#001f3f]/[0.03] border border-[#001f3f]/8 p-1">
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3.5 py-2.5 text-[13px] font-semibold transition-all ${
                      isActive(item.path)
                        ? 'bg-[#001f3f] text-white'
                        : 'text-[#001f3f]/70 hover:bg-[#001f3f]/10 hover:text-[#001f3f]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}

                {/* Articles dropdown trigger — prominent with brand accent */}
                <div ref={sectionsTriggerRef} className="relative">
                  <button
                    type="button"
                    onClick={() => { setIsArticlesOpen((o) => !o); setIsAccountOpen(false); }}
                    className={`inline-flex items-center gap-2 px-3.5 py-2.5 text-[13px] font-bold transition-all ${
                      isCategoryActive || isArticlesOpen
                        ? 'bg-[#800000] text-white'
                        : 'text-[#800000] hover:bg-[#800000]/10'
                    }`}
                    aria-expanded={isArticlesOpen}
                  >
                    <Newspaper size={15} />
                    <span>{t('common.articles')}</span>
                    <ChevronDown size={15} className={`transition-transform duration-300 ${isArticlesOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isArticlesOpen && (
                    <div ref={sectionsPanelRef} className="absolute left-1/2 top-[calc(100%+12px)] z-[150] w-[340px] -translate-x-1/2 border border-gray-200 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(0,31,63,0.4)]">
                      <div className="mb-2 bg-gradient-to-r from-[#800000] to-[#001f3f] px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/80">{t('common.articles')}</p>
                        <p className="mt-1 text-sm text-white/60">{t('footer.tagline')}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-0.5">
                        {NEWS_CATEGORIES.map((cat) => (
                          <Link
                            key={cat}
                            to={`/category/${buildCategorySlug(cat)}`}
                            className="px-3 py-2.5 text-sm font-semibold text-[#001f3f]/80 transition-all hover:bg-[#800000] hover:text-white"
                          >
                            {translateCategory(t, cat)}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div ref={actionsRef} className="ml-auto flex shrink-0 items-center gap-2 xl:gap-2.5">

              {/* Magazine button — desktop */}
              <Link
                to="/magazine"
                className={`hidden items-center gap-2.5 border px-4 py-2.5 transition-all duration-300 md:flex ${
                  isActive('/magazine')
                    ? 'border-[#001f3f] bg-[#001f3f] text-white'
                    : 'border-[#001f3f] bg-[#001f3f] text-white hover:bg-[#001f3f]/90'
                }`}
              >
                <BookOpen size={18} />
                <span className="text-sm font-bold">{t('common.digitalMagazine')}</span>
                <ArrowUpRight size={14} className="shrink-0 opacity-60" />
              </Link>

              {/* Account / Subscribe button — desktop */}
              <div ref={accountTriggerRef} className="relative hidden sm:block">
                <button
                  disabled={!isReady && !currentUser}
                  onClick={handleAccountClick}
                  className="flex items-center gap-2.5 border border-[#800000] bg-[#800000] px-4 py-2.5 text-left text-white transition-all duration-300 hover:bg-[#800000]/90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <User size={18} />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/70">{accountButtonLabel}</span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-white">
                      <span className="truncate">{accountButtonTitle}</span>
                      {currentUser && <ChevronDown size={14} className={`shrink-0 transition-transform duration-300 ${isAccountOpen ? 'rotate-180' : ''}`} />}
                    </span>
                  </span>
                </button>

                {isAccountOpen && currentUser && (
                  <div ref={accountPanelRef} className="absolute right-0 top-[calc(100%+8px)] z-[150] w-[280px] border border-gray-200 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(0,31,63,0.4)]">
                    <div className="mb-2 bg-gradient-to-r from-[#001f3f] to-[#800000] p-4">
                      <p className="text-[10px] font-black uppercase tracking-[0.34em] text-white/70">{hasActiveSubscription ? t('common.premium') : translateRole(t, currentUser.role)}</p>
                      <p className="mt-2 truncate text-lg font-bold text-white">{currentUser.name}</p>
                      <p className="mt-1 text-sm text-white/60">{currentUser.email}</p>
                    </div>

                    {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MAGAZINE || currentUser.role === UserRole.SUPER_ADMIN) && (
                      <Link
                        to="/admin"
                        className="flex items-center justify-between px-4 py-3 text-sm font-semibold text-[#001f3f] transition-all hover:bg-[#001f3f] hover:text-white"
                      >
                        <span className="flex items-center gap-3">
                          <ShieldCheck size={18} />
                          <span>{t('common.dashboardPanel')}</span>
                        </span>
                        <ArrowUpRight size={16} />
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="mt-0.5 flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold text-[#800000] transition-all hover:bg-red-50"
                    >
                      <span className="flex items-center gap-3">
                        <LogOut size={18} />
                        <span>{t('common.signOut')}</span>
                      </span>
                      <ArrowUpRight size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Magazine icon — mobile only */}
              <Link
                to="/magazine"
                className={`flex h-10 w-10 items-center justify-center border text-[#001f3f] transition-all md:hidden ${
                  isActive('/magazine')
                    ? 'border-[#001f3f] bg-[#001f3f] text-white'
                    : 'border-[#001f3f]/20 bg-white hover:bg-[#001f3f] hover:text-white'
                }`}
                aria-label={t('common.digitalMagazine')}
              >
                <BookOpen size={18} />
              </Link>

              {/* Hamburger — mobile only */}
              <button
                onClick={() => setIsMenuOpen((o) => !o)}
                className="flex h-10 w-10 items-center justify-center border border-[#001f3f]/20 bg-white text-[#001f3f] transition-all hover:bg-[#001f3f] hover:text-white xl:hidden"
                aria-label="Toggle menu"
              >
                {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer Backdrop ── */}
      <div ref={drawerBackdropRef} className="pointer-events-none fixed inset-0 z-[140] bg-[#001f3f]/45 opacity-0 backdrop-blur-sm xl:hidden" onClick={() => setIsMenuOpen(false)} />

      {/* ── Mobile Drawer Panel ── */}
      <div ref={drawerPanelRef} className="fixed right-0 top-0 z-[150] flex h-full w-[min(92vw,360px)] translate-x-full flex-col overflow-hidden border-l border-white/20 bg-[#f7f2eb]/95 shadow-[0_0_60px_rgba(0,31,63,0.32)] backdrop-blur-xl xl:hidden">
        <div className="flex items-start justify-between border-b border-[#001f3f]/10 px-5 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#800000]">{t('common.digitalLibrary')}</p>
            <div className="mt-2 flex flex-col leading-none">
              <span className="text-lg font-black uppercase tracking-[0.22em] text-[#001f3f]">{t('brand.lineOne')}</span>
              <span className="text-base font-black uppercase tracking-[0.32em] text-[#800000]">{t('brand.lineTwo')}</span>
            </div>
          </div>
          <button onClick={() => setIsMenuOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-[#001f3f]/10 bg-white text-[#001f3f] shadow-sm transition-colors hover:bg-[#001f3f] hover:text-white" aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Drawer: Magazine + Account cards */}
          <div className="grid gap-3">
            <Link
              to="/magazine"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#0a274d_0%,#001f3f_55%,#16355a_100%)] px-4 py-4 text-white shadow-[0_20px_40px_-26px_rgba(0,31,63,0.7)]"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/12">
                <BookOpen size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.32em] text-white/65">E-Magazine</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="truncate">{t('common.readMagazine')}</span>
                  <ArrowUpRight size={16} className="shrink-0" />
                </span>
              </span>
            </Link>

            <button
              disabled={!isReady && !currentUser}
              onClick={() => {
                if (currentUser) {
                  setIsAccountOpen((o) => !o);
                } else {
                  setIsMenuOpen(false);
                  onOpenAuthModal({ initialView: 'login', initialAccessType: 'DIGITAL' });
                }
              }}
              className="flex items-center gap-3 rounded-[24px] bg-[linear-gradient(135deg,#a11f2d_0%,#800000_48%,#661010_100%)] px-4 py-4 text-left text-white shadow-[0_20px_40px_-26px_rgba(128,0,0,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-white/12">
                <User size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-black uppercase tracking-[0.32em] text-white/65">{accountButtonLabel}</span>
                <span className="flex items-center gap-2 text-sm font-semibold text-white">
                  <span className="truncate">{accountButtonTitle}</span>
                  {currentUser && <ChevronDown size={16} className={`shrink-0 transition-transform duration-300 ${isAccountOpen ? 'rotate-180' : ''}`} />}
                </span>
              </span>
            </button>
          </div>

          {/* Drawer: Account panel (logged in) */}
          {isAccountOpen && currentUser && (
            <div className="mt-4 rounded-[28px] border border-[#001f3f]/10 bg-white/80 p-3 shadow-[0_20px_30px_-26px_rgba(0,31,63,0.45)]">
              <div className="mb-3 rounded-[20px] bg-[#f7f2eb] p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#800000]">{hasActiveSubscription ? t('common.premium') : translateRole(t, currentUser.role)}</p>
                <p className="mt-2 text-lg font-bold text-[#001f3f]">{currentUser.name}</p>
                <p className="mt-1 text-sm text-[#001f3f]/65">{currentUser.email}</p>
              </div>
              {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MAGAZINE || currentUser.role === UserRole.SUPER_ADMIN) && (
                <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-between rounded-[18px] px-4 py-3 text-sm font-semibold text-[#001f3f] transition-all hover:bg-[#001f3f] hover:text-white">
                  <span className="flex items-center gap-3"><ShieldCheck size={18} /><span>{t('common.dashboardPanel')}</span></span>
                  <ArrowUpRight size={16} />
                </Link>
              )}
              <button onClick={() => { logout(); setIsMenuOpen(false); }} className="mt-1 flex w-full items-center justify-between rounded-[18px] px-4 py-3 text-left text-sm font-semibold text-[#800000] transition-all hover:bg-red-50">
                <span className="flex items-center gap-3"><LogOut size={18} /><span>{t('common.signOut')}</span></span>
                <ArrowUpRight size={16} />
              </button>
            </div>
          )}

          {/* Drawer: Primary nav links */}
          <nav className="mt-8 space-y-2">
            {primaryNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center justify-between rounded-[20px] px-4 py-4 text-sm font-semibold transition-all ${
                  isActive(item.path)
                    ? 'bg-[#001f3f] text-white shadow-[0_16px_30px_-24px_rgba(0,31,63,0.6)]'
                    : 'bg-white/65 text-[#001f3f] hover:bg-white'
                }`}
              >
                <span>{item.label}</span>
                <ArrowUpRight size={16} className="shrink-0" />
              </Link>
            ))}
          </nav>

          {/* Drawer: Article categories */}
          <div className="mt-8 rounded-[28px] border border-[#001f3f]/10 bg-white/70 p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-[#800000]">{t('common.articles')}</p>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {NEWS_CATEGORIES.map((cat) => (
                <Link
                  key={cat}
                  to={`/category/${buildCategorySlug(cat)}`}
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-[18px] px-4 py-3 text-sm font-semibold text-[#001f3f]/78 transition-all hover:bg-[#001f3f] hover:text-white"
                >
                  {translateCategory(t, cat)}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SiteNavbar;
