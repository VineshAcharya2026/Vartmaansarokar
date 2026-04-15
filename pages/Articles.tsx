import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { NEWS_CATEGORIES } from '../constants';
import { buildCategorySlug, resolveAssetUrl } from '../utils/app';
import { translateCategory } from '../utils/i18n';
import { ArrowRight, Filter, Bookmark, Clock, User, Share2 } from 'lucide-react';

const Articles: React.FC = () => {
  const { news } = useApp();
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Filtered news based on selection
  const filteredNews = useMemo(() => {
    if (selectedCategory === 'All') return news;
    return news.filter(n => n.category === selectedCategory);
  }, [news, selectedCategory]);

  // Group news by category for the 'All' view
  const categorizedNews = useMemo(() => {
    const groups: Record<string, typeof news> = {};
    NEWS_CATEGORIES.forEach(cat => {
      const catArticles = news.filter(n => n.category === cat).slice(0, 4);
      if (catArticles.length > 0) groups[cat] = catArticles;
    });
    return groups;
  }, [news]);

  const featuredArticle = news.find(n => n.featured) || news[0];

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      {/* ── Header Section ── */}
      <header className="mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-[#001f3f] serif mb-4 tracking-tight">
              Curated <span className="text-[#800000]">Articles</span>
            </h1>
            <p className="text-gray-600 text-lg font-light leading-relaxed">
              Explore deep-dives, expert opinions, and ground-breaking reports from our editorial desk.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {['All', ...NEWS_CATEGORIES].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300 border ${
                  selectedCategory === cat
                    ? 'bg-[#800000] border-[#800000] text-white shadow-lg'
                    : 'bg-white border-gray-200 text-gray-500 hover:border-[#800000] hover:text-[#800000]'
                }`}
              >
                {cat === 'All' ? 'All Coverage' : translateCategory(t, cat)}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── Featured Hero (Only shown on 'All') ── */}
      {selectedCategory === 'All' && featuredArticle && (
        <section className="mb-20 px-4">
          <Link to={`/news/${featuredArticle.id}`} className="group relative block h-[500px] rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src={resolveAssetUrl(featuredArticle.image)} 
              alt={featuredArticle.title} 
              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
              <span className="inline-block bg-[#800000] text-white text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-[0.2em] mb-4">
                Featured Story
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-white serif mb-4 group-hover:text-red-200 transition-colors leading-tight max-w-4xl">
                {featuredArticle.title}
              </h2>
              <div className="flex items-center gap-6 text-white/70 text-sm font-medium">
                <div className="flex items-center gap-2"><User size={14} /> <span>{featuredArticle.author}</span></div>
                <div className="flex items-center gap-2"><Clock size={14} /> <span>{featuredArticle.date}</span></div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* ── Articles Content ── */}
      <div className="px-4 pb-20">
        {selectedCategory === 'All' ? (
          // GROUPED BY CATEGORY VIEW
          <div className="space-y-24">
            {Object.entries(categorizedNews).map(([category, articles]) => (
              <div key={category} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100/50">
                  <div className="flex items-center gap-4">
                    <div className="w-1.5 h-8 bg-[#800000] rounded-full" />
                    <h2 className="text-3xl font-bold text-[#001f3f] serif uppercase tracking-tight">
                      {translateCategory(t, category)}
                    </h2>
                  </div>
                  <Link 
                    to={`/category/${buildCategorySlug(category)}`}
                    className="text-[#800000] font-bold hover:underline flex items-center gap-2 text-sm group"
                  >
                    View All {category} <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {articles.map((article) => (
                    <ArticleCard key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // SINGLE CATEGORY FILTERED VIEW
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 animate-in fade-in duration-500">
            {filteredNews.map(article => (
              <ArticleCard key={article.id} article={article} />
            ))}
            {filteredNews.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 font-serif text-xl italic">No articles found in this category yet.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

interface ArticleCardProps {
  article: any;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ article }) => {
  return (
    <article className="group bg-white rounded-2xl overflow-hidden border border-gray-100/50 shadow-sm hover:shadow-xl transition-all duration-300">
      <Link to={`/news/${article.id}`} className="block">
        <div className="relative h-56 overflow-hidden">
          <img 
            src={resolveAssetUrl(article.image)} 
            alt={article.title} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute top-4 left-4">
            <span className="bg-white/90 backdrop-blur-sm text-[#001f3f] text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest border border-gray-100 shadow-sm">
              {article.category}
            </span>
          </div>
        </div>
        
        <div className="p-6">
          <h3 className="text-lg font-bold text-[#001f3f] leading-snug mb-3 group-hover:text-[#800000] transition-colors line-clamp-2 serif">
            {article.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 leading-relaxed font-light">
            {article.excerpt}
          </p>
          
          <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={12} className="text-[#800000]" />
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{article.author}</span>
            </div>
            <div className="flex items-center gap-3">
              <button className="text-gray-300 hover:text-[#800000] transition-colors"><Bookmark size={14} /></button>
              <button className="text-gray-300 hover:text-[#800000] transition-colors"><Share2 size={14} /></button>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
};

export default Articles;
