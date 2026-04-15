import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ArrowLeft, Save, Trash2, Image as ImageIcon, CheckCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const ArticleEditor: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { staffArticles, addNews, updateNews, currentUser } = useApp();
  
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    excerpt: '',
    content: '',
    image: '',
    author: currentUser?.name || ''
  });

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

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => navigate('/admin')}
          className="flex items-center gap-2 text-gray-500 hover:text-[#001f3f] font-bold text-sm transition-colors"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>
        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={loading}
            className="bg-[#001f3f] text-white px-8 py-3 rounded-2xl font-black shadow-xl hover:bg-blue-900 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={20} /> {loading ? 'Saving...' : 'Save Article'}
          </button>
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
              <input 
                value={formData.image}
                onChange={e => setFormData({...formData, image: e.target.value})}
                className="w-full bg-gray-50 p-3 rounded-lg border-transparent focus:ring-0" 
                placeholder="https://images.unsplash.com/..." 
              />
              {formData.image && (
                <div className="mt-2 aspect-video rounded-xl overflow-hidden shadow-inner border border-gray-100">
                  <img src={formData.image} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = 'https://via.placeholder.com/400x225?text=Invalid+Image+URL')} />
                </div>
              )}
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-2">
               <div className="flex items-center gap-2 text-[#001f3f] font-black text-xs uppercase">
                  <Clock size={14} /> Workflow Info
               </div>
               <p className="text-[10px] text-[#001f3f]/70 font-bold leading-relaxed">
                  {currentUser?.role === 'EDITOR' 
                    ? 'Submitting this will send the article to the PENDING REVIEW queue. An admin must approve it before publication.'
                    : 'As an ADMIN, saving this will update the article or publish it directly if active.'}
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleEditor;
