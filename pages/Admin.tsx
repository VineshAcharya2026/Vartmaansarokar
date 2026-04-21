import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Book, 
  FileText, 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  X, 
  Clock, 
  ChevronRight, 
  FolderOpen, 
  Users,
  ImageIcon,
  Eye,
  ExternalLink,
  Edit2,
  Megaphone,
  Layout,
  Upload,
  Copy,
  AlertCircle,
  RefreshCw,
  EyeOff,
  ArrowLeft,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../AppContext';
import { UserRole, ContentStatus, NewsItem, MagazineItem, AdItem, MediaItem } from '../types';
import { formatCurrencyINR, resolveAssetUrl } from '../utils/app';
import { translateRole } from '../utils/i18n';
import toast from 'react-hot-toast';
import styled from 'styled-components';
import api from '../lib/api';

const StyledAdminNav = styled.aside`
  .radio-inputs-vertical {
    position: relative;
    display: flex;
    flex-direction: column;
    border-radius: 12px;
    background-color: transparent;
    width: 100%;
    user-select: none;
  }

  .radio-inputs-vertical .radio-vertical {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .radio-inputs-vertical .radio-vertical input {
    display: none;
  }

  .radio-inputs-vertical .radio-vertical .name {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 12px;
    cursor: pointer;
    width: 100%;
    padding: 12px 16px;
    color: #94a3b8;
    transition: all 0.3s ease;
    font-size: 14px;
    font-weight: 600;
  }

  .radio-inputs-vertical .radio-vertical input:checked + .name {
    background-color: #1e293b;
    color: #ffffff;
    border-radius: 12px;
  }
`;

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, magazines, news, ads, users,
    heroData, siteSettings,
    fetchNews, addNews, updateNews, deleteNews, approveNews, rejectNews, reworkNews,
    fetchMagazines, addMagazine, deleteMagazine,
    fetchUsers, approveUser, rejectUser, deleteUser,
    fetchAdminAds, createAd, updateAd, deleteAd,
    updateHero, updateSettings
  } = useApp();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminAdsLoading, setIsAdminAdsLoading] = useState(false);
  const [adminAds, setAdminAds] = useState<AdItem[]>([]);
  
  // New States for modules
  const [tickerItems, setTickerItems] = useState<any[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const isMaster = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    if (activeTab === 'ads') loadAdminAds();
    if (activeTab === 'ticker') loadTicker();
    if (activeTab === 'media') loadMedia();
  }, [activeTab]);

  const loadAdminAds = async () => {
    setIsAdminAdsLoading(true);
    try {
      const data = await fetchAdminAds();
      setAdminAds(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdminAdsLoading(false);
    }
  };

  const loadTicker = async () => {
    try {
      const { data } = await api.get('/api/ticker');
      setTickerItems((data as { items?: typeof tickerItems }).items ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  const loadMedia = async () => {
    try {
      const { data } = await api.get('/api/media');
      setMediaItems((data as { media?: typeof mediaItems }).media ?? []);
    } catch (e) {
      console.error(e);
    }
  };

  // Ad Form State
  const [isAddingAd, setIsAddingAd] = useState(false);
  const [editingAdId, setEditingAdId] = useState<string | null>(null);
  const [adForm, setAdForm] = useState({ title: '', description: '', image: '', redirect_url: '', status: 'ACTIVE' });

  const resetAdForm = () => {
    setAdForm({ title: '', description: '', image: '', redirect_url: '', status: 'ACTIVE' });
    setIsAddingAd(false);
    setEditingAdId(null);
  };

  const handleAdSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adForm.title) { toast.error('Ad title is required'); return; }
    try {
      if (editingAdId) {
        await updateAd(editingAdId, adForm);
      } else {
        await createAd(adForm);
      }
      resetAdForm();
      loadAdminAds();
    } catch (err) {
      toast.error('Failed to save ad');
    }
  };

  const handleEditAd = (ad: AdItem) => {
    setAdForm({
      title: ad.title || '',
      description: ad.description || '',
      image: ad.image || ad.imageUrl || '',
      redirect_url: ad.redirect_url || ad.link || '',
      status: ad.status || 'ACTIVE'
    });
    setEditingAdId(ad.id);
    setIsAddingAd(true);
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('Delete this ad?')) return;
    await deleteAd(id);
    loadAdminAds();
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Articles', count: news.length, color: 'blue', icon: FileText },
          { label: 'Issues', count: magazines.length, color: 'red', icon: Book },
          { label: 'Members', count: users.length, color: 'green', icon: Users },
          { label: 'Live Ads', count: ads.length, color: 'amber', icon: ImageIcon },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[24px] shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color === 'blue' ? '[#001f3f]' : stat.color === 'red' ? '[#800000]' : stat.color + '-600'} rounded-2xl flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-2xl font-black text-[#001f3f]">{stat.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="bg-[#001f3f] text-white p-10 rounded-[32px] shadow-2xl relative overflow-hidden">
         <div className="relative z-10 max-w-xl">
            <h2 className="text-3xl font-black serif mb-4 underline decoration-[#800000] decoration-4">Master Dashboard</h2>
            <p className="text-white/70 leading-relaxed font-medium">Manage your digital publication's users, content, and revenue from one central interface. Ensure all subscription requests are reviewed promptly.</p>
         </div>
         <div className="absolute top-0 right-0 p-10 opacity-10">
            <LayoutDashboard size={180} />
         </div>
      </div>
    </div>
  );

  const renderNews = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">News Editor</h2>
        <button 
          onClick={() => navigate('/admin/news/new')} // Assuming routing exists
          className="bg-[#800000] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-red-900 transition-all shadow-lg"
        >
          <Plus size={20} /> Write Article
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Title</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Category</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {news.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#0f172a] text-sm truncate max-w-xs">{item.title}</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{item.author}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${
                    item.status === 'PUBLISHED' ? 'bg-green-100 text-green-700' : 
                    item.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    {isMaster && item.status === 'PENDING_REVIEW' && (
                      <button onClick={() => approveNews(item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"><Check size={18}/></button>
                    )}
                    <button 
                      onClick={() => navigate(`/admin/news/edit/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button onClick={() => deleteNews(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const [isAddingMag, setIsAddingMag] = useState(false);
  const [magForm, setMagForm] = useState({
    title: '',
    issueNumber: '',
    date: new Date().toISOString().split('T')[0],
    coverImage: '',
    pdfUrl: '',
    gatedPage: 2,
    pricePhysical: 499,
    priceDigital: 0,
    blurPaywall: true
  });
  const [magError, setMagError] = useState('');
  const [magLoading, setMagLoading] = useState(false);

  const handleMagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMagError('');
    
    // Validation
    if (!magForm.title.trim()) {
      setMagError('Please enter an issue title');
      return;
    }
    if (!magForm.issueNumber.trim()) {
      setMagError('Please enter an issue number');
      return;
    }
    if (!magForm.coverImage.trim()) {
      setMagError('Please provide a cover image URL');
      return;
    }
    if (!magForm.pdfUrl.trim()) {
      setMagError('Please provide a PDF URL');
      return;
    }
    if (magForm.pricePhysical < 0) {
      setMagError('Price cannot be negative');
      return;
    }

    try {
      setMagLoading(true);
      await addMagazine(magForm);
      setIsAddingMag(false);
      setMagForm({ 
        title: '', 
        issueNumber: '', 
        date: new Date().toISOString().split('T')[0], 
        coverImage: '', 
        pdfUrl: '', 
        gatedPage: 2, 
        pricePhysical: 499,
        priceDigital: 0,
        blurPaywall: true 
      });
    } catch (err: any) {
      setMagError(err.message || 'Failed to create magazine. Please try again.');
    } finally {
      setMagLoading(false);
    }
  };

  const renderMagazines = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Magazines</h2>
        <button 
          onClick={() => setIsAddingMag(!isAddingMag)}
          className="bg-[#001f3f] text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg"
        >
          {isAddingMag ? <ArrowLeft size={20}/> : <Plus size={20}/>}
          {isAddingMag ? 'Back to Library' : 'Add New Issue'}
        </button>
      </div>

      {isAddingMag ? (
        <form onSubmit={handleMagSubmit} className="max-w-4xl bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
          {magError && (
            <div className="md:col-span-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm font-medium flex items-start gap-3">
              <AlertCircle size={20} className="flex-shrink-0 mt-0.5"/>
              {magError}
            </div>
          )}
           <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Issue Title *</label>
                <input value={magForm.title} onChange={e => setMagForm({...magForm, title: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 font-bold" placeholder="e.g. October 2024 Special" disabled={magLoading} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Issue # *</label>
                  <input value={magForm.issueNumber} onChange={e => setMagForm({...magForm, issueNumber: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 font-bold" placeholder="e.g. VOL 42" disabled={magLoading} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Publish Date</label>
                  <input type="date" value={magForm.date} onChange={e => setMagForm({...magForm, date: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 font-bold text-sm" disabled={magLoading} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Cover Image (URL) *</label>
                <input value={magForm.coverImage} onChange={e => setMagForm({...magForm, coverImage: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0" placeholder="https://example.com/cover.jpg" disabled={magLoading} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">PDF URL *</label>
                <input value={magForm.pdfUrl} onChange={e => setMagForm({...magForm, pdfUrl: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0" placeholder="https://example.com/magazine.pdf" disabled={magLoading} />
              </div>
           </div>
           
           <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1 text-red-600">Gated Page #</label>
                  <input type="number" min="0" value={magForm.gatedPage} onChange={e => setMagForm({...magForm, gatedPage: parseInt(e.target.value)})} className="w-full bg-red-50/50 p-4 rounded-xl border-transparent focus:ring-0 font-bold" disabled={magLoading} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Print Price (₹)</label>
                  <input type="number" min="0" value={magForm.pricePhysical} onChange={e => setMagForm({...magForm, pricePhysical: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 font-bold" disabled={magLoading} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Digital Price (₹)</label>
                <input type="number" min="0" value={magForm.priceDigital} onChange={e => setMagForm({...magForm, priceDigital: parseInt(e.target.value) || 0})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 font-bold" disabled={magLoading} />
              </div>
              
              <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between">
                <div>
                   <h4 className="text-sm font-bold text-[#001f3f]">Blur Paywall</h4>
                   <p className="text-[10px] text-gray-400 font-medium">Blurs gated pages instead of blocking</p>
                </div>
                <input type="checkbox" checked={magForm.blurPaywall} onChange={e => setMagForm({...magForm, blurPaywall: e.target.checked})} className="w-6 h-6 rounded text-[#800000] focus:ring-0" disabled={magLoading} />
              </div>

              <div className="pt-6">
                <button type="submit" disabled={magLoading} className="w-full bg-[#800000] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-red-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {magLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      Creating...
                    </>
                  ) : (
                    'Create Magazine Issue'
                  )}
                </button>
              </div>
           </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {magazines.map(mag => (
            <div key={mag.id} className="bg-white rounded-[24px] border border-gray-100 p-5 shadow-sm group hover:shadow-xl transition-all">
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-4 bg-gray-50 shadow-inner">
                <img src={resolveAssetUrl(mag.coverImage)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur shadow px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-[#800000]">
                  #{mag.issueNumber}
                </div>
                {mag.gatedPage > 0 && (
                  <div className="absolute bottom-4 left-4 bg-[#001f3f] text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5">
                    <ShieldCheck size={12}/> GATED @ PAGE {mag.gatedPage}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-[#0f172a] line-clamp-1">{mag.title}</h3>
              <div className="flex justify-between items-center mt-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mag.date}</div>
                <div className="flex gap-1">
                  <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                  <button onClick={() => deleteMagazine(mag.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                </div>
              </div>
            </div>
          ))}
          {magazines.length === 0 && (
            <div className="col-span-full p-20 bg-gray-50 rounded-[32px] text-center">
              <Book size={48} className="mx-auto text-gray-200 mb-4" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Issues In Library</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderTicker = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">News Ticker</h2>
        <button 
          onClick={async () => {
            const text = prompt('Ticker Message?');
            if (text) {
              await api.post('/api/ticker', { text });
              loadTicker();
            }
          }}
          className="bg-green-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg"
        >
          <Plus size={20} /> Add Ticker
        </button>
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {tickerItems.map(item => (
            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium text-[#0f172a]">{item.text}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={async () => {
                    await api.put(`/api/ticker/${item.id}`, { active: !item.active });
                    loadTicker();
                  }}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                >
                  {item.active ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
                <button 
                  onClick={async () => {
                    await api.delete(`/api/ticker/${item.id}`);
                    loadTicker();
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 size={18}/>
                </button>
              </div>
            </div>
          ))}
          {tickerItems.length === 0 && (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No Ticker Items</div>
          )}
        </div>
      </div>
    </div>
  );

  const renderMedia = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Media Library</h2>
        <label className="bg-[#001f3f] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg cursor-pointer">
          <Upload size={20} /> {isUploading ? 'Uploading...' : 'Upload Media'}
          <input 
            type="file" 
            className="hidden" 
            onChange={async (e) => {
              if (e.target.files?.[0]) {
                const file = e.target.files[0];
                const formData = new FormData();
                formData.append('file', file);
                setIsUploading(true);
                try {
                  await api.post('/api/uploads', formData);
                  toast.success('Uploaded successfully');
                  loadMedia();
                } catch (err) {
                  toast.error('Upload failed');
                } finally {
                  setIsUploading(false);
                }
              }
            }}
          />
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {mediaItems.map(item => (
          <div key={item.id} className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm group">
            <div className="aspect-square bg-gray-50 rounded-xl overflow-hidden relative mb-2">
               <img src={resolveAssetUrl(item.url)} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button onClick={() => {
                    navigator.clipboard.writeText(resolveAssetUrl(item.url));
                    toast.success('URL Copied');
                  }} className="p-2 bg-white rounded-lg text-gray-900 group/btn"><Copy size={16}/></button>
               </div>
            </div>
            <p className="text-[10px] font-bold text-gray-500 truncate px-1">{item.originalName}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const [heroForm, setHeroForm] = useState(heroData);
  const [settingsForm, setSettingsForm] = useState(siteSettings);

  useEffect(() => { setHeroForm(heroData); }, [heroData]);
  useEffect(() => { setSettingsForm(siteSettings); }, [siteSettings]);

  const renderHero = () => (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-black text-[#0f172a] serif">Hero Section</h2>
      <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Homepage Headline</label>
          <input 
            value={heroForm.headline} 
            onChange={e => setHeroForm({...heroForm, headline: e.target.value})}
            className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 text-lg font-bold" 
            placeholder="Headline" 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Subtitle / Bio</label>
          <textarea 
            value={heroForm.subtitle} 
            onChange={e => setHeroForm({...heroForm, subtitle: e.target.value})}
            className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 resize-none h-32 font-medium" 
            placeholder="Tell your story..." 
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-gray-400 tracking-widest px-1">Background Image URL</label>
          <input 
            value={heroForm.bg_image} 
            onChange={e => setHeroForm({...heroForm, bg_image: e.target.value})}
            className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0" 
            placeholder="https://..." 
          />
        </div>
        <button 
          onClick={() => updateHero(heroForm)}
          className="w-full bg-[#800000] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-red-900 transition-all flex items-center justify-center gap-2"
        >
          <Check size={20} /> Update Hero Section
        </button>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6 max-w-3xl">
      <h2 className="text-2xl font-black text-[#0f172a] serif">Site Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-[#001f3f] flex items-center gap-2"><Layout size={18}/> Branding</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Site Name</label>
              <input 
                value={settingsForm.site_name} 
                onChange={e => setSettingsForm({...settingsForm, site_name: e.target.value})}
                className="w-full bg-gray-50 px-4 py-2 rounded-lg border-transparent focus:ring-0 font-bold" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Organization Name</label>
              <input 
                value={settingsForm.org_name} 
                onChange={e => setSettingsForm({...settingsForm, org_name: e.target.value})}
                className="w-full bg-gray-50 px-4 py-2 rounded-lg border-transparent focus:ring-0 font-bold" 
              />
            </div>
          </div>
        </div>
        
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <h3 className="font-black text-[#001f3f] flex items-center gap-2"><Megaphone size={18}/> Social Links</h3>
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Twitter (X)</label>
              <input 
                value={settingsForm.twitter_link} 
                onChange={e => setSettingsForm({...settingsForm, twitter_link: e.target.value})}
                className="w-full bg-gray-50 px-4 py-2 rounded-lg border-transparent focus:ring-0" 
                placeholder="@username" 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-gray-400">Instagram</label>
              <input 
                value={settingsForm.instagram_link} 
                onChange={e => setSettingsForm({...settingsForm, instagram_link: e.target.value})}
                className="w-full bg-gray-50 px-4 py-2 rounded-lg border-transparent focus:ring-0" 
                placeholder="@username" 
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
         <button 
           onClick={() => updateSettings(settingsForm)}
           className="bg-[#001f3f] text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-black transition-all"
         >
           Save All Site Settings
         </button>
      </div>

      <div className="bg-red-50 p-6 rounded-3xl border border-red-100">
         <div className="flex items-center gap-3 text-[#800000] mb-2 font-black italic">
            <AlertCircle size={20} /> Danger Zone
         </div>
         <p className="text-xs text-red-600/70 mb-4">Actions in this section are permanent and affect the entire production environment.</p>
         <button className="bg-red-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors">Wipe Site Cache</button>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Subscription Approvals</h2>
        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-full">
           {users.length} Total Users
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Proof</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-[#0f172a] text-sm">{user.name || 'Anonymous Reader'}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{user.phone || 'No Phone'}</div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 text-sm">{user.email}</td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${user.subscription_plan === 'PRINT' ? 'bg-blue-100 text-[#001f3f]' : 'bg-green-100 text-green-700'}`}>
                      {user.subscription_plan || 'Digital'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex w-fit items-center gap-1 ${
                      user.subscription_status === 'ACTIVE' ? 'bg-green-50 text-green-700' :
                      user.subscription_status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                       {user.subscription_status === 'PENDING' && <Clock size={10} />}
                       {user.subscription_status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {user.payment_proof ? (
                      <a 
                        href={resolveAssetUrl(user.payment_proof)} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[#800000] hover:text-red-900 font-bold text-xs"
                      >
                         <Eye size={14} />
                         <span>View Proof</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-gray-300 font-bold uppercase">No Receipt</span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       {user.subscription_status === 'PENDING' && (
                         <>
                           <button onClick={() => approveUser(user.id)} className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 shadow-md">Approve</button>
                           <button onClick={() => rejectUser(user.id, 'Payment issue')} className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200">Reject</button>
                         </>
                       )}
                       <button onClick={() => deleteUser(user.id)} className="p-2 text-gray-300 hover:text-red-600 transition-colors">
                          <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAds = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Ads Management</h2>
        <button 
          onClick={() => { resetAdForm(); setIsAddingAd(!isAddingAd); }}
          className="bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-700 transition-all shadow-lg"
        >
          {isAddingAd ? <ArrowLeft size={20}/> : <Plus size={20}/>}
          {isAddingAd ? 'Back to Ads' : 'Create New Ad'}
        </button>
      </div>

      {isAddingAd ? (
        <form onSubmit={handleAdSubmit} className="max-w-3xl bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 space-y-6">
          <h3 className="text-lg font-black text-[#001f3f]">{editingAdId ? 'Edit Ad' : 'New Ad'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Ad Title</label>
              <input value={adForm.title} onChange={e => setAdForm({...adForm, title: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 font-bold" placeholder="e.g. Summer Sale Banner" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Status</label>
              <select value={adForm.status} onChange={e => setAdForm({...adForm, status: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 font-bold">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Description</label>
            <textarea value={adForm.description} onChange={e => setAdForm({...adForm, description: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0 resize-none h-24" placeholder="Brief description of the ad..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Image URL</label>
              <input value={adForm.image} onChange={e => setAdForm({...adForm, image: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0" placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Redirect URL</label>
              <input value={adForm.redirect_url} onChange={e => setAdForm({...adForm, redirect_url: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0" placeholder="https://..." />
            </div>
          </div>
          {adForm.image && (
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 aspect-[3/1] max-w-md">
              <img src={adForm.image} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
          )}
          <button type="submit" className="w-full bg-[#800000] text-white py-4 rounded-2xl font-black shadow-xl hover:bg-red-900 transition-all">
            {editingAdId ? 'Update Ad' : 'Create Ad'}
          </button>
        </form>
      ) : (
        <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
          {isAdminAdsLoading ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2">
              <RefreshCw size={16} className="animate-spin" /> Loading Ads...
            </div>
          ) : adminAds.length === 0 ? (
            <div className="p-10 text-center text-gray-400 font-bold uppercase tracking-widest text-xs">No Ads Created Yet</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Title</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Redirect</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {adminAds.map(ad => (
                  <tr key={ad.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {(ad.image || ad.imageUrl) && (
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img src={resolveAssetUrl(ad.image || ad.imageUrl || '')} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-[#0f172a] text-sm">{ad.title}</div>
                          {ad.description && <div className="text-[10px] text-gray-400 font-medium mt-0.5 truncate max-w-xs">{ad.description}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${ad.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {ad.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {(ad.redirect_url || ad.link) ? (
                        <a href={ad.redirect_url || ad.link} target="_blank" rel="noreferrer" className="text-blue-600 text-xs hover:underline flex items-center gap-1">
                          <ExternalLink size={12} /> Link
                        </a>
                      ) : (
                        <span className="text-[10px] text-gray-300 font-bold">No Link</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleEditAd(ad)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => handleDeleteAd(ad.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    switch(activeTab) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'ads': return renderAds();
      case 'news': return renderNews();
      case 'magazines': return renderMagazines();
      case 'ticker': return renderTicker();
      case 'media': return renderMedia();
      case 'hero': return renderHero();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  const navItems = [
    { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'User Management', icon: Users },
    { key: 'news', label: 'News Editor', icon: FileText },
    { key: 'magazines', label: 'Magazines', icon: Book },
    { key: 'hero', label: 'Hero Section', icon: Layout },
    { key: 'ticker', label: 'News Ticker', icon: Megaphone },
    { key: 'media', label: 'Media Library', icon: ImageIcon },
    { key: 'ads', label: 'Ads Management', icon: Edit2 },
    { key: 'settings', label: 'Site Settings', icon: Settings }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#f8fafc] overflow-hidden">
      <StyledAdminNav className="hidden lg:flex w-[240px] bg-[#0f172a] text-white p-6 flex-col shrink-0">
        <div className="mb-10 text-center">
          <h1 className="text-xl font-black serif uppercase tracking-widest text-[#800000]">Vartmaan</h1>
          <p className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.3em]">Master Console</p>
        </div>
        
        <div className="radio-inputs-vertical flex-1 overflow-y-auto">
          {navItems.map(item => (
             <label key={item.key} className="radio-vertical">
               <input 
                 type="radio" 
                 name="admin-tab" 
                 checked={activeTab === item.key}
                 onChange={() => setActiveTab(item.key)}
               />
               <span className="name">
                 <item.icon size={18} />
                 <span>{item.label}</span>
               </span>
             </label>
          ))}
        </div>

        <div className="pt-6 border-t border-white/5">
           <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest mb-1">Logged in as</p>
           <p className="text-xs font-bold text-white truncate">{currentUser?.name}</p>
        </div>
      </StyledAdminNav>

      <main className="flex-1 overflow-y-auto p-6 md:p-12">
         {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
