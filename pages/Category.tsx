import React from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router-dom';
import { useApp } from '../AppContext';
import { categoryFromSlug, resolveAssetUrl } from '../utils/app';
import { translateCategory } from '../utils/i18n';

const Category: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { news } = useApp();
  const { t } = useTranslation();

  const categoryName = slug ? categoryFromSlug(slug) : 'Category';
  const translatedCategory = translateCategory(t, categoryName);
  const filteredNews = news.filter((item) => item.category.toLowerCase() === categoryName.toLowerCase());

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between border-b border-gray-100 pb-8 gap-4">
        <div>
          <nav className="flex items-center text-xs font-bold text-gray-400 space-x-2 mb-2 uppercase tracking-widest">
            <Link to="/" className="hover:text-[#800000]">{t('common.home')}</Link>
            <span>/</span>
            <span className="text-[#800000]">{t('category.label')}</span>
          </nav>
          <h1 className="text-4xl md:text-5xl font-bold text-[#001f3f] serif">{translatedCategory}</h1>
        </div>
        <p className="text-gray-500 max-w-md text-sm">
          {t('category.summary', { count: filteredNews.length, category: translatedCategory })}
        </p>
      </div>

      {filteredNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <article key={item.id} className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all group">
              <Link to={`/news/${item.id}`}>
                <div className="relative overflow-hidden h-48">
                  <img src={resolveAssetUrl(item.image)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.title} />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#001f3f] mb-3 leading-tight group-hover:text-[#800000] transition-colors line-clamp-2 serif">
                    {item.title}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">
                    {item.excerpt}
                  </p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-xs font-bold text-gray-400">{item.date}</span>
                    <span className="text-xs font-bold text-[#001f3f]">{t('category.byAuthor', { author: item.author })}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200">
          <h2 className="text-2xl font-bold text-gray-400 serif">{t('category.emptyTitle')}</h2>
          <Link to="/" className="text-[#800000] font-bold mt-4 inline-block hover:underline">{t('category.emptyCta')}</Link>
        </div>
      )}
    </div>
  );
};

export default Category;
