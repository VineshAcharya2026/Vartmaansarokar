import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../vartmaan-frontend-app-context';
import { UserRole } from '../vartmaan-shared-types';
import { ArrowLeft, Save, Clock, Upload, FolderOpen, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { resolveAssetUrl } from '../utils/app';

const ArticleEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { staffArticles, addNews, updateNews, submitNews, fetchStaffArticles, currentUser } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isImageLibraryLoading, setIsImageLibraryLoading] = useState(false);
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [libraryImages, setLibraryImages] = useState<Array<{ id: string; url: string; originalName: string }>>([]);
  const [imageLibraryQuery, setImageLibraryQuery] = useState('');
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    excerpt: '',
    content: '',
    image: '',
    author: currentUser?.name || ''
  });

  useEffect(() => {
    if (id) void fetchStaffArticles();
  }, [id, fetchStaffArticles]);

  useEffect(() => {
    if (id && staffArticles.length > 0) {
      const art = staffArticles.find(a => a.id === id);
      if (art) {
        setFormData({
          title: art.title,
          category: art.category,
          excerpt: art.excerpt || '',
          content: art.content,
          image: art.image || '',
          author: art.author || ''
        });
      }
    }
  }, [id, staffArticles]);

  const existingArticle = id ? staffArticles.find((a) => a.id === id) : undefined;
  const articleStatus = existingArticle?.status;
  const canSubmitForReview =
    !!id &&
    (articleStatus === 'DRAFT' || articleStatus === 'REJECTED') &&
    [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser?.role as UserRole);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      if (id) {
        await updateNews(id, formData);
      } else {
        await addNews(formData);
      }
      navigate('/admin');
    } catch (err) {
      toast.error('Failed to save article');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    setIsImageUploading(true);
    try {
      const { data } = await api.post('/api/uploads', formDataUpload);
      const uploadedUrl = (data as { media?: { url?: string } })?.media?.url;
      if (!uploadedUrl) {
        toast.error('Image upload failed');
        return;
      }
      setFormData((prev) => ({ ...prev, image: uploadedUrl }));
      toast.success('Featured image uploaded');
    } catch (_err) {
      toast.error('Image upload failed');
    } finally {
      setIsImageUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleOpenImageLibrary = async () => {
    setShowImageLibrary((prev) => !prev);
    if (libraryImages.length > 0 || showImageLibrary) return;

    setIsImageLibraryLoading(true);
    try {
      const { data } = await api.get('/api/media', { params: { kind: 'image' } });
      const media = (data as { media?: Array<{ id: string; url: string; originalName: string }> })?.media ?? [];
      setLibraryImages(media);
    } catch {
      toast.error('Failed to load media library');
    } finally {
      setIsImageLibraryLoading(false);
    }
  };

  const filteredLibraryImages = libraryImages.filter((item) =>
    item.originalName.toLowerCase().includes(imageLibraryQuery.trim().toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#001f3f] font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex gap-3 flex-wrap justify-end">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-[#001f3f] text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-900 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} /> {loading ? 'Saving...' : 'Save Article'}
          </button>
          {canSubmitForReview && id && (
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                try {
                  await submitNews(id);
                  navigate('/admin');
                } catch {
                  toast.error('Submit failed');
                } finally {
                  setLoading(false);
                }
              }}
              className="bg-amber-600 text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-amber-700 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Send size={20} /> Submit for review
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[32px] shadow-xl border border-gray-100 space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Article Title</label>
              <input 
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 text-xl font-bold text-[#0f172a]" 
                placeholder="Enter a catchy headline..." 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Summary / Excerpt</label>
              <textarea 
                value={formData.excerpt}
                onChange={e => setFormData({...formData, excerpt: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 resize-none h-24 text-gray-600 leading-relaxed" 
                placeholder="Write a brief summary of the story..." 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Body Content</label>
              <textarea 
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
                className="w-full bg-gray-50 p-4 rounded-xl border-transparent focus:border-[#800000] focus:ring-0 resize-none h-[500px] text-gray-800 leading-bold font-medium" 
                placeholder="Start writing the full article here..." 
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[28px] shadow-xl border border-gray-100 space-y-6">
            <h3 className="font-extrabold text-[#001f3f] text-lg border-b border-gray-50 pb-4">Metadata</h3>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
                className="w-full bg-gray-50 p-3 rounded-lg border-transparent focus:ring-0 font-bold text-sm"
              >
                {['General', 'Politics', 'Business', 'Sports', 'Technology', 'Editorial', 'Sanskriti'].map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Author Name</label>
              <input 
                value={formData.author}
                onChange={e => setFormData({...formData, author: e.target.value})}
                className="w-full bg-gray-50 p-3 rounded-lg border-transparent focus:ring-0 font-bold text-sm" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest px-1">Featured Image URL</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  disabled={isImageUploading}
                  className="shrink-0 bg-[#001f3f] text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Upload size={14} /> {isImageUploading ? 'Uploading...' : 'Upload'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleOpenImageLibrary()}
                  className="shrink-0 bg-gray-100 text-[#001f3f] px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5"
                >
                  <FolderOpen size={14} /> Media Library
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <span className="text-[10px] text-gray-400 font-semibold">or paste image URL below</span>
              </div>
              {showImageLibrary && (
                <div className="border border-gray-100 rounded-xl bg-gray-50 p-3 max-h-56 overflow-auto">
                  <input
                    value={imageLibraryQuery}
                    onChange={(e) => setImageLibraryQuery(e.target.value)}
                    className="w-full mb-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs"
                    placeholder="Search image by filename..."
                  />
                  {isImageLibraryLoading ? (
                    <p className="text-xs text-gray-500 font-semibold">Loading images...</p>
                  ) : filteredLibraryImages.length === 0 ? (
                    <p className="text-xs text-gray-500 font-semibold">No uploaded images found.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {filteredLibraryImages.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, image: item.url }));
                            setShowImageLibrary(false);
                            toast.success('Image selected from library');
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
              <input 
                value={formData.image}
                onChange={e => setFormData({...formData, image: e.target.value})}
                className="w-full bg-gray-50 p-3 rounded-lg border-transparent focus:ring-0" 
                placeholder="https://images.unsplash.com/..." 
              />
              {formData.image && (
                <div className="mt-2 aspect-video rounded-xl overflow-hidden shadow-inner border border-gray-100">
                  <img src={resolveAssetUrl(formData.image)} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Invalid+Image+URL')} />
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
               <div className="flex items-center gap-2 text-[#001f3f] font-black text-xs uppercase">
                  <Clock size={14} /> Workflow Info
               </div>
               <p className="text-[10px] text-[#001f3f]/70 font-bold leading-relaxed">
                  {currentUser?.role === UserRole.SUPER_ADMIN && articleStatus !== 'DRAFT' && articleStatus !== 'REJECTED'
                    ? 'Super-admin created articles may be approved immediately. Use Submit for review if you want the normal approval queue.'
                    : 'Editors and admins work in drafts. Use Submit for review when ready; the site only shows articles after an admin or super-admin approves them.'}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
