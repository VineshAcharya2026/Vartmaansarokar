import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ArrowLeft, Calendar, Share2, Bookmark, Lock } from 'lucide-react';
import { UserRole } from '../types';
import SubscriptionWall from '../components/SubscriptionWall';
import { translateCategory } from '../utils/i18n';
import { resolveAssetUrl } from '../utils/app';

const NewsDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { news, currentUser, translateNewsContent } = useApp();
  const { t, i18n } = useTranslation();
  const [showSubscriptionWall, setShowSubscriptionWall] = React.useState(false);
  const [isTranslating, setIsTranslating] = React.useState(false);

  const article = news.find((n) => n.id === id);
  const relatedArticles = news.filter((n) => n.category === article?.category && n.id !== article?.id).slice(0, 3);

  React.useEffect(() => {
    const autoTranslate = async () => {
      if (!article || isTranslating) return;
      // If language is Gujarati or Marathi, and the content doesn't seem to be in that language yet
      // (Simplified check: if it's not 'en' or 'hi' and we want it to be 'gu' or 'mr')
      if (['gu', 'mr'].includes(i18n.language)) {
        setIsTranslating(true);
        try {
          await translateNewsContent(article.id, i18n.language === 'gu' ? 'gujarati' : 'marathi');
        } catch (e) {
          console.error(e);
        } finally {
          setIsTranslating(false);
        }
      }
    };
    autoTranslate();
  }, [i18n.language, id, article?.id]);

  const hasSubscriptionAccess =
    currentUser?.role === UserRole.EDITOR ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN ||
    currentUser?.subscription_status === 'ACTIVE' ||
    currentUser?.subscription?.status === 'ACTIVE';
  const canReadFullArticle = article ? !article.requiresSubscription || hasSubscriptionAccess : false;

  if (!article) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-[#001f3f] serif">{t('newsDetail.notFoundTitle')}</h2>
        <Link to="/" className="text-[#800000] hover:underline mt-4 inline-block">{t('newsDetail.backToHome')}</Link>
      </div>
    );
  }

  return (
    <div className="page-enter max-w-4xl mx-auto space-y-8">
      <Link to="/" className="flex items-center text-gray-500 hover:text-[#800000] transition-colors font-bold text-sm">
        <ArrowLeft size={16} className="mr-2" />
        {t('newsDetail.backToFeed').toUpperCase()}
      </Link>

      <header className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-block bg-[#800000] text-white text-[10px] px-3 py-1 rounded uppercase font-bold tracking-widest">
            {translateCategory(t, article.category)}
          </span>
          {article.requiresSubscription && (
            <span className="inline-flex items-center gap-2 bg-[#001f3f] text-white text-[10px] px-3 py-1 rounded uppercase font-bold tracking-widest">
              <Lock size={12} />
              {t('newsDetail.subscriberArticle', 'Subscriber Article')}
            </span>
          )}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[#001f3f] serif leading-tight">
          {article.title}
        </h1>
        <div className="flex flex-wrap items-center justify-between gap-4 py-6 border-y border-gray-100">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(article.author)}&background=1a2744&color=fff&size=128`}
                alt={article.author}
              />
            </div>
            <div>
              <p className="text-sm font-bold text-[#001f3f] uppercase tracking-wide">{t('newsDetail.byAuthor', { author: article.author })}</p>
              <div className="flex items-center text-gray-400 text-xs space-x-3 mt-1">
                <span className="flex items-center"><Calendar size={12} className="mr-1" /> {article.date}</span>
                <span className="flex items-center">{t('newsDetail.minRead', { count: 8 })}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Share2 size={20} /></button>
            <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Bookmark size={20} /></button>
          </div>
        </div>
      </header>

      <div className="aspect-video rounded-2xl overflow-hidden shadow-2xl">
        <img src={resolveAssetUrl(article.image)} className="w-full h-full object-cover" alt={article.title} />
      </div>

      <div className="prose prose-lg max-w-none text-gray-700 leading-relaxed space-y-6">
        <p className="font-semibold text-xl text-gray-900 italic border-l-4 border-[#800000] pl-6">
          {article.excerpt}
        </p>
        {canReadFullArticle ? (
          <>
            <p>{article.content}</p>
            <p>{t('newsDetail.sampleParagraphOne')}</p>
            <h3 className="text-2xl font-bold text-[#001f3f] serif">{t('newsDetail.broaderImpact')}</h3>
            <p>{t('newsDetail.sampleParagraphTwo')}</p>
          </>
        ) : (
          <div className="rounded-[24px] border border-red-100 bg-gradient-to-br from-[#fff7f7] to-white p-8 not-prose">
            <div className="flex items-center gap-3 mb-4 text-[#800000]">
              <Lock size={20} />
              <span className="text-xs font-black uppercase tracking-[0.28em]">{t('newsDetail.lockedBadge')}</span>
            </div>
            <h3 className="text-2xl font-black text-[#001f3f] serif mb-3">{t('newsDetail.lockedTitle')}</h3>
            <p className="text-gray-600 leading-relaxed mb-6">{t('newsDetail.lockedBody')}</p>
            <button
              onClick={() => setShowSubscriptionWall(true)}
              className="inline-flex bg-[#800000] text-white px-6 py-3 rounded-lg font-bold hover:bg-red-800 transition-colors"
            >
              {t('newsDetail.openSubscriptionForm')}
            </button>
          </div>
        )}
      </div>

      {/* Removed related articles as requested */}

      <SubscriptionWall
        isOpen={showSubscriptionWall}
        onClose={() => setShowSubscriptionWall(false)}
        resourceTitle={article.title}
      />
    </div>
  );
};

export default NewsDetail;
