import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, BookOpen, Search, Mail, User, LogOut } from 'lucide-react';
import { useApp } from '../AppContext';
import { UserRole } from '../types';
import { APP_BASE } from '../utils/app';
import { AuthAccessModalLaunchOptions } from './AuthAccessModal';
import LanguageSwitcher from './LanguageSwitcher';
import DashboardToggle from './DashboardToggle';

interface SiteNavbarProps {
  onOpenAuthModal: (options?: AuthAccessModalLaunchOptions) => void;
}

// Brand Colors Only:
// Maroon: #800000
// Deep/Ink: #1A1A2E, #0F0F1A
// Cream: #FAF7F2
// Gold: #C9952A
// Border: #E2DDD6

const navStyles = `
  .navbar-wrapper {
    position: sticky;
    top: 0;
    z-index: 110;
  }
  .top-strip {
    background: #0F0F1A;
    color: #aaa;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 6px 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .top-strip span { color: #800000; font-weight: 600; }
  .top-strip-right { display: flex; gap: 20px; }
  .top-strip-right a {
    color: #aaa;
    text-decoration: none;
    transition: color 0.2s;
  }
  .top-strip-right a:hover { color: #800000; }

  header {
    background: #FAF7F2;
    border-bottom: 1px solid #E2DDD6;
    box-shadow: 0 2px 20px rgba(0,0,0,0.06);
    position: relative;
    z-index: 100;
  }

  .desktop-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 14px 40px;
    gap: 20px;
  }

  .desktop-header .left-section {
    display: flex;
    align-items: center;
    flex-shrink: 0;
  }

  .desktop-header .center-section {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-grow: 1;
  }

  .desktop-header .right-section {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-shrink: 0;
  }

  .logo-img {
    height: 48px;
    width: auto;
    object-fit: contain;
  }

  nav { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; justify-content: center; }

  nav a {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 700;
    color: #1e293b;
    text-decoration: none;
    padding: 10px 14px;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    position: relative;
    transition: color 0.2s ease;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  nav a::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 14px;
    right: 14px;
    height: 2px;
    background: #800000;
    transform: scaleX(0);
    transition: transform 0.25s ease;
  }

  nav a:hover { color: #800000; }
  nav a:hover::after { transform: scaleX(1); }

  nav a.active {
    color: #800000;
    font-weight: 700;
  }
  nav a.active::after { transform: scaleX(1); }

  .nav-divider {
    width: 1px;
    height: 14px;
    background: #E2DDD6;
    margin: 0 4px;
  }

  .search-btn {
    background: none;
    border: none;
    cursor: pointer;
    color: #1A1A2E;
    font-size: 16px;
    display: flex;
    align-items: center;
    padding: 4px;
    transition: color 0.2s;
  }
  .search-btn:hover { color: #800000; }

  .btn-combined {
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    border-radius: 4px;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    border: none;
    cursor: pointer;
  }

  .btn-combined .part-subscribe {
    background: #800000;
    color: #fff;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: background 0.2s ease;
    text-decoration: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;
  }
  .btn-combined .part-subscribe:hover { background: #600000; }

  .btn-combined .divider-line {
    width: 1px;
    height: 100%;
    background: rgba(255,255,255,0.3);
    align-self: stretch;
  }

  .btn-combined .part-signin {
    background: transparent;
    color: #800000;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.03em;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    text-decoration: none;
    border: 1px solid #800000;
    border-radius: 8px;
    cursor: pointer;
  }
  .btn-combined .part-signin:hover { background: #800000; color: #fff; }

  /* Desktop Header shown > 1024px */
  @media (max-width: 1024px) {
    .desktop-header { display: none; }
    .top-strip { display: none; }
  }

  .mobile-menu {
    position: fixed;
    top: 0;
    right: 0;
    width: 300px;
    height: 100vh;
    background: #FAF7F2;
    z-index: 200;
    padding: 20px;
    box-shadow: -2px 0 20px rgba(0,0,0,0.1);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  }
  .mobile-menu.open { transform: translateX(0); }

  .mobile-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100vh;
    background: rgba(0,0,0,0.5);
    z-index: 199;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
  }
  .mobile-overlay.open { opacity: 1; visibility: visible; }
`;

