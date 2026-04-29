import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  ShieldCheck,
  ClipboardList,
  Send,
  Download
} from 'lucide-react';
import { useApp } from '../vartmaan-frontend-app-context';
import { UserRole, MagazineItem, AdItem, MediaItem, SubscriptionRequest } from '../vartmaan-shared-types';
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

const ADMIN_NAV_DEFINITION = [
  { key: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { key: 'users', label: 'User Management', icon: Users },
  { key: 'subscriptions', label: 'Subscription Requests', icon: Clock },
  { key: 'approvals', label: 'Content approvals', icon: ClipboardList },
  { key: 'news', label: 'News Editor', icon: FileText },
  { key: 'magazines', label: 'Magazines', icon: Book },
  { key: 'hero', label: 'Hero Section', icon: Layout },
  { key: 'ticker', label: 'News Ticker', icon: Megaphone },
  { key: 'media', label: 'Media Library', icon: ImageIcon },
  { key: 'ads', label: 'Ads Management', icon: Edit2 },
  { key: 'settings', label: 'Site Settings', icon: Settings }
] as const;

const MASTER_ONLY_NAV_KEYS = new Set<string>(['users', 'subscriptions', 'approvals']);
const EDITOR_HIDDEN_NAV_KEYS = new Set<string>(['users', 'subscriptions', 'approvals', 'ads', 'hero', 'ticker', 'settings']);

const Admin: React.FC = () => {
  const navigate = useNavigate();
  const { 
    currentUser, magazines, news, staffArticles, articleApprovalQueue, magazineApprovalQueue, ads, users, subscriptionRequests,
    heroData, siteSettings,
    fetchNews, fetchStaffArticles, addNews, updateNews, deleteNews, submitNews, approveNews, rejectNews, reworkNews,
    fetchMagazines, addMagazine, updateMagazine, deleteMagazine, submitMagazine, approveMagazine, rejectMagazine, reworkMagazine,
    fetchUsers, fetchSubscriptionRequests, approveUser, rejectUser, deleteUser,
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
  const [pdfMediaItems, setPdfMediaItems] = useState<MediaItem[]>([]);
  const [mediaPage, setMediaPage] = useState(1);
  const [mediaTotalPages, setMediaTotalPages] = useState(1);
  const [mediaTotalCount, setMediaTotalCount] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [newTickerText, setNewTickerText] = useState('');
  const [editingTickerId, setEditingTickerId] = useState<string | null>(null);
  const [editingTickerText, setEditingTickerText] = useState('');
  const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [subscriptionSearchQuery, setSubscriptionSearchQuery] = useState('');
  const [subscriptionPlanTab, setSubscriptionPlanTab] = useState<'ALL' | 'DIGITAL' | 'PHYSICAL'>('ALL');
  const [subscriptionPage, setSubscriptionPage] = useState(1);
  const [subscriptionActionLoading, setSubscriptionActionLoading] = useState<Record<string, 'approve' | 'reject' | 'delete'>>({});
  const SUBS_PAGE_SIZE = 20;

  const filteredSubscriptionRequests = useMemo(() => {
    return subscriptionRequests.filter((request) => {
      const matchesStatus = subscriptionStatusFilter === 'ALL' || request.status === subscriptionStatusFilter;
      const matchesPlan =
        subscriptionPlanTab === 'ALL' ||
        (subscriptionPlanTab === 'DIGITAL' && request.accessType === 'DIGITAL') ||
        (subscriptionPlanTab === 'PHYSICAL' && request.accessType === 'PHYSICAL');
      const q = subscriptionSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        request.name?.toLowerCase().includes(q) ||
        request.email?.toLowerCase().includes(q) ||
        request.phone?.toLowerCase().includes(q);
      return matchesStatus && matchesPlan && matchesSearch;
    });
  }, [subscriptionRequests, subscriptionStatusFilter, subscriptionPlanTab, subscriptionSearchQuery]);

  const paginatedSubscriptionRequests = useMemo(() => {
    const start = (subscriptionPage - 1) * SUBS_PAGE_SIZE;
    return filteredSubscriptionRequests.slice(start, start + SUBS_PAGE_SIZE);
  }, [filteredSubscriptionRequests, subscriptionPage]);

  useEffect(() => {
    setSubscriptionPage(1);
  }, [subscriptionStatusFilter, subscriptionPlanTab, subscriptionSearchQuery]);

  const handleApproveSubscription = async (id: string) => {
    try {
      setSubscriptionActionLoading((prev) => ({ ...prev, [id]: 'approve' }));
      await approveUser(id);
      await fetchSubscriptionRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to approve subscription request.');
    } finally {
      setSubscriptionActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleRejectSubscription = async (id: string) => {
    try {
      setSubscriptionActionLoading((prev) => ({ ...prev, [id]: 'reject' }));
      await rejectUser(id, 'Rejected by admin review.');
      await fetchSubscriptionRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to reject subscription request.');
    } finally {
      setSubscriptionActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const handleDeleteSubscription = async (id: string) => {
    try {
      setSubscriptionActionLoading((prev) => ({ ...prev, [id]: 'delete' }));
      await deleteUser(id);
      await fetchSubscriptionRequests();
    } catch (error: any) {
      toast.error(error?.message || 'Failed to delete subscription request.');
    } finally {
      setSubscriptionActionLoading((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    }
  };

  const exportSubscriptionsCsv = () => {
    const esc = (v: string | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const headers = ['id', 'name', 'email', 'phone', 'plan', 'status', 'rejectionReason', 'message', 'address', 'paymentProof', 'createdAt'];
    const lines = [
      headers.join(','),
      ...filteredSubscriptionRequests.map((r) =>
        [
          esc(r.id),
          esc(r.name),
          esc(r.email),
          esc(r.phone),
          esc(r.accessType),
          esc(r.status),
          esc(r.rejectionReason),
          esc(r.message),
          esc(r.address),
          esc(r.paymentScreenshotUrl),
          esc(r.createdAt)
        ].join(',')
      )
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('CSV exported');
  };

  const isMaster = currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN;
  const canWriteContent = [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser?.role as UserRole);

  const navItems = useMemo(
    () =>
      ADMIN_NAV_DEFINITION.filter((item) => {
        if (MASTER_ONLY_NAV_KEYS.has(item.key) && !isMaster) return false;
        if (currentUser?.role === UserRole.EDITOR && EDITOR_HIDDEN_NAV_KEYS.has(item.key)) return false;
        return true;
      }),
    [isMaster, currentUser?.role]
  );

  useEffect(() => {
    if (!navItems.some((n) => n.key === activeTab)) setActiveTab('dashboard');
  }, [navItems, activeTab]);

  useEffect(() => {
    if (activeTab === 'ads') loadAdminAds();
    if (activeTab === 'ticker') loadTicker();
    if (activeTab === 'media') loadMedia();
    if (activeTab === 'approvals' && isMaster) {
      void fetchStaffArticles();
      void fetchMagazines();
    }
  }, [activeTab, isMaster]);

  const articleStatusClass = (status: string | undefined) => {
    const s = status || '';
    if (s === 'PUBLISHED' || s === 'APPROVED') return 'bg-green-100 text-green-700';
    if (s === 'IN_REVIEW' || s === 'PENDING_REVIEW') return 'bg-amber-100 text-amber-700';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700';
    if (s === 'DRAFT') return 'bg-slate-100 text-slate-700';
    return 'bg-gray-100 text-gray-600';
  };

  const promptReason = (title: string) => window.prompt(title, '')?.trim() || '';

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

  const loadMedia = async (page = mediaPage) => {
    try {
      const [{ data: imageData }, { data: pdfData }] = await Promise.all([
        api.get('/api/media', { params: { kind: 'image', page, pageSize: 100 } }),
        api.get('/api/media', { params: { kind: 'pdf', page: 1, pageSize: 200 } })
      ]);
      const img = imageData as { media?: MediaItem[]; meta?: { page?: number; totalPages?: number; total?: number } };
      const pdf = pdfData as { media?: MediaItem[] };
      setMediaItems(img.media ?? []);
      setPdfMediaItems(pdf.media ?? []);
      setMediaPage(img.meta?.page ?? page);
      setMediaTotalPages(img.meta?.totalPages ?? 1);
      setMediaTotalCount(img.meta?.total ?? (img.media?.length ?? 0));
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
    try {
      await deleteAd(id);
      loadAdminAds();
      toast.success('Ad deleted');
    } catch {
      toast.error('Failed to delete ad');
    }
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
      
      {isMaster && (articleApprovalQueue.length > 0 || magazineApprovalQueue.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Articles awaiting approval</p>
              <p className="text-3xl font-black text-amber-950 mt-1">{articleApprovalQueue.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className="text-xs font-black uppercase tracking-wider bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700"
            >
              Open queue
            </button>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-[24px] p-6 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Magazines awaiting approval</p>
              <p className="text-3xl font-black text-amber-950 mt-1">{magazineApprovalQueue.length}</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('approvals')}
              className="text-xs font-black uppercase tracking-wider bg-amber-600 text-white px-4 py-2 rounded-xl hover:bg-amber-700"
            >
              Open queue
            </button>
          </div>
        </div>
      )}

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
            {staffArticles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-16 text-center text-gray-400 font-bold text-sm">
                  No articles yet. Create one with &quot;Write Article&quot;.
                </td>
              </tr>
            )}
            {staffArticles.map(item => (
              <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-[#0f172a] text-sm truncate max-w-xs">{item.title}</div>
                  <div className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">{item.author}</div>
                </td>
                <td className="px-6 py-4">
                  <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">{item.category}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${articleStatusClass(item.status)}`}>
                    {item.status || 'DRAFT'}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {canWriteContent && (item.status === 'DRAFT' || item.status === 'REJECTED') && (
                      <button
                        type="button"
                        title="Submit for review"
                        onClick={() => void submitNews(item.id)}
                        className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Send size={18} />
                      </button>
                    )}
                    {isMaster && item.status === 'IN_REVIEW' && (
                      <>
                        <button type="button" onClick={() => void approveNews(item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Approve"><Check size={18}/></button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = promptReason('Reason for rejection (required)');
                            if (reason) void rejectNews(item.id, reason);
                          }}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Reject"
                        >
                          <X size={18}/>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reason = promptReason('Notes for editor (rework)');
                            if (reason) void reworkNews(item.id, reason);
                          }}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Request rework"
                        >
                          <RefreshCw size={18}/>
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => navigate(`/admin/news/edit/${item.id}`)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit2 size={18}/>
                    </button>
                    {canWriteContent && (
                      <button type="button" onClick={() => void deleteNews(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={18}/></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderApprovals = () => (
    <div className="space-y-10">
      <div>
        <h2 className="text-2xl font-black text-[#0f172a] serif mb-2">Content approvals</h2>
        <p className="text-sm text-gray-500 font-medium max-w-2xl">
          Articles and magazines in <span className="font-bold text-amber-800">IN_REVIEW</span> are not visible on the public site until approved here.
        </p>
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <ClipboardList size={18} className="text-[#800000]" />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Articles pending</h3>
          <span className="ml-auto text-xs font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">{articleApprovalQueue.length}</span>
        </div>
        {articleApprovalQueue.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm font-semibold">No articles awaiting approval.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-6 py-3">Title</th>
                <th className="px-6 py-3">Author</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {articleApprovalQueue.map((item) => (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold text-sm text-[#0f172a]">{item.title}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{item.author}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button type="button" onClick={() => void approveNews(item.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={18} /></button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Reason for rejection');
                          if (reason) void rejectNews(item.id, reason);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Notes for editor (rework)');
                          if (reason) void reworkNews(item.id, reason);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Rework"
                      >
                        <RefreshCw size={18} />
                      </button>
                      <button type="button" onClick={() => navigate(`/admin/news/edit/${item.id}`)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
          <Book size={18} className="text-[#800000]" />
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-600">Magazines pending</h3>
          <span className="ml-auto text-xs font-black text-amber-800 bg-amber-100 px-2 py-1 rounded-lg">{magazineApprovalQueue.length}</span>
        </div>
        {magazineApprovalQueue.length === 0 ? (
          <p className="p-8 text-center text-gray-400 text-sm font-semibold">No magazines awaiting approval.</p>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 text-[10px] font-black uppercase text-gray-400 tracking-widest">
                <th className="px-6 py-3">Issue</th>
                <th className="px-6 py-3">#</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {magazineApprovalQueue.map((mag) => (
                <tr key={mag.id}>
                  <td className="px-6 py-4 font-bold text-sm text-[#0f172a]">{mag.title}</td>
                  <td className="px-6 py-4 text-xs text-gray-500">{mag.issueNumber}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      <button type="button" onClick={() => void approveMagazine(mag.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={18} /></button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Reason for rejection');
                          if (reason) void rejectMagazine(mag.id, reason);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Reject"
                      >
                        <X size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Notes for editor (rework)');
                          if (reason) void reworkMagazine(mag.id, reason);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Rework"
                      >
                        <RefreshCw size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const [isAddingMag, setIsAddingMag] = useState(false);
  const [editingMagazineId, setEditingMagazineId] = useState<string | null>(null);
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
  const [isCoverUploading, setIsCoverUploading] = useState(false);
  const [isPdfUploading, setIsPdfUploading] = useState(false);
  const [showCoverLibrary, setShowCoverLibrary] = useState(false);
  const [showPdfLibrary, setShowPdfLibrary] = useState(false);
  const [coverLibraryItems, setCoverLibraryItems] = useState<MediaItem[]>([]);
  const [pdfLibraryItems, setPdfLibraryItems] = useState<MediaItem[]>([]);
  const [isCoverLibraryLoading, setIsCoverLibraryLoading] = useState(false);
  const [isPdfLibraryLoading, setIsPdfLibraryLoading] = useState(false);
  const [coverLibraryQuery, setCoverLibraryQuery] = useState('');
  const [pdfLibraryQuery, setPdfLibraryQuery] = useState('');
  const magCoverInputRef = useRef<HTMLInputElement | null>(null);
  const magPdfInputRef = useRef<HTMLInputElement | null>(null);

  const handleMagazineAssetUpload = async (file: File, target: 'cover' | 'pdf') => {
    const formData = new FormData();
    formData.append('file', file);
    if (target === 'cover') setIsCoverUploading(true);
    if (target === 'pdf') setIsPdfUploading(true);
    try {
      const { data } = await api.post('/api/uploads', formData);
      const uploadedUrl = (data as { media?: { url?: string } })?.media?.url;
      if (!uploadedUrl) {
        toast.error('Upload failed');
        return;
      }
      if (target === 'cover') {
        setMagForm((prev) => ({ ...prev, coverImage: uploadedUrl }));
        toast.success('Cover image uploaded');
      } else {
        setMagForm((prev) => ({ ...prev, pdfUrl: uploadedUrl }));
        toast.success('PDF uploaded');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      if (target === 'cover') {
        setIsCoverUploading(false);
        if (magCoverInputRef.current) magCoverInputRef.current.value = '';
      }
      if (target === 'pdf') {
        setIsPdfUploading(false);
        if (magPdfInputRef.current) magPdfInputRef.current.value = '';
      }
    }
  };

  const loadMagazineLibrary = async (kind: 'image' | 'pdf') => {
    if (kind === 'image') setIsCoverLibraryLoading(true);
    if (kind === 'pdf') setIsPdfLibraryLoading(true);
    try {
      const { data } = await api.get('/api/media', { params: { kind } });
      const media = ((data as { media?: MediaItem[] }).media ?? []).filter((item) => item.kind === kind);
      if (kind === 'image') setCoverLibraryItems(media);
      if (kind === 'pdf') setPdfLibraryItems(media);
    } catch {
      toast.error('Failed to load media library');
    } finally {
      if (kind === 'image') setIsCoverLibraryLoading(false);
      if (kind === 'pdf') setIsPdfLibraryLoading(false);
    }
  };

  const filteredCoverLibraryItems = coverLibraryItems.filter((item) =>
    item.originalName.toLowerCase().includes(coverLibraryQuery.trim().toLowerCase())
  );
  const filteredPdfLibraryItems = pdfLibraryItems.filter((item) =>
    item.originalName.toLowerCase().includes(pdfLibraryQuery.trim().toLowerCase())
  );

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
      if (editingMagazineId) {
        await updateMagazine(editingMagazineId, {
          ...magForm,
          pages: magForm.coverImage ? [magForm.coverImage] : []
        });
      } else {
        await addMagazine({
          ...magForm,
          pages: magForm.coverImage ? [magForm.coverImage] : []
        });
      }
      setIsAddingMag(false);
      setEditingMagazineId(null);
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
      setMagError(err.message || 'Failed to save magazine. Please try again.');
    } finally {
      setMagLoading(false);
    }
  };

  const startEditMagazine = (mag: MagazineItem) => {
    setEditingMagazineId(mag.id);
    setIsAddingMag(true);
    setMagError('');
    setMagForm({
      title: mag.title || '',
      issueNumber: mag.issueNumber || '',
      date: (mag.date || new Date().toISOString().split('T')[0]).slice(0, 10),
      coverImage: mag.coverImage || '',
      pdfUrl: mag.pdfUrl || '',
      gatedPage: typeof mag.gatedPage === 'number' ? mag.gatedPage : 2,
      pricePhysical: typeof mag.pricePhysical === 'number' ? mag.pricePhysical : 499,
      priceDigital: typeof mag.priceDigital === 'number' ? mag.priceDigital : 0,
      blurPaywall: mag.blurPaywall !== false
    });
  };

  const renderMagazines = () => (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Magazines</h2>
        <button 
          onClick={() => {
            if (isAddingMag) {
              setIsAddingMag(false);
              setEditingMagazineId(null);
              setMagError('');
            } else {
              setIsAddingMag(true);
              setEditingMagazineId(null);
              setMagError('');
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
            }
          }}
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
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => magCoverInputRef.current?.click()}
                    disabled={magLoading || isCoverUploading}
                    className="bg-[#001f3f] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Upload size={14} /> {isCoverUploading ? 'Uploading...' : 'Upload Cover'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !showCoverLibrary;
                      setShowCoverLibrary(next);
                      if (next && coverLibraryItems.length === 0) await loadMagazineLibrary('image');
                    }}
                    disabled={magLoading}
                    className="bg-gray-100 text-[#001f3f] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <FolderOpen size={14} /> Media Library
                  </button>
                  <input
                    ref={magCoverInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleMagazineAssetUpload(file, 'cover');
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">or paste URL below</span>
                </div>
                {showCoverLibrary && (
                  <div className="border border-gray-100 rounded-xl bg-gray-50 p-3 max-h-56 overflow-auto">
                    <input
                      value={coverLibraryQuery}
                      onChange={(e) => setCoverLibraryQuery(e.target.value)}
                      className="w-full mb-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      placeholder="Search cover images..."
                    />
                    {isCoverLibraryLoading ? (
                      <p className="text-xs text-gray-500 font-semibold">Loading images...</p>
                    ) : filteredCoverLibraryItems.length === 0 ? (
                      <p className="text-xs text-gray-500 font-semibold">No image assets in library.</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {filteredCoverLibraryItems.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              setMagForm((prev) => ({ ...prev, coverImage: item.url }));
                              setShowCoverLibrary(false);
                              toast.success('Cover selected from library');
                            }}
                            className="text-left p-2 bg-white border border-gray-100 rounded-lg hover:border-[#800000] transition-colors"
                          >
                            <img src={resolveAssetUrl(item.url)} className="w-full h-20 object-cover rounded mb-1" />
                            <p className="text-[10px] font-bold text-gray-600 truncate">{item.originalName}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <input value={magForm.coverImage} onChange={e => setMagForm({...magForm, coverImage: e.target.value})} className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:ring-0" placeholder="https://example.com/cover.jpg" disabled={magLoading} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">PDF URL *</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => magPdfInputRef.current?.click()}
                    disabled={magLoading || isPdfUploading}
                    className="bg-[#001f3f] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <Upload size={14} /> {isPdfUploading ? 'Uploading...' : 'Upload PDF'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !showPdfLibrary;
                      setShowPdfLibrary(next);
                      if (next && pdfLibraryItems.length === 0) await loadMagazineLibrary('pdf');
                    }}
                    disabled={magLoading}
                    className="bg-gray-100 text-[#001f3f] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                  >
                    <FolderOpen size={14} /> Media Library
                  </button>
                  <input
                    ref={magPdfInputRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) await handleMagazineAssetUpload(file, 'pdf');
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-semibold">or paste URL below</span>
                </div>
                {showPdfLibrary && (
                  <div className="border border-gray-100 rounded-xl bg-gray-50 p-3 max-h-56 overflow-auto space-y-2">
                    <input
                      value={pdfLibraryQuery}
                      onChange={(e) => setPdfLibraryQuery(e.target.value)}
                      className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                      placeholder="Search PDFs..."
                    />
                    {isPdfLibraryLoading ? (
                      <p className="text-xs text-gray-500 font-semibold">Loading PDFs...</p>
                    ) : filteredPdfLibraryItems.length === 0 ? (
                      <p className="text-xs text-gray-500 font-semibold">No PDF assets in library.</p>
                    ) : (
                      filteredPdfLibraryItems.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setMagForm((prev) => ({ ...prev, pdfUrl: item.url }));
                            setShowPdfLibrary(false);
                            toast.success('PDF selected from library');
                          }}
                          className="w-full text-left p-3 bg-white border border-gray-100 rounded-lg hover:border-[#800000] transition-colors"
                        >
                          <p className="text-xs font-bold text-[#001f3f] truncate">{item.originalName}</p>
                          <p className="text-[10px] text-gray-500 truncate mt-1">{resolveAssetUrl(item.url)}</p>
                        </button>
                      ))
                    )}
                  </div>
                )}
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
                      {editingMagazineId ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    editingMagazineId ? 'Save Magazine Issue' : 'Create Magazine Issue'
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
                {(mag.gatedPage ?? 0) > 0 && (
                  <div className="absolute bottom-4 left-4 bg-[#001f3f] text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1.5">
                    <ShieldCheck size={12}/> GATED @ PAGE {mag.gatedPage ?? 0}
                  </div>
                )}
              </div>
              <h3 className="font-bold text-[#0f172a] line-clamp-1">{mag.title}</h3>
              <div className="mt-2">
                <span className={`inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest ${articleStatusClass(mag.status)}`}>
                  {mag.status || 'DRAFT'}
                </span>
              </div>
              <div className="flex justify-between items-center mt-4">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{mag.date}</div>
                <div className="flex gap-1 flex-wrap justify-end">
                  {canWriteContent && (mag.status === 'DRAFT' || mag.status === 'REJECTED') && (
                    <button
                      type="button"
                      title="Submit for review"
                      onClick={() => void submitMagazine(mag.id)}
                      className="p-2 text-amber-700 hover:bg-amber-50 rounded-lg"
                    >
                      <Send size={16} />
                    </button>
                  )}
                  {isMaster && mag.status === 'IN_REVIEW' && (
                    <>
                      <button type="button" onClick={() => void approveMagazine(mag.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg" title="Approve"><Check size={16} /></button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Reason for rejection');
                          if (reason) void rejectMagazine(mag.id, reason);
                        }}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const reason = promptReason('Notes for editor (rework)');
                          if (reason) void reworkMagazine(mag.id, reason);
                        }}
                        className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
                        title="Rework"
                      >
                        <RefreshCw size={16} />
                      </button>
                    </>
                  )}
                  {canWriteContent && (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditMagazine(mag)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button type="button" onClick={() => void deleteMagazine(mag.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete"><Trash2 size={16}/></button>
                    </>
                  )}
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
        <div className="flex items-center gap-2">
          <input
            value={newTickerText}
            onChange={(e) => setNewTickerText(e.target.value)}
            className="w-72 bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm"
            placeholder="Ticker message..."
          />
          <button
            onClick={async () => {
              const text = newTickerText.trim();
              if (!text) {
                toast.error('Ticker message is required');
                return;
              }
              await api.post('/api/ticker', { text });
              setNewTickerText('');
              toast.success('Ticker created');
              loadTicker();
            }}
            className="bg-green-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg"
          >
            <Plus size={18} /> Add Ticker
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[24px] shadow-xl border border-gray-100 overflow-hidden">
        <div className="divide-y divide-gray-50">
          {tickerItems.map(item => (
            <div key={item.id} className="p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${item.active ? 'bg-green-500' : 'bg-gray-300'}`} />
                {editingTickerId === item.id ? (
                  <input
                    value={editingTickerText}
                    onChange={(e) => setEditingTickerText(e.target.value)}
                    className="w-[28rem] bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  />
                ) : (
                  <span className="text-sm font-medium text-[#0f172a]">{item.text}</span>
                )}
              </div>
              <div className="flex gap-2">
                {editingTickerId === item.id ? (
                  <>
                    <button
                      onClick={async () => {
                        const nextText = editingTickerText.trim();
                        if (!nextText) {
                          toast.error('Ticker message is required');
                          return;
                        }
                        await api.put(`/api/ticker/${item.id}`, { text: nextText });
                        setEditingTickerId(null);
                        setEditingTickerText('');
                        toast.success('Ticker updated');
                        loadTicker();
                      }}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Check size={18}/>
                    </button>
                    <button
                      onClick={() => {
                        setEditingTickerId(null);
                        setEditingTickerText('');
                      }}
                      className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                    >
                      <X size={18}/>
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setEditingTickerId(item.id);
                      setEditingTickerText(item.text || '');
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                  >
                    <Edit2 size={18}/>
                  </button>
                )}
                <button 
                  onClick={async () => {
                    await api.put(`/api/ticker/${item.id}`, { active: !item.active });
                    toast.success(item.active ? 'Ticker hidden' : 'Ticker shown');
                    loadTicker();
                  }}
                  className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg"
                >
                  {item.active ? <Eye size={18}/> : <EyeOff size={18}/>}
                </button>
                <button 
                  onClick={async () => {
                    await api.delete(`/api/ticker/${item.id}`);
                    toast.success('Ticker deleted');
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

  const renderMedia = () => {
    const imageItems = mediaItems;
    const pdfItems = pdfMediaItems;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-black text-[#0f172a] serif">Media Library</h2>
          <label className="bg-[#001f3f] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-900 transition-all shadow-lg cursor-pointer">
            <Upload size={20} /> {isUploading ? 'Uploading...' : 'Upload Media'}
            <input
              type="file"
              accept="image/*,application/pdf,audio/*"
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

        <section className="space-y-4">
          <h3 className="text-lg font-black text-[#001f3f]">Images</h3>
          {imageItems.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm font-semibold">
              No images uploaded yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-4 min-w-[1660px] xl:min-w-0">
              {imageItems.map(item => (
                <div key={item.id} className="bg-white p-2 rounded-2xl border border-gray-100 shadow-sm group w-[166px]">
                  <div className="w-[150px] h-[150px] bg-gray-50 rounded-xl overflow-hidden relative mb-2">
                    <img
                      src={resolveAssetUrl(item.url)}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const el = e.currentTarget;
                        el.style.display = 'none';
                        const parent = el.parentElement;
                        if (!parent || parent.querySelector('[data-img-fallback]')) return;
                        const fallback = document.createElement('div');
                        fallback.setAttribute('data-img-fallback', '1');
                        fallback.className = 'absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100';
                        fallback.textContent = 'Missing Image';
                        parent.appendChild(fallback);
                      }}
                    />
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
          )}
          {imageItems.length > 0 && (
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-gray-500 font-semibold">
                Page {mediaPage} of {mediaTotalPages} ({mediaTotalCount} images)
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={mediaPage <= 1}
                  onClick={() => void loadMedia(Math.max(1, mediaPage - 1))}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={mediaPage >= mediaTotalPages}
                  onClick={() => void loadMedia(mediaPage + 1)}
                  className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-[#001f3f]">PDF Files</h3>
          {pdfItems.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-sm font-semibold">
              No PDFs uploaded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pdfItems.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest bg-red-50 text-red-700 px-2 py-1 rounded">PDF</span>
                    <a
                      href={resolveAssetUrl(item.url)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-[#001f3f] hover:text-[#800000]"
                    >
                      Open PDF
                    </a>
                  </div>
                  <p className="text-sm font-bold text-[#0f172a] truncate">{item.originalName}</p>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(resolveAssetUrl(item.url));
                      toast.success('URL Copied');
                    }}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-[#001f3f] py-2 rounded-lg text-xs font-bold"
                  >
                    Copy PDF URL
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    );
  };

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
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Role</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
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
                    <span className="px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-700">
                      {user.role || 'READER'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex w-fit items-center gap-1 ${
                      user.isActive === false ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
                    }`}>
                       {user.isActive === false ? 'INACTIVE' : 'ACTIVE'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-2xl font-black text-[#0f172a] serif">Subscription Requests</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-100 px-4 py-2 rounded-full">
            {filteredSubscriptionRequests.length} matching
          </div>
          <button
            type="button"
            onClick={exportSubscriptionsCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-[#001f3f] text-white px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-black"
          >
            <Download size={14} />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex flex-col gap-4">
        <input
          value={subscriptionSearchQuery}
          onChange={(e) => setSubscriptionSearchQuery(e.target.value)}
          className="w-full md:w-[360px] bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
          placeholder="Search by name, email, or phone..."
        />
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-black uppercase text-gray-400 self-center mr-1">Plan</span>
          {(['ALL', 'DIGITAL', 'PHYSICAL'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setSubscriptionPlanTab(tab)}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                subscriptionPlanTab === tab ? 'bg-[#800000] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab === 'ALL' ? 'All plans' : tab}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[10px] font-black uppercase text-gray-400 self-center mr-1">Status</span>
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSubscriptionStatusFilter(status)}
              className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors ${
                subscriptionStatusFilter === status
                  ? 'bg-[#001f3f] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[24px] border border-gray-100 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Name</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Message</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Proof</th>
                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paginatedSubscriptionRequests.map((request: SubscriptionRequest) => (
                <tr key={request.id} className="hover:bg-[#fafafa] transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-[#0f172a] text-sm">{request.name || 'Anonymous Reader'}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase mt-1 tracking-widest">{request.phone || 'No Phone'}</div>
                  </td>
                  <td className="px-6 py-5 text-gray-500 text-sm">{request.email}</td>
                  <td className="px-6 py-5 text-gray-500 text-xs max-w-[140px]">
                    <span className="line-clamp-2" title={request.message}>
                      {request.message?.trim() ? request.message : '—'}
                    </span>
                    {request.status === 'REJECTED' && request.rejectionReason ? (
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-red-500" title={request.rejectionReason}>
                        Reason: {request.rejectionReason}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${request.accessType === 'PHYSICAL' ? 'bg-blue-100 text-[#001f3f]' : 'bg-green-100 text-green-700'}`}>
                      {request.accessType === 'PHYSICAL' ? 'PRINT' : 'DIGITAL'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex w-fit items-center gap-1 ${
                      request.status === 'APPROVED' ? 'bg-green-50 text-green-700' :
                      request.status === 'REJECTED' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-600'
                    }`}>
                      {request.status === 'PENDING' && <Clock size={10} />}
                      {request.status || 'PENDING'}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    {request.paymentScreenshotUrl ? (
                      <a
                        href={resolveAssetUrl(request.paymentScreenshotUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-[#800000] hover:text-red-900 font-bold text-xs"
                      >
                        <Eye size={14} />
                        <span>View Proof</span>
                      </a>
                    ) : request.accessType === 'DIGITAL' ? (
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Not Required</span>
                    ) : (
                      <span
                        className="text-[10px] text-amber-600 font-bold uppercase cursor-help"
                        title="Print subscriptions require payment proof. Ask the user to re-submit with screenshot."
                      >
                        Missing Receipt
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {request.status === 'PENDING' && (
                        <>
                          <button
                            onClick={() => void handleApproveSubscription(request.id)}
                            disabled={Boolean(subscriptionActionLoading[request.id])}
                            className="bg-green-600 text-white px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-green-700 shadow-md disabled:opacity-60"
                          >
                            {subscriptionActionLoading[request.id] === 'approve' ? 'Approving...' : 'Approve'}
                          </button>
                          <button
                            onClick={() => void handleRejectSubscription(request.id)}
                            disabled={Boolean(subscriptionActionLoading[request.id])}
                            className="bg-gray-100 text-gray-500 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-200 disabled:opacity-60"
                          >
                            {subscriptionActionLoading[request.id] === 'reject' ? 'Rejecting...' : 'Reject'}
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => void handleDeleteSubscription(request.id)}
                        disabled={Boolean(subscriptionActionLoading[request.id])}
                        className="p-2 text-gray-300 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSubscriptionRequests.length > SUBS_PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-6 py-4 bg-gray-50/80">
            <p className="text-xs text-gray-500 font-semibold">
              Page {subscriptionPage} of {Math.max(1, Math.ceil(filteredSubscriptionRequests.length / SUBS_PAGE_SIZE))} (
              {filteredSubscriptionRequests.length} rows)
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={subscriptionPage <= 1}
                onClick={() => setSubscriptionPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={subscriptionPage >= Math.ceil(filteredSubscriptionRequests.length / SUBS_PAGE_SIZE)}
                onClick={() => setSubscriptionPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
      case 'subscriptions': return renderSubscriptions();
      case 'approvals': return isMaster ? renderApprovals() : renderDashboard();
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
