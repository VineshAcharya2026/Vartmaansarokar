import React, { useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  LayoutDashboard, FileText, Book, Image as ImageIcon, Settings, Users,
  Trash2, FileUp, Lock, Globe, Save, FolderOpen
} from 'lucide-react';
import { useApp } from '../AppContext';
import { MagazineIssue, NewsPost, UserRole } from '../types';
import { NEWS_CATEGORIES } from '../constants';
import { API_BASE, getAuthHeaders, resolveAssetUrl } from '../utils/app';
import { translateCategory, translateRole } from '../utils/i18n';
import MediaManager, { AdminMediaItem } from '../components/admin/MediaManager';

const Admin: React.FC = () => {
  const {
    news,
    magazines,
    ads,
    users,
    currentUser,
    addNews,
    updateNews,
    deleteNews,
    addMagazine,
    updateMagazine,
    deleteMagazine,
    updateUserRole,
    updateAds
  } = useApp();
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'news' | 'magazines' | 'media' | 'ads' | 'users' | 'settings'>('dashboard');
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [isSavingAds, setIsSavingAds] = useState(false);
  const magazinePdfInputRef = useRef<HTMLInputElement>(null);

  const [newsForm, setNewsForm] = useState<Partial<NewsPost>>({
    title: '',
    category: NEWS_CATEGORIES[0],
    excerpt: '',
    content: '',
    image: '',
    author: '',
    featured: false,
    requiresSubscription: false
  });

  const [newIssue, setNewIssue] = useState<Partial<MagazineIssue>>({
    title: '',
    issueNumber: '',
    coverImage: '',
    pdfUrl: '',
    pages: [],
    priceDigital: 0,
    pricePhysical: 499,
    gatedPage: 2,
    isFree: false,
    blurPaywall: false
  });

  const [editableAds, setEditableAds] = useState(ads);

  React.useEffect(() => {
    setEditableAds(ads);
  }, [ads]);

  if (!currentUser || ![UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MAGAZINE].includes(currentUser.role)) {
    return <Navigate to="/" replace />;
  }

  const isMaster = currentUser.role === UserRole.SUPER_ADMIN;

  const stats = useMemo(() => ([
    { label: t('admin.activeIssues'), value: magazines.length, icon: Book },
    { label: t('admin.newsArticles'), value: news.length, icon: FileText },
    { label: t('admin.subscribers'), value: users.length, icon: Users },
    { label: t('admin.activeAds'), value: ads.length, icon: ImageIcon }
  ]), [ads.length, magazines.length, news.length, t, users.length]);

  const resetNewsForm = () => {
    setEditingNewsId(null);
    setNewsForm({
      title: '',
      category: NEWS_CATEGORIES[0],
      excerpt: '',
      content: '',
      image: '',
      author: '',
      featured: false,
      requiresSubscription: false
    });
  };

  const handleStoryImageSelected = (item: AdminMediaItem) => {
    if (item.kind !== 'image') return;
    setNewsForm((prev) => ({ ...prev, image: item.url }));
  };

  const handleMagazineCoverSelected = (item: AdminMediaItem) => {
    if (item.kind !== 'image') return;
    setNewIssue((prev) => ({ ...prev, coverImage: item.url }));
  };

  const handleMagazinePageSelected = (item: AdminMediaItem) => {
    if (item.kind !== 'image') return;
    setNewIssue((prev) => ({ ...prev, pages: [...(prev.pages || []), item.url] }));
  };

  const handleMagazinePdfSelected = (item: AdminMediaItem) => {
    if (item.kind !== 'pdf') return;
    setNewIssue((prev) => ({ ...prev, pdfUrl: item.url }));
  };

  const handleMagazinePdfUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const resp = await fetch(API_BASE + '/api/uploads', {
        method: 'POST',
        headers: { ...getAuthHeaders() },
        body: formData
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data?.error || 'Failed to upload PDF');
      }

      if (data.media?.url) {
        setNewIssue((prev) => ({ ...prev, pdfUrl: data.media.url }));
      }
    } catch (error) {
      console.error('Failed to upload magazine PDF', error);
    } finally {
      if (magazinePdfInputRef.current) {
        magazinePdfInputRef.current.value = '';
      }
    }
  };

  const submitNews = async (event: React.FormEvent) => {
    event.preventDefault();
    const payload: NewsPost = {
      id: editingNewsId ?? Date.now().toString(),
      title: newsForm.title || 'Untitled Story',
      category: newsForm.category || NEWS_CATEGORIES[0],
      excerpt: newsForm.excerpt || '',
      content: newsForm.content || '',
      image: newsForm.image || 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
      author: newsForm.author || currentUser.name,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      featured: Boolean(newsForm.featured),
      requiresSubscription: Boolean(newsForm.requiresSubscription)
    };

    if (editingNewsId) {
      await updateNews(editingNewsId, payload);
    } else {
      await addNews(payload);
    }

    resetNewsForm();
  };

  const handleUploadMagazine = () => {
    const mag: MagazineIssue = {
      id: 'm' + Date.now(),
      title: newIssue.title || 'Untitled Issue',
      issueNumber: newIssue.issueNumber || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      coverImage: newIssue.coverImage || 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop',
      pages: newIssue.pages?.length
        ? newIssue.pages
        : Array.from({ length: 10 }, (_, index) => `https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop&q=${60 + index}`),
      date: new Date().toISOString().split('T')[0],
      priceDigital: newIssue.priceDigital || 0,
      pricePhysical: newIssue.pricePhysical || 499,
      isFree: Boolean(newIssue.isFree),
      gatedPage: newIssue.gatedPage || 2,
      blurPaywall: Boolean(newIssue.blurPaywall)
    };

    void addMagazine(mag);
    setNewIssue({
      title: '',
      issueNumber: '',
      coverImage: '',
      pages: [],
      priceDigital: 0,
      pricePhysical: 499,
      gatedPage: 2,
      isFree: false,
      blurPaywall: false
    });
  };

  const saveAds = async () => {
    setIsSavingAds(true);
    await updateAds(editableAds);
    setIsSavingAds(false);
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-[#001f3f] to-[#800000] p-8 rounded-3xl text-white shadow-xl">
        <h1 className="text-3xl font-black serif mb-2">{t('admin.welcomeBack', { name: currentUser.name })}</h1>
        <p className="text-blue-100">{t('admin.dashboardBody')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm min-w-0">
              <div className="flex items-center justify-between mb-4">
                <Icon className="text-[#800000]" size={24} />
                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.label}</span>
              </div>
              <h3 className="text-3xl font-black text-[#001f3f] serif">{item.value}</h3>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderNews = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[420px,minmax(0,1fr)] gap-8 items-start">
      <form onSubmit={submitNews} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 xl:sticky xl:top-6">
        <div>
          <h2 className="text-2xl font-black text-[#001f3f] serif">{editingNewsId ? t('admin.editStory') : t('admin.publishStory')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('admin.newsFormBody')}</p>
        </div>
        <input value={newsForm.title || ''} onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })} placeholder={t('admin.storyTitle')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" required />
        <select value={newsForm.category || NEWS_CATEGORIES[0]} onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })} className="w-full bg-gray-50 px-4 py-3 rounded-2xl">
          {NEWS_CATEGORIES.map((category) => <option key={category} value={category}>{translateCategory(t, category)}</option>)}
        </select>
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={newsForm.image || ''} onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })} placeholder={t('admin.imageUrl')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
            <button type="button" onClick={() => setActiveTab('media')} className="px-4 py-3 rounded-2xl bg-gray-100 text-[#001f3f] font-bold whitespace-nowrap">
              Media
            </button>
          </div>
          {newsForm.image && (
            <img src={resolveAssetUrl(newsForm.image)} alt="Story preview" className="h-32 w-full object-cover rounded-2xl border border-gray-100" />
          )}
        </div>
        <input value={newsForm.author || ''} onChange={(e) => setNewsForm({ ...newsForm, author: e.target.value })} placeholder={t('admin.authorName')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
        <textarea value={newsForm.excerpt || ''} onChange={(e) => setNewsForm({ ...newsForm, excerpt: e.target.value })} placeholder={t('admin.shortExcerpt')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl min-h-[100px]" required />
        <textarea value={newsForm.content || ''} onChange={(e) => setNewsForm({ ...newsForm, content: e.target.value })} placeholder={t('admin.fullArticleContent')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl min-h-[180px]" required />
        <label className="flex items-center gap-3 text-sm font-bold text-[#001f3f]">
          <input type="checkbox" checked={Boolean(newsForm.featured)} onChange={(e) => setNewsForm({ ...newsForm, featured: e.target.checked })} />
          {t('admin.featureHomepage')}
        </label>
        <label className="flex items-center gap-3 text-sm font-bold text-[#001f3f]">
          <input type="checkbox" checked={Boolean(newsForm.requiresSubscription)} onChange={(e) => setNewsForm({ ...newsForm, requiresSubscription: e.target.checked })} />
          {t('admin.requireSubscription')}
        </label>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-[#800000] text-white py-3 rounded-2xl font-bold hover:bg-red-800 transition-colors">
            {editingNewsId ? t('admin.updateStory') : t('admin.publishStory')}
          </button>
          {editingNewsId && (
            <button type="button" onClick={resetNewsForm} className="px-5 py-3 rounded-2xl font-bold bg-gray-100 text-[#001f3f]">{t('common.cancel')}</button>
          )}
        </div>
      </form>

      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-w-0">
        <h3 className="text-2xl font-black text-[#001f3f] serif mb-6">{t('admin.publishedStories')}</h3>
        <div className="space-y-4">
          {news.map((item) => (
            <div key={item.id} className="border border-gray-100 rounded-3xl p-5 flex flex-col xl:flex-row gap-4 xl:items-center xl:justify-between min-w-0">
              <div className="flex gap-4 items-start min-w-0">
                <img src={resolveAssetUrl(item.image)} alt={item.title} className="w-24 h-24 object-cover rounded-2xl bg-gray-100 shrink-0" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-[10px] uppercase tracking-widest font-bold text-[#800000]">{translateCategory(t, item.category)}</span>
                    {item.featured && <span className="text-[10px] uppercase tracking-widest font-bold text-green-600">{t('admin.featured')}</span>}
                    {item.requiresSubscription && <span className="text-[10px] uppercase tracking-widest font-bold text-[#001f3f]">{t('admin.subscriber')}</span>}
                  </div>
                  <h4 className="text-lg font-bold text-[#001f3f] truncate">{item.title}</h4>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                  <p className="text-xs text-gray-400 mt-2">{item.author} • {item.date}</p>
                </div>
              </div>
              <div className="flex gap-3 shrink-0">
                <button onClick={() => { setEditingNewsId(item.id); setNewsForm(item); }} className="px-4 py-2 rounded-xl bg-gray-100 text-[#001f3f] font-bold">{t('common.edit')}</button>
                <button onClick={() => void deleteNews(item.id)} className="px-4 py-2 rounded-xl bg-red-50 text-[#800000] font-bold">{t('common.delete')}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMagazines = () => (
    <div className="grid grid-cols-1 xl:grid-cols-[420px,minmax(0,1fr)] gap-8 items-start">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4 xl:sticky xl:top-6">
        <div>
          <h2 className="text-2xl font-black text-[#001f3f] serif">{t('admin.publishIssue')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('admin.magazineFormBody')}</p>
        </div>
        <input type="file" ref={magazinePdfInputRef} accept="application/pdf" className="hidden" onChange={(e) => void handleMagazinePdfUpload(e)} />
        <button onClick={() => magazinePdfInputRef.current?.click()} className="w-full bg-gray-100 text-[#001f3f] py-3 rounded-2xl font-bold flex items-center justify-center gap-3">
          <FileUp size={18} /> {t('admin.uploadPdf')}
        </button>
        <input value={newIssue.title || ''} onChange={(e) => setNewIssue({ ...newIssue, title: e.target.value })} placeholder={t('admin.issueTitle')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
        <input value={newIssue.issueNumber || ''} onChange={(e) => setNewIssue({ ...newIssue, issueNumber: e.target.value })} placeholder={t('admin.issueNumber')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
        <div className="space-y-3">
          <div className="flex gap-3">
            <input value={newIssue.coverImage || ''} onChange={(e) => setNewIssue({ ...newIssue, coverImage: e.target.value })} placeholder={t('admin.coverImageUrl')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
            <button type="button" onClick={() => setActiveTab('media')} className="px-4 py-3 rounded-2xl bg-gray-100 text-[#001f3f] font-bold whitespace-nowrap">
              Media
            </button>
          </div>
          {newIssue.coverImage && (
            <img src={resolveAssetUrl(newIssue.coverImage)} alt="Cover preview" className="h-40 w-full object-cover rounded-2xl border border-gray-100" />
          )}
        </div>
        <input value={newIssue.pdfUrl || ''} onChange={(e) => setNewIssue({ ...newIssue, pdfUrl: e.target.value })} placeholder="PDF asset URL" className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
        <textarea value={(newIssue.pages || []).join('\n')} onChange={(e) => setNewIssue({ ...newIssue, pages: e.target.value.split('\n').map((item) => item.trim()).filter(Boolean) })} placeholder={t('admin.pagesHint')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl min-h-[140px]" />
        {(newIssue.pages || []).length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {(newIssue.pages || []).slice(0, 6).map((page, index) => (
              <img key={`${page}-${index}`} src={resolveAssetUrl(page)} alt={`Page ${index + 1}`} className="h-24 w-full object-cover rounded-xl border border-gray-100" />
            ))}
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={newIssue.priceDigital || 0} onChange={(e) => setNewIssue({ ...newIssue, priceDigital: Number(e.target.value) })} placeholder={t('admin.digitalPrice')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
          <input type="number" value={newIssue.pricePhysical || 0} onChange={(e) => setNewIssue({ ...newIssue, pricePhysical: Number(e.target.value) })} placeholder={t('admin.physicalPrice')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input type="number" value={newIssue.gatedPage || 2} onChange={(e) => setNewIssue({ ...newIssue, gatedPage: Number(e.target.value) })} placeholder={t('admin.gatedPage')} className="w-full bg-gray-50 px-4 py-3 rounded-2xl" />
          <label className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl font-bold text-sm text-[#001f3f]">
            <input type="checkbox" checked={Boolean(newIssue.isFree)} onChange={(e) => setNewIssue({ ...newIssue, isFree: e.target.checked })} />
            {t('admin.freeIssue')}
          </label>
        </div>
        <label className="flex items-center gap-3 bg-gray-50 px-4 py-3 rounded-2xl font-bold text-sm text-[#001f3f]">
          <input type="checkbox" checked={Boolean(newIssue.blurPaywall)} onChange={(e) => setNewIssue({ ...newIssue, blurPaywall: e.target.checked })} />
          {t('admin.enableBlurPaywall')}
        </label>
        <div className="rounded-2xl bg-[#001f3f]/5 px-4 py-4 text-sm text-gray-600">
          {t('admin.magazineHelper')}
        </div>
        <button onClick={handleUploadMagazine} className="w-full bg-[#800000] text-white py-3 rounded-2xl font-bold hover:bg-red-800 transition-colors">{t('admin.publishIssue')}</button>
      </div>

      <div className="space-y-6 min-w-0">
        {magazines.map((magazine) => (
          <div key={magazine.id} className="bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm flex flex-col xl:flex-row gap-8 min-w-0">
            <div className="w-44 shrink-0 relative overflow-hidden rounded-3xl shadow-xl">
              <img src={resolveAssetUrl(magazine.coverImage)} className="w-full h-64 object-cover" alt={magazine.title} />
            </div>
            <div className="flex-1 flex flex-col gap-5 min-w-0">
              <div>
                <h4 className="text-xl font-bold text-[#001f3f] serif leading-tight">{magazine.title}</h4>
                <div className="flex items-center gap-3 mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <Globe size={14} />
                  <span>{magazine.pages.length} {t('admin.pages')}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <label className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">
                    <Lock size={12} className="mr-2" /> {t('admin.gatedPage')}
                  </label>
                  <input type="number" value={magazine.gatedPage || 2} onChange={(e) => void updateMagazine(magazine.id, { gatedPage: Number(e.target.value) })} className="w-full bg-white px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-[#800000]" />
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <label className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">{t('admin.digitalAccess')}</label>
                  <button onClick={() => void updateMagazine(magazine.id, { isFree: !magazine.isFree })} className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${magazine.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {magazine.isFree ? t('common.public') : t('common.premium')}
                  </button>
                </div>
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <label className="flex items-center text-[10px] font-black uppercase text-gray-400 tracking-widest mb-3">{t('admin.blurPaywall')}</label>
                  <button onClick={() => void updateMagazine(magazine.id, { blurPaywall: !magazine.blurPaywall })} className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${magazine.blurPaywall ? 'bg-[#001f3f] text-white' : 'bg-white text-[#001f3f] border border-gray-200'}`}>
                    {magazine.blurPaywall ? t('common.enabled') : t('common.disabled')}
                  </button>
                </div>
              </div>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <p className="text-sm text-gray-500">
                  {t('admin.previewUntil', { page: magazine.gatedPage || 2, price: magazine.pricePhysical })}
                </p>
                <button onClick={() => void deleteMagazine(magazine.id)} className="px-4 py-2 rounded-xl bg-red-50 text-[#800000] font-bold flex items-center gap-2 shrink-0">
                  <Trash2 size={16} /> {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderAds = () => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-[#001f3f] serif">{t('admin.advertisingSlots')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('admin.adsBody')}</p>
        </div>
        <button onClick={() => void saveAds()} className="bg-[#800000] text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2">
          <Save size={16} /> {isSavingAds ? t('common.save') : t('admin.saveAds')}
        </button>
      </div>
      <div className="space-y-4">
        {editableAds.map((ad, index) => (
          <div key={ad.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-3xl border border-gray-100">
            <input value={ad.title} onChange={(e) => setEditableAds((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, title: e.target.value } : item))} placeholder={t('admin.adTitle')} className="bg-gray-50 px-4 py-3 rounded-2xl" />
            <input value={ad.imageUrl} onChange={(e) => setEditableAds((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, imageUrl: e.target.value } : item))} placeholder={t('admin.imageUrl')} className="bg-gray-50 px-4 py-3 rounded-2xl" />
            <input value={ad.link} onChange={(e) => setEditableAds((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, link: e.target.value } : item))} placeholder={t('admin.destinationUrl')} className="bg-gray-50 px-4 py-3 rounded-2xl" />
            <select value={ad.position} onChange={(e) => setEditableAds((prev) => prev.map((item, itemIndex) => itemIndex === index ? { ...item, position: e.target.value as typeof ad.position } : item))} className="bg-gray-50 px-4 py-3 rounded-2xl">
              <option value="SIDEBAR_TOP">{t('admin.sidebarTop')}</option>
              <option value="SIDEBAR_MID">{t('admin.sidebarMid')}</option>
              <option value="SIDEBAR_BOTTOM">{t('admin.sidebarBottom')}</option>
              <option value="HOMEPAGE_BANNER">{t('admin.homepageBanner')}</option>
            </select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderMedia = () => (
    <MediaManager
      onSelectForNewsImage={(item) => {
        handleStoryImageSelected(item);
        setActiveTab('news');
      }}
      onSelectForMagazineCover={(item) => {
        handleMagazineCoverSelected(item);
        setActiveTab('magazines');
      }}
      onSelectForMagazinePage={(item) => {
        handleMagazinePageSelected(item);
        setActiveTab('magazines');
      }}
      onSelectForMagazinePdf={(item) => {
        handleMagazinePdfSelected(item);
        setActiveTab('magazines');
      }}
    />
  );

  const renderUsers = () => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <div>
        <h2 className="text-2xl font-black text-[#001f3f] serif">{t('admin.userRoles')}</h2>
        <p className="text-sm text-gray-500 mt-1">{t('admin.userRolesBody')}</p>
      </div>
      {users.map((user) => (
        <div key={user.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 rounded-3xl border border-gray-100">
          <div>
            <h4 className="font-bold text-[#001f3f]">{user.name}</h4>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <select value={user.role} disabled={!isMaster} onChange={(e) => void updateUserRole(user.id, e.target.value as UserRole)} className="bg-gray-50 px-4 py-3 rounded-2xl min-w-[180px]">
            <option value={UserRole.GENERAL}>{translateRole(t, UserRole.GENERAL)}</option>
            <option value={UserRole.MAGAZINE}>{translateRole(t, UserRole.MAGAZINE)}</option>
            <option value={UserRole.ADMIN}>{translateRole(t, UserRole.ADMIN)}</option>
            <option value={UserRole.SUPER_ADMIN}>{translateRole(t, UserRole.SUPER_ADMIN)}</option>
          </select>
        </div>
      ))}
    </div>
  );

  const renderSettings = () => (
    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
      <h2 className="text-2xl font-black text-[#001f3f] serif">{t('admin.publishingNotes')}</h2>
      <p className="text-sm text-gray-600">{t('admin.settingsLineOne')}</p>
      <p className="text-sm text-gray-600">{t('admin.settingsLineTwo')}</p>
      <p className="text-sm text-gray-600">{t('admin.settingsLineThree')}</p>
    </div>
  );

  const navItems = [
    { key: 'dashboard', label: t('common.overview'), icon: LayoutDashboard },
    { key: 'magazines', label: t('common.digitalLibrary'), icon: Book },
    { key: 'news', label: t('common.newsEditor'), icon: FileText },
    { key: 'media', label: t('common.media'), icon: FolderOpen },
    { key: 'ads', label: 'Ads', icon: ImageIcon },
    { key: 'users', label: t('common.crm'), icon: Users },
    { key: 'settings', label: t('common.settings'), icon: Settings }
  ].filter((item) => isMaster || item.key !== 'users');

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-gray-50 -mx-4 -my-8 md:-my-16 overflow-hidden">
      <StyledAdminNav className="w-full lg:w-72 bg-[#001f3f] text-white p-6 md:p-8 flex flex-col shrink-0">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-12 h-12 bg-[#800000] rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">VS</div>
          <h2 className="font-black text-xl serif">{t('admin.masterPanel')}</h2>
        </div>
        <div className="flex-1">
          <div className="radio-inputs-vertical">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <label key={item.key} className="radio-vertical">
                  <input
                    type="radio"
                    name="admin-nav"
                    checked={activeTab === item.key}
                    onChange={() => setActiveTab(item.key as typeof activeTab)}
                  />
                  <span className="name-vertical">
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      </StyledAdminNav>

      <main className="flex-1 min-w-0 p-6 md:p-10 overflow-y-auto">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'news' && renderNews()}
        {activeTab === 'magazines' && renderMagazines()}
        {activeTab === 'media' && renderMedia()}
        {activeTab === 'ads' && renderAds()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'settings' && renderSettings()}
      </main>
    </div>
  );
};

const StyledAdminNav = styled.nav`
  .radio-inputs-vertical {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .radio-inputs-vertical input {
    display: none;
  }

  .radio-inputs-vertical .radio-vertical .name-vertical {
    display: flex;
    align-items: center;
    gap: 1rem;
    cursor: pointer;
    padding: 0.75rem 1rem;
    border-radius: 0.75rem;
    color: #e0e0e0;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.15s ease-in-out;
    position: relative;
  }

  .radio-inputs-vertical input:checked + .name-vertical {
    background-color: #800000;
    color: #ffffff;
    font-weight: 700;
  }

  .radio-inputs-vertical input + .name-vertical:hover {
    background-color: rgba(255, 255, 255, 0.08);
    color: #ffffff;
  }

  .radio-inputs-vertical input:checked + .name-vertical:hover {
    background-color: #800000;
    color: #ffffff;
  }
`;

export default Admin;
