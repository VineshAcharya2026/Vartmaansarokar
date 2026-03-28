
import React from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AppProvider, useApp } from './AppContext';
import { UserRole } from './types';
import Home from './pages/Home';
import Magazine from './pages/Magazine';
import Admin from './pages/Admin';
import NewsDetail from './pages/NewsDetail';
import Category from './pages/Category';
import About from './pages/About';
import Sidebar from './components/Sidebar';
import ChatBot from './components/ChatBot';
import { Menu, X, User, LogOut, ChevronDown, Search, BookOpen, Shield, ShieldCheck } from 'lucide-react';
import { NEWS_CATEGORIES } from './constants';

const Navbar: React.FC = () => {
  const { currentUser, logout, login } = useApp();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isLoginSelectOpen, setIsLoginSelectOpen] = React.useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white shadow-md sticky top-0 z-[100] border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 h-20 md:h-24 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex-shrink-0">
          <Link to="/" className="flex items-center space-x-4 group">
            <div className="relative flex flex-col items-center">
              <img src="/VartmaanSarokar/logo.png" alt="Vartmaan Sarokar Logo" className="w-10 h-10 md:w-12 md:h-12 group-hover:rotate-3 transition-transform" />
            </div>
          </Link>
        </div>

        {/* Main Desktop Menu */}
        <div className="hidden lg:flex flex-1 justify-center px-4">
          <div className="flex items-center space-x-4 xl:space-x-8 text-[12px] xl:text-[13px] font-bold text-[#001f3f] tracking-wide">
            <Link to="/" className={`hover:text-[#800000] transition-colors relative py-2 ${isActive('/') ? 'text-[#800000]' : ''}`}>
              HOME
              {isActive('/') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#800000] rounded-full" />}
            </Link>
            <Link to="/about" className={`hover:text-[#800000] transition-colors relative py-2 ${isActive('/about') ? 'text-[#800000]' : ''}`}>
              ABOUT US
              {isActive('/about') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#800000] rounded-full" />}
            </Link>
            
            <div className="relative group cursor-pointer py-2">
              <span className={`flex items-center space-x-1 hover:text-[#800000] ${location.pathname.includes('/category') ? 'text-[#800000]' : ''}`}>
                ARTICLES <ChevronDown size={14} />
              </span>
              <div className="absolute top-full -left-4 bg-white shadow-2xl rounded-2xl p-4 w-64 border border-gray-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 grid grid-cols-1 gap-1">
                {NEWS_CATEGORIES.map(cat => (
                  <Link 
                    key={cat} 
                    to={`/category/${cat.toLowerCase().replace(' ', '-')}`} 
                    className="px-3 py-2 rounded-lg hover:bg-red-50 hover:text-[#800000] text-gray-600 font-medium transition-all"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/advertisers" className={`hover:text-[#800000] transition-colors relative py-2 ${isActive('/advertisers') ? 'text-[#800000]' : ''}`}>
              ADVERTISERS
              {isActive('/advertisers') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#800000] rounded-full" />}
            </Link>
            <Link to="/gallery" className={`hover:text-[#800000] transition-colors relative py-2 ${isActive('/gallery') ? 'text-[#800000]' : ''}`}>
              MEDIA/GALLERY
              {isActive('/gallery') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#800000] rounded-full" />}
            </Link>
            <Link to="/contact" className={`hover:text-[#800000] transition-colors relative py-2 ${isActive('/contact') ? 'text-[#800000]' : ''}`}>
              CONTACT US
              {isActive('/contact') && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#800000] rounded-full" />}
            </Link>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          <Link 
            to="/magazine" 
            className={`hidden sm:flex items-center space-x-2 px-3 md:px-5 py-2 md:py-2.5 rounded-full font-bold text-[10px] md:text-xs transition-all ${
              isActive('/magazine') 
              ? 'bg-[#001f3f] text-white shadow-md' 
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <BookOpen size={14} className="md:w-4 md:h-4" />
            <span className="hidden xl:inline">DIGITAL MAGAZINE</span>
            <span className="xl:hidden">MAGAZINE</span>
          </Link>

          <button className="p-2 text-gray-400 hover:text-[#001f3f] transition-colors hidden xl:block">
            <Search size={20} />
          </button>
          
          <div className="h-6 w-[1px] bg-gray-200 hidden lg:block" />

          {currentUser ? (
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2 group relative">
                <div className="w-9 h-9 md:w-10 md:h-10 bg-gray-100 rounded-full flex items-center justify-center text-[#001f3f] border-2 border-transparent group-hover:border-[#800000] transition-all overflow-hidden cursor-pointer shadow-sm">
                   <img src={`https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} alt="user" />
                </div>
                <div className="absolute right-0 top-full mt-2 w-56 bg-white shadow-2xl rounded-xl border border-gray-100 p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="px-4 py-3 border-b border-gray-50 mb-1">
                    <p className="text-xs font-bold text-[#001f3f] truncate">{currentUser.name}</p>
                    <span className={`text-[9px] uppercase font-black tracking-widest ${
                      currentUser.role === UserRole.ADMIN ? 'text-purple-600' : 
                      currentUser.role === UserRole.MAGAZINE ? 'text-blue-600' : 'text-gray-400'
                    }`}>
                      {currentUser.role} Account
                    </span>
                  </div>
                  {(currentUser.role === UserRole.ADMIN || currentUser.role === UserRole.MAGAZINE) && (
                    <Link to="/admin" className="flex items-center space-x-2 px-4 py-2 text-sm text-[#800000] hover:bg-red-50 rounded-lg transition-colors font-bold">
                      <ShieldCheck size={16} />
                      <span>Dashboard Panel</span>
                    </Link>
                  )}
                  <button onClick={logout} className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-bold text-left mt-1">
                    <LogOut size={16} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="relative">
              <button 
                onClick={() => setIsLoginSelectOpen(!isLoginSelectOpen)}
                className="bg-[#800000] text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-[10px] md:text-xs font-bold shadow-lg shadow-red-900/20 hover:shadow-red-900/40 hover:bg-red-800 transition-all active:scale-95 flex items-center space-x-1 md:space-x-2 whitespace-nowrap"
              >
                <User size={14} />
                <span>SIGN IN</span>
              </button>
              
              {isLoginSelectOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white shadow-2xl rounded-xl border border-gray-100 p-2 z-[110] animate-in fade-in slide-in-from-top-2">
                  <p className="px-4 py-2 text-[10px] text-gray-400 uppercase font-bold tracking-widest border-b border-gray-50 mb-1">Select Account</p>
                  <button onClick={() => { login('admin@daily.com'); setIsLoginSelectOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-lg font-bold flex items-center space-x-2">
                    <Shield size={14} className="text-purple-600" />
                    <span>Master Admin</span>
                  </button>
                  <button onClick={() => { login('editor@daily.com'); setIsLoginSelectOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-lg font-bold flex items-center space-x-2">
                    <Shield size={14} className="text-blue-600" />
                    <span>Editor Login</span>
                  </button>
                  <button onClick={() => { login('user@daily.com'); setIsLoginSelectOpen(false); }} className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 rounded-lg font-bold flex items-center space-x-2">
                    <User size={14} className="text-gray-400" />
                    <span>Standard User</span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="lg:hidden p-2 text-[#001f3f] hover:bg-gray-50 rounded-lg transition-colors">
            {isMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>
      </div>
      
      {/* Mobile Drawer */}
      <div className={`lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity z-[110] ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`lg:hidden fixed top-0 right-0 h-full w-[280px] bg-white shadow-2xl z-[120] transition-transform duration-300 ease-in-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50">
             <div className="flex flex-col">
                <span className="font-black text-[#000080] text-lg">वर्तमान</span>
                <span className="font-black text-[#800000] text-lg">सरोकार</span>
             </div>
             <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-500 hover:text-red-600">
               <X size={20} />
             </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <nav className="space-y-1">
              {[
                { label: 'HOME', path: '/' },
                { label: 'ABOUT US', path: '/about' },
                { label: 'DIGITAL MAGAZINE', path: '/magazine', special: true },
                { label: 'ADVERTISERS', path: '/advertisers' },
                { label: 'MEDIA/GALLERY', path: '/gallery' },
                { label: 'CONTACT US', path: '/contact' }
              ].map(item => (
                <Link 
                  key={item.label}
                  to={item.path} 
                  onClick={() => setIsMenuOpen(false)} 
                  className={`block py-3 px-4 rounded-xl text-sm font-bold transition-all ${
                    isActive(item.path) 
                    ? (item.special ? 'bg-amber-100 text-amber-800' : 'bg-red-50 text-[#800000]') 
                    : (item.special ? 'text-amber-700 hover:bg-amber-50' : 'text-[#001f3f] hover:bg-gray-50')
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </nav>
  );
};

const Footer: React.FC = () => (
  <footer className="bg-[#001f3f] text-white pt-24 pb-12">
    <div className="max-w-7xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20 text-center md:text-left">
        <div className="space-y-6">
          <Link to="/" className="flex flex-col items-center md:items-start">
            <h2 className="text-3xl font-black text-white leading-none">वर्तमान</h2>
            <h2 className="text-3xl font-black text-red-500 leading-none mt-1">सरोकार</h2>
            <p className="text-[10px] font-bold text-gray-400 tracking-widest mt-4 uppercase">अतीत से सीख कर उज्जवल भविष्य की ओर</p>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm mx-auto md:mx-0">
            Insights, analysis, and stories that go beyond the headlines.
          </p>
        </div>
        
        <div>
          <h3 className="text-lg font-bold mb-8 serif border-l-4 border-[#800000] pl-4 inline-block md:block">Explore</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/about" className="hover:text-white">About Us</Link></li>
            <li><Link to="/magazine" className="hover:text-white">Digital Magazine</Link></li>
            <li><Link to="/gallery" className="hover:text-white">Media Gallery</Link></li>
            <li><Link to="/advertisers" className="hover:text-white">Partner With Us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-8 serif border-l-4 border-[#800000] pl-4 inline-block md:block">Articles</h3>
          <ul className="space-y-4 text-gray-400 text-sm grid grid-cols-1">
            {NEWS_CATEGORIES.slice(0, 5).map(cat => (
              <li key={cat}>
                <Link to={`/category/${cat.toLowerCase().replace(' ', '-')}`} className="hover:text-white">
                  {cat}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-bold mb-8 serif border-l-4 border-[#800000] pl-4 inline-block md:block">Connect</h3>
          <ul className="space-y-4 text-gray-400 text-sm">
            <li><Link to="/contact" className="hover:text-white">Get in Touch</Link></li>
            <li><span className="text-gray-500">Call: +91 98765 43210</span></li>
          </ul>
        </div>
      </div>
      
      <div className="pt-10 border-t border-white/5 text-center">
        <p className="text-gray-500 text-[10px] uppercase tracking-[0.4em] font-bold">
          © 2024 VARTMAAN SAROKAAR. ALL RIGHTS RESERVED.
        </p>
      </div>
    </div>
  </footer>
);

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className={`flex-1 ${isAdminPage ? 'bg-gray-50' : 'max-w-7xl mx-auto w-full px-4 py-6 md:py-12'}`}>
        <div className={`flex flex-col lg:flex-row gap-8 ${isAdminPage ? 'max-w-none' : ''}`}>
          <div className="flex-1 overflow-hidden">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/chat" element={<ChatBot />} />
              <Route path="/news/:id" element={<NewsDetail />} />
              <Route path="/category/:slug" element={<Category />} />
              <Route path="/magazine" element={<Magazine />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-4xl mx-auto"><h1 className="text-4xl font-bold serif mb-6 text-[#001f3f]">Contact Us</h1><p className="text-gray-600">Reach out for collaborations, queries, or story pitches at contact@vartmaansarokaar.in</p></div>} />
              <Route path="/advertisers" element={<div className="bg-white p-12 rounded-3xl shadow-xl text-center max-w-4xl mx-auto"><h1 className="text-4xl font-bold serif mb-6 text-[#001f3f]">Partner with Vartmaan Sarokaar</h1><p className="text-gray-600">Reach an audience of thousands of intellectual readers through our digital portal and high-quality magazine.</p></div>} />
              <Route path="/gallery" element={<div className="bg-white p-8 rounded-2xl shadow-xl text-center"><h1 className="text-3xl font-bold serif mb-4">Media/Gallery</h1><p>Visual storytelling through our photography archive.</p></div>} />
            </Routes>
          </div>
          {!isAdminPage && <Sidebar />}
        </div>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppContent />
      </Router>
    </AppProvider>
  );
};

export default App;