const SiteNavbar: React.FC<SiteNavbarProps> = ({ onOpenAuthModal }) => {
  const { currentUser, logout, isReady } = useApp();
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    const date = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    setCurrentDate(date);
  }, []);

  const isActive = (path: string) => location.pathname === path;

  const primaryNavItems = [
    { label: t('common.home'), path: '/' },
    { label: t('common.aboutUs'), path: '/about' },
    { label: t('common.advertisers'), path: '/advertisers' },
    { label: t('common.media', { defaultValue: 'Media' }), path: '/gallery' },
    { label: t('common.contactUs'), path: '/contact' }
  ];

  const handleSubscribe = () => {
    onOpenAuthModal({ initialView: 'subscribe', initialAccessType: 'DIGITAL', initialMainTab: 'membership' });
  };

  const handleSignIn = () => {
    if (currentUser) {
      navigate('/profile');
    } else {
      onOpenAuthModal({ initialView: 'login', initialAccessType: 'DIGITAL', initialMainTab: 'signin' });
    }
  };

  return (
    <>
      <style>{navStyles}</style>
      
      {/* STICKY NAVBAR WRAPPER */}
      <div className="navbar-wrapper">
        {/* TOP STRIP */}
        <div className="top-strip">
          <div>
            <span>{currentDate}</span> &nbsp;·&nbsp; {t('navbar.currentConcerns')}
          </div>
          <div className="top-strip-right">
            <a href="#">{t('navbar.hindi')}</a>
            <a href="#">{t('navbar.english')}</a>
            <a href="#">{t('navbar.newsletter')}</a>
            <a href="#">{t('navbar.advertise')}</a>
          </div>
        </div>

        {/* MAIN HEADER */}
        <header>
          {/* DESKTOP HEADER (> 1024px) */}
          <div className="desktop-header">
            <div className="left-section">
              <Link to="/" className="w-full h-full block">
                <img src={`${APP_BASE}logo.png`} alt="वर्तमान सरोकार" className="logo-img" />
              </Link>
            </div>

            <div className="center-section">
              <nav>
                {primaryNavItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={isActive(item.path) ? 'active' : ''}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="nav-divider"></div>
                {/* Articles - Brand Maroon */}
                <Link to="/articles" style={{
                  color: '#fff',
                  background: '#800000',
                  marginLeft: '4px',
                  borderRadius: '3px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>
                  Articles
                </Link>
                {/* Magazine - Brand Dark */}
                <Link to="/magazine" style={{
                  color: '#fff',
                  background: '#1A1A2E',
                  marginLeft: '6px',
                  borderRadius: '3px',
                  padding: '8px 16px',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  fontSize: '12px',
                  textTransform: 'uppercase'
                }}>
                  <BookOpen size={13} style={{ marginRight: '6px' }} />
                  Magazine
                </Link>
              </nav>
            </div>

            <div className="right-section">
              <div className="btn-combined">
                <button onClick={handleSubscribe} className="part-subscribe">
                  <Mail size={13} />
                  Subscribe
                </button>
                <div className="divider-line"></div>
                <button onClick={handleSignIn} className="part-signin">
                  <User size={13} />
                  {currentUser ? currentUser.name : t('navbar.signIn')}
                </button>
              </div>
              
              {currentUser && (
                <button 
                  onClick={() => logout()}
                  className="p-2 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200"
                  title="Logout"
                  aria-label="Logout"
                >
                  <LogOut size={18} />
                </button>
              )}

              <DashboardToggle />
              <LanguageSwitcher />
              <button className="search-btn" aria-label="Search">
                <Search size={16} />
              </button>
            </div>
          </div>

          {/* MOBILE HEADER (<= 1024px) */}
          <div className="flex items-center justify-between h-14 px-4 lg:hidden">
            <Link to="/">
              <img src={`${APP_BASE}logo.png`} alt="Logo" className="h-8 object-contain" />
            </Link>

            <button 
              onClick={() => setIsMenuOpen(true)} 
              className="text-[#1A1A2E] p-1"
              aria-label="Menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </header>
      </div>

      {/* MOBILE OVERLAY */}
      <div 
        className={`mobile-overlay ${isMenuOpen ? 'open' : ''}`}
        onClick={() => setIsMenuOpen(false)}
      />

      {/* MOBILE MENU */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div className="logo-hindi" style={{ color: '#800000', fontWeight: 700 }}>वर्तमान सरोकार</div>
          <button 
            onClick={() => setIsMenuOpen(false)}
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {primaryNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMenuOpen(false)}
              style={{
                padding: '12px 16px',
                textDecoration: 'none',
                color: isActive(item.path) ? '#800000' : '#1A1A2E',
                fontWeight: isActive(item.path) ? 600 : 500,
                borderRadius: '4px',
                background: isActive(item.path) ? '#fff' : 'transparent',
                border: isActive(item.path) ? '1px solid #E2DDD6' : 'none'
              }}
            >
              {item.label}
            </Link>
          ))}
          
          {/* Mobile Magazine - Brand Dark */}
          <Link 
            to="/magazine" 
            onClick={() => setIsMenuOpen(false)}
            style={{
              padding: '12px 16px',
              textDecoration: 'none',
              color: '#fff',
              background: '#1A1A2E',
              borderRadius: '4px',
              marginTop: '10px',
              fontWeight: 600
            }}
          >
            Magazine
          </Link>

          {/* Mobile Admin - Brand Saffron */}
          {currentUser && [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser.role) && (
            <Link 
              to="/admin" 
              onClick={() => setIsMenuOpen(false)}
              style={{
                padding: '12px 16px',
                textDecoration: 'none',
                color: '#fff',
                background: '#800000',
                borderRadius: '4px',
                marginTop: '10px',
                fontWeight: 600
              }}
            >
              {t('navbar.adminDashboard')}
            </Link>
          )}

          {currentUser && (
            <button
              onClick={() => { logout(); setIsMenuOpen(false); }}
              style={{
                padding: '12px 16px',
                textDecoration: 'none',
                color: '#800000',
                background: '#fff',
                border: '1px solid #800000',
                borderRadius: '4px',
                marginTop: '20px',
                cursor: 'pointer',
                textAlign: 'left',
                fontWeight: 600
              }}
            >
              {t('navbar.signOut')}
            </button>
          )}
        </nav>
      </div>
    </>
  );
};

export default SiteNavbar;
