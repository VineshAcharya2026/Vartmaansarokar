
import React, { useState, useEffect } from 'react';
import { useApp } from '../AppContext';
// Added BookOpen to the lucide-react imports
import { ChevronLeft, ChevronRight, ArrowRight, BookOpen } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const { news, magazines } = useApp();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const featuredNews = news.filter(n => n.featured);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % featuredNews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [featuredNews.length]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Hero Slider */}
      <section className="relative h-[400px] md:h-[600px] rounded-3xl overflow-hidden shadow-2xl group">
        {featuredNews.map((item, index) => (
          <div 
            key={item.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
              <div className="flex items-center space-x-3 mb-6">
                <Link 
                  to={`/category/${item.category.toLowerCase().replace(' ', '-')}`}
                  className="bg-[#800000] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest hover:bg-red-800 transition-colors shadow-lg"
                >
                  {item.category}
                </Link>
                <span className="hidden md:block text-white/60 text-[10px] uppercase font-bold tracking-[0.3em]">अतीत से सीख कर उज्जवल भविष्य की ओर</span>
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 serif leading-tight max-w-4xl tracking-tight">
                {item.title}
              </h2>
              <p className="text-gray-200 text-xl mb-8 line-clamp-2 max-w-2xl font-light">
                {item.excerpt}
              </p>
              <Link 
                to={`/news/${item.id}`}
                className="inline-flex bg-white text-[#001f3f] px-10 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all items-center space-x-3 shadow-xl active:scale-95 group/btn"
              >
                <span>READ FULL ARTICLE</span>
                <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        ))}
        
        {/* Slider Controls */}
        <button 
          onClick={() => setCurrentSlide(prev => (prev - 1 + featuredNews.length) % featuredNews.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={() => setCurrentSlide(prev => (prev + 1) % featuredNews.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </section>

      {/* Latest News Grid */}
      <section>
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-2 h-10 bg-[#800000] mr-4 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#001f3f] serif">Featured Articles</h2>
          </div>
          <Link to="/" className="text-[#800000] font-bold hover:underline flex items-center text-sm group">
            All Articles <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {news.slice(0, 6).map(item => (
            <article key={item.id} className="bg-white rounded-3xl shadow-sm overflow-hidden hover:shadow-2xl transition-all group border border-gray-100">
              <Link to={`/news/${item.id}`} className="block">
                <div className="relative overflow-hidden h-56">
                  <img src={item.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                  <div className="absolute top-4 left-4">
                    <span className="bg-[#001f3f]/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-lg uppercase font-bold tracking-wider">
                      {item.category}
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-[#001f3f] mb-4 leading-snug group-hover:text-[#800000] transition-colors line-clamp-2 serif tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-6 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                    <div className="flex items-center space-x-2">
                       <div className="w-6 h-6 rounded-full bg-gray-100 border border-gray-200" />
                       <span className="text-xs font-bold text-[#001f3f]">{item.author}</span>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.date}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* Magazine Spotlight */}
      <section className="bg-[#001f3f] rounded-[40px] p-10 md:p-20 text-white overflow-hidden relative shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#800000]/10 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="inline-block bg-[#800000] text-white text-[11px] px-4 py-1.5 rounded-full mb-8 uppercase tracking-[0.3em] font-bold border border-red-400/30">PREMIUM EDITION</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 serif tracking-tight leading-tight">Vartmaan <br/><span className="text-red-400">Sarokaar</span> Mag</h2>
            <p className="text-gray-300 text-xl mb-10 leading-relaxed max-w-xl font-light">
              Dive deep into the stories that shape our world. Our digital magazine brings you exclusive content, visual photo essays, and long-form analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-red-400/20 text-red-400 flex items-center justify-center shrink-0">
                  <BookOpen size={20} />
                </div>
                <span className="text-sm font-medium">3D Interactive Flipbook</span>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 flex items-center justify-center shrink-0">
                  <ArrowRight size={20} />
                </div>
                <span className="text-sm font-medium">High-Res Visual Essays</span>
              </div>
            </div>
            <Link to="/magazine" className="inline-block bg-[#800000] text-white px-12 py-5 rounded-2xl font-bold hover:bg-red-800 transition-all shadow-2xl shadow-red-900/40 active:scale-95 text-lg">
              Explore Current Issue
            </Link>
          </div>
          <div className="flex justify-center lg:justify-end">
            <div className="relative group">
              <div className="absolute inset-0 bg-red-900/40 blur-3xl rounded-3xl -rotate-6 scale-90 group-hover:scale-100 transition-transform duration-700" />
              <img 
                src={magazines[0]?.coverImage} 
                className="w-72 md:w-96 rounded-3xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 transform hover:scale-105 transition-transform duration-700 hover:-rotate-2" 
                alt="Latest Magazine" 
              />
              <div className="absolute -bottom-8 -left-8 bg-white text-[#001f3f] p-8 rounded-3xl shadow-2xl z-20 hidden md:block border border-gray-100">
                <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#800000] mb-2">Editor's Choice</p>
                <p className="text-2xl font-bold serif leading-none">{magazines[0]?.issueNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
