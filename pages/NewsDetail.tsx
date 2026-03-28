
import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ArrowLeft, Calendar, User, Share2, Bookmark } from 'lucide-react';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { news } = useApp();
  
  const article = news.find(n => n.id === id);
  const relatedStories = news
    .filter(n => n.category === article?.category && n.id !== article?.id)
    .slice(0, 3);

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#001f3f] serif">Article Not Found</h2>
        <Link to="/" className="text-[#800000] hover:underline mt-4 inline-block">Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/" className="flex items-center text-gray-500 hover:text-[#800000] transition-colors font-bold text-sm">
        <ArrowLeft size={16} className="mr-2" />
        BACK TO NEWSFEED
      </Link>

      <header className="space-y-6">
        <span className="inline-block bg-[#800000] text-white text-[10px] px-3 py-1 rounded uppercase font-bold tracking-widest">
          {article.category}
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-[#001f3f] serif leading-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              <img src={`https://ui-avatars.com/api/?name=${article.author}&background=random`} alt={article.author} />
            </div>
            <div>
              <p className="text-sm font-bold text-[#001f3f] uppercase tracking-wide">By {article.author}</p>
              <div className="flex items-center text-gray-400 text-xs space-x-3 mt-1">
                <span className="flex items-center"><Calendar size={12} className="mr-1" /> {article.date}</span>
                <span className="flex items-center">8 min read</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Share2 size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Bookmark size={20} /></button>
          </div>
        </div>
      </header>

      <div className="aspect-video rounded-3xl overflow-hidden shadow-2xl">
        <img src={article.image} className="w-full h-full object-cover" alt={article.title} />
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
        <p className="font-semibold text-xl text-gray-900 italic border-l-4 border-[#800000] pl-6">
          {article.excerpt}
        </p>
        <p>{article.content}</p>
        <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
        <h3 className="text-2xl font-bold text-[#001f3f] serif">The Broader Impact</h3>
        <p>Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</p>
      </div>

      {relatedStories.length > 0 && (
        <section className="pt-12 border-t border-gray-100">
          <h3 className="text-2xl font-bold text-[#001f3f] serif mb-8">Related Stories</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedStories.map(story => (
              <Link key={story.id} to={`/news/${story.id}`} className="group block">
                <div className="aspect-video rounded-xl overflow-hidden mb-3">
                  <img src={story.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={story.title} />
                </div>
                <h4 className="font-bold text-[#001f3f] serif group-hover:text-[#800000] transition-colors line-clamp-2">
                  {story.title}
                </h4>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default NewsDetail;
