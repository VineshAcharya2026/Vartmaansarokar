import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../AppContext';
import { ChevronLeft, ChevronRight, ArrowRight, BookOpen, TrendingUp, Flame, Globe, Briefcase, Cpu, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { NEWS_CATEGORIES } from '../constants';
import { buildCategorySlug, resolveAssetUrl } from '../utils/app';
import { translateCategory } from '../utils/i18n';

/* ── 4 spotlight categories shown in the 2-col grid ── */
const SPOTLIGHT_CATEGORIES = ['Politics', 'Business', 'Technology', 'Sports'];

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Politics: <Globe size={20} />,
  Business: <Briefcase size={20} />,
  Technology: <Cpu size={20} />,
  Sports: <Dumbbell size={20} />
};

const Home: React.FC = () => {
  const { news, magazines, ads, heroData, batchTranslateNews } = useApp();
  const { t, i18n } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [adSlide, setAdSlide] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const pageRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const autoTranslate = async () => {
      if (['hi', 'gu', 'mr'].includes(i18n.language) && news.length > 0 && !isTranslating) {
        setIsTranslating(true);
        // Translate featured + first few news
        const featuredIds = news.filter(n => n.featured).map(n => n.id);
        const latestIds = news.slice(0, 6).map(n => n.id);
        const allIds = Array.from(new Set([...featuredIds, ...latestIds]));
        try {
          let target = 'hindi';
          if (i18n.language === 'gu') target = 'gujarati';
          if (i18n.language === 'mr') target = 'marathi';
          await batchTranslateNews(allIds, target);
        } catch (e) {
          console.error(e);
        } finally {
          setIsTranslating(false);
        }
      }
    };
    autoTranslate();
  }, [i18n.language, news.length]);

  const featuredNews = news.filter((item) => item.featured);

  /* ── Group articles by category for the 2-col grid ── */
  const categoryArticles = useMemo(() => {
    const map: Record<string, typeof news> = {};
    SPOTLIGHT_CATEGORIES.forEach((cat) => {
      map[cat] = news.filter((n) => n.category === cat).slice(0, 4);
    });
    return map;
  }, [news]);

  /* ── Trending categories (top 6 by article count) ── */
  const trendingCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    news.forEach((n) => { counts[n.category] = (counts[n.category] || 0) + 1; });
    return NEWS_CATEGORIES
      .map((cat) => ({ name: cat, count: counts[cat] || 0 }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [news]);

  // ── Hero auto-slide ──
  useEffect(() => {
    if (featuredNews.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredNews.length);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [featuredNews.length]);

  useEffect(() => {
    if (featuredNews.length === 0) { setCurrentSlide(0); return; }
    if (currentSlide >= featuredNews.length) setCurrentSlide(0);
  }, [currentSlide, featuredNews.length]);

  // ── Ad carousel auto-slide ──
  useEffect(() => {
    if (ads.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setAdSlide((prev) => (prev + 1) % ads.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [ads.length]);

  // ── GSAP reveal ──
  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-reveal]', { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="space-y-14">

      {/* ═══════════════════════════════════════════════════
          SECTION 1 — Hero Carousel
      ═══════════════════════════════════════════════════ */}
      <section data-reveal className="relative h-[400px] md:h-[600px] rounded-2xl overflow-hidden shadow-2xl group bg-[#001f3f]">
        {featuredNews.length > 0 ? (
          <>
            {featuredNews.map((item, index) => (
              <div
                key={item.id}
                className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                  index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10" />
                <img src={resolveAssetUrl(item.image)} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16 z-20">
                  <div className="flex items-center space-x-3 mb-6">
                    <Link
                      to={`/category/${buildCategorySlug(item.category)}`}
                      className="bg-[#800000] text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-widest hover:bg-red-800 transition-colors shadow-lg"
                    >
                      {translateCategory(t, item.category)}
                    </Link>
                    <span className="hidden md:block text-white/60 text-[10px] uppercase font-bold tracking-[0.3em]">{t('home.heroContext')}</span>
                  </div>
                  <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 serif leading-tight max-w-4xl tracking-tight">{item.title}</h2>
                  <p className="text-gray-200 text-xl mb-8 line-clamp-2 max-w-2xl font-light">{item.excerpt}</p>
                  <Link
                    to={`/news/${item.id}`}
                    className="inline-flex bg-white text-[#001f3f] px-10 py-4 rounded-2xl font-bold hover:bg-gray-100 transition-all items-center space-x-3 shadow-xl active:scale-95 group/btn"
                  >
                    <span>{t('home.readFullArticle')}</span>
                    <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            ))}
            {featuredNews.length > 1 && (
              <>
                <button onClick={() => setCurrentSlide((prev) => (prev - 1 + featuredNews.length) % featuredNews.length)} className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft size={24} /></button>
                <button onClick={() => setCurrentSlide((prev) => (prev + 1) % featuredNews.length)} className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-4 rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 hover:bg-white/30 opacity-0 group-hover:opacity-100 transition-all"><ChevronRight size={24} /></button>
              </>
            )}
          </>
        ) : (
          <div className="h-full w-full flex items-center justify-center text-center text-white p-8">
            <div data-reveal className="relative z-10">
              <p className="text-sm tracking-[0.3em] uppercase text-red-200 font-black mb-4">{t('home.featuredCoverage')}</p>
              <h2 className="text-4xl md:text-7xl font-black serif mb-6 tracking-tight leading-tight max-w-4xl">{heroData.headline}</h2>
              <p className="text-white/70 max-w-xl mx-auto text-xl font-medium">{heroData.subtitle}</p>
              <div className="mt-10 flex flex-wrap justify-center gap-4">
                 <Link to="/subscribe" className="bg-[#800000] text-white px-10 py-4 rounded-2xl font-black hover:bg-red-800 transition-all shadow-xl">Join The Movement</Link>
                 <Link to="/about" className="bg-white/10 backdrop-blur text-white border border-white/20 px-10 py-4 rounded-2xl font-black hover:bg-white/20 transition-all">Our Mission</Link>
              </div>
            </div>
            {heroData.bg_image && (
               <div className="absolute inset-0 z-0">
                  <div className="absolute inset-0 bg-black/60 z-10" />
                  <img src={resolveAssetUrl(heroData.bg_image)} className="w-full h-full object-cover" />
               </div>
            )}
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 2 — Ad Banner Carousel
      ═══════════════════════════════════════════════════ */}
      {ads.length > 0 && (
        <section data-reveal className="relative h-[120px] md:h-[160px] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 group">
          {ads.map((ad, idx) => (
            <a
              key={ad.id}
              href={ad.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`absolute inset-0 transition-opacity duration-700 ${idx === adSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
              <img src={resolveAssetUrl(ad.imageUrl)} alt={ad.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
              <div className="absolute bottom-3 left-4 md:bottom-5 md:left-6 z-10">
                <span className="bg-white/90 text-[#001f3f] text-[10px] md:text-xs font-bold px-3 py-1 rounded uppercase tracking-wider">{t('home.sponsored')}</span>
                <p className="text-white text-sm md:text-lg font-bold mt-1 drop-shadow-lg">{ad.title}</p>
              </div>
              {ad.ctaText && (
                <span className="absolute bottom-3 right-4 md:bottom-5 md:right-6 bg-[#800000] text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-red-800 transition-colors z-10">
                  {ad.ctaText}
                </span>
              )}
            </a>
          ))}
          {ads.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
              {ads.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setAdSlide(idx)}
                  className={`w-2 h-2 rounded-full transition-all ${idx === adSlide ? 'bg-white w-5' : 'bg-white/50'}`}
                  aria-label={`Ad ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════
          SECTION 3 — Trending / Upcoming Categories
      ═══════════════════════════════════════════════════ */}
      <section data-reveal>
        <div className="flex items-center mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center">
            <TrendingUp size={22} className="text-[#800000] mr-3" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#001f3f] serif">{t('home.trendingCategories')}</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {trendingCategories.map((item) => (
            <Link
              key={item.name}
              to={`/category/${buildCategorySlug(item.name)}`}
              className="group relative bg-white border border-gray-100 rounded-xl p-5 text-center hover:border-[#800000]/30 hover:shadow-lg transition-all"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[#001f3f]/5 flex items-center justify-center text-[#001f3f] group-hover:bg-[#800000] group-hover:text-white transition-all">
                <Flame size={20} />
              </div>
              <p className="text-sm font-bold text-[#001f3f] group-hover:text-[#800000] transition-colors">{translateCategory(t, item.name)}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{item.count} {t('home.articles')}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 4 — 4 Category Spotlights (2-column grid)
      ═══════════════════════════════════════════════════ */}
      <section data-reveal>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-2 h-10 bg-[#800000] mr-4 rounded-full" />
            <h2 className="text-2xl md:text-3xl font-bold text-[#001f3f] serif">{t('home.categorySpotlight')}</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {SPOTLIGHT_CATEGORIES.map((cat) => {
            const articles = categoryArticles[cat] || [];
            const lead = articles[0];
            const rest = articles.slice(1);

            return (
              <div key={cat} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-xl transition-shadow">
                {/* Category header */}
                <div className="flex items-center justify-between bg-[#001f3f] px-5 py-3">
                  <div className="flex items-center gap-2.5 text-white">
                    <span className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">{CATEGORY_ICONS[cat]}</span>
                    <span className="font-bold text-sm uppercase tracking-wider">{translateCategory(t, cat)}</span>
                  </div>
                  <Link
                    to={`/category/${buildCategorySlug(cat)}`}
                    className="text-white/70 hover:text-white text-xs font-bold flex items-center gap-1 transition-colors"
                  >
                    {t('home.viewAll', { defaultValue: 'View All' })} <ArrowRight size={14} />
                  </Link>
                </div>

                {/* Lead article with image */}
                {lead ? (
                  <Link to={`/news/${lead.id}`} className="block group/lead">
                    <div className="relative h-48 overflow-hidden">
                      <img src={resolveAssetUrl(lead.image)} alt={lead.title} className="w-full h-full object-cover group-hover/lead:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="text-lg font-bold text-white serif leading-snug line-clamp-2 group-hover/lead:text-red-200 transition-colors">{lead.title}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-white/70 text-[10px] font-bold uppercase tracking-wider">{lead.author}</span>
                          <span className="text-white/40">•</span>
                          <span className="text-white/60 text-[10px]">{lead.date}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div className="h-48 flex items-center justify-center bg-gray-50 text-gray-400 text-sm">
                    {t('home.noArticlesInCategory', { defaultValue: 'No articles yet' })}
                  </div>
                )}

                {/* Sub-articles list */}
                <div className="divide-y divide-gray-50">
                  {rest.map((article) => (
                    <Link key={article.id} to={`/news/${article.id}`} className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group/sub">
                      <div className="w-20 h-16 rounded-lg overflow-hidden shrink-0">
                        <img src={resolveAssetUrl(article.image)} alt={article.title} className="w-full h-full object-cover group-hover/sub:scale-110 transition-transform duration-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#001f3f] leading-snug line-clamp-2 group-hover/sub:text-[#800000] transition-colors">{article.title}</h4>
                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-wider">{article.date}</p>
                      </div>
                    </Link>
                  ))}
                </div>

                {/* Footer button */}
                <div className="px-4 py-3 border-t border-gray-100">
                  <Link
                    to={`/category/${buildCategorySlug(cat)}`}
                    className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-50 hover:bg-[#800000] text-[#001f3f] hover:text-white rounded-xl text-sm font-bold transition-all active:scale-[0.98]"
                  >
                    <span>{t('home.moreIn', { defaultValue: 'More in' })} {translateCategory(t, cat)}</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 5 — Latest Articles Grid
      ═══════════════════════════════════════════════════ */}
      <section data-reveal>
        <div className="flex items-center justify-between mb-10 pb-4 border-b border-gray-100">
          <div className="flex items-center">
            <div className="w-2 h-10 bg-[#800000] mr-4 rounded-full" />
            <h2 className="text-3xl md:text-4xl font-bold text-[#001f3f] serif">{t('home.featuredTitle')}</h2>
          </div>
          <Link to="/" className="text-[#800000] font-bold hover:underline flex items-center text-sm group">
            {t('home.allArticles')} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {news.slice(0, 6).map((item) => (
              <article key={item.id} className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-2xl transition-all group border border-gray-100">
                <Link to={`/news/${item.id}`} className="block">
                  <div className="relative overflow-hidden h-56">
                    <img src={resolveAssetUrl(item.image)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={item.title} />
                    <div className="absolute top-4 left-4">
                      <span className="bg-[#001f3f]/80 backdrop-blur-md text-white text-[10px] px-3 py-1.5 rounded-lg uppercase font-bold tracking-wider">
                        {translateCategory(t, item.category)}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-[#001f3f] mb-3 leading-snug group-hover:text-[#800000] transition-colors line-clamp-2 serif tracking-tight">{item.title}</h3>
                    <p className="text-gray-500 text-sm mb-5 line-clamp-3 leading-relaxed">{item.excerpt}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
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
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
            <h3 className="text-2xl font-bold serif text-[#001f3f] mb-3">{t('home.noArticlesTitle')}</h3>
            <p className="text-gray-500">{t('home.noArticlesBody')}</p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════
          SECTION 6 — Magazine Promo
      ═══════════════════════════════════════════════════ */}
      <section data-reveal className="bg-[#001f3f] rounded-2xl p-10 md:p-20 text-white overflow-hidden relative shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#800000]/10 rounded-full blur-[100px] -mr-64 -mt-64" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="inline-block bg-[#800000] text-white text-[11px] px-4 py-1.5 rounded-full mb-8 uppercase tracking-[0.3em] font-bold border border-red-400/30">{t('home.premiumEdition')}</span>
            <h2 className="text-5xl md:text-7xl font-bold mb-8 serif tracking-tight leading-tight">{t('brand.lineOne')} <br /><span className="text-red-400">{t('brand.lineTwo')}</span> Mag</h2>
            <p className="text-gray-300 text-xl mb-10 leading-relaxed max-w-xl font-light">{t('home.magazineIntro')}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-red-400/20 text-red-400 flex items-center justify-center shrink-0"><BookOpen size={20} /></div>
                <span className="text-sm font-medium">{t('home.flipbookFeature')}</span>
              </div>
              <div className="flex items-center space-x-4 p-4 rounded-2xl bg-white/5 border border-white/10">
                <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-400 flex items-center justify-center shrink-0"><ArrowRight size={20} /></div>
                <span className="text-sm font-medium">{t('home.visualEssays')}</span>
              </div>
            </div>
            <Link to="/magazine" className="inline-block bg-[#800000] text-white px-12 py-5 rounded-2xl font-bold hover:bg-red-800 transition-all shadow-2xl shadow-red-900/40 active:scale-95 text-lg">{t('home.exploreIssue')}</Link>
          </div>
          <div className="flex justify-center lg:justify-end">
            {magazines[0] ? (
              <div className="relative group">
                <div className="absolute inset-0 bg-red-900/40 blur-3xl rounded-3xl -rotate-6 scale-90 group-hover:scale-100 transition-transform duration-700" />
                <img src={resolveAssetUrl(magazines[0].coverImage)} className="w-72 md:w-96 rounded-2xl shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative z-10 transform hover:scale-105 transition-transform duration-700 hover:-rotate-2" alt="Latest Magazine" />
                <div className="absolute -bottom-8 -left-8 bg-white text-[#001f3f] p-8 rounded-2xl shadow-2xl z-20 hidden md:block border border-gray-100">
                  <p className="text-[10px] uppercase tracking-[0.2em] font-black text-[#800000] mb-2">{t('home.editorsChoice')}</p>
                  <p className="text-2xl font-bold serif leading-none">{magazines[0].issueNumber}</p>
                </div>
              </div>
            ) : (
              <div className="border border-white/10 rounded-3xl p-12 bg-white/5 text-center max-w-md">
                <p className="text-white/80">{t('home.noMagazine')}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
