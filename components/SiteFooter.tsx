import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { APP_BASE } from '../utils/app';
import { NEWS_CATEGORIES } from '../constants';
import { buildCategorySlug } from '../utils/app';
import { translateCategory } from '../utils/i18n';
const SiteFooter: React.FC = () => {
  const { t } = useTranslation();
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterError, setNewsletterError] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState('');

  return (
    <footer className="bg-gradient-to-br from-[#001f3f] via-[#0a274d] to-[#101f32] text-white pt-20 pb-10 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr,1fr,1fr,1fr] gap-12 mb-14">
          <div className="space-y-6">
            <Link to="/" className="inline-flex items-center gap-4">
              <img src={`${APP_BASE}logo.png`} alt="Vartmaan Sarokar logo" className="w-16 h-16 bg-white/10 p-1 object-contain" />
              <div>
                <h2 className="text-2xl font-black tracking-[0.2em] uppercase">{t('brand.lineOne')}</h2>
                <h2 className="text-2xl font-black tracking-[0.2em] uppercase text-red-400">{t('brand.lineTwo')}</h2>
              </div>
            </Link>
            <p className="text-gray-300 text-sm leading-relaxed max-w-md">{t('footer.description')}</p>
            <div className="flex gap-3">
              <Link to="/magazine" className="px-5 py-3 rounded-lg bg-[#800000] hover:bg-red-800 font-bold text-sm transition-colors">{t('common.readMagazine')}</Link>
              <Link to="/about" className="px-5 py-3 rounded-lg border border-white/15 hover:bg-white/5 font-bold text-sm transition-colors">{t('footer.aboutLink')}</Link>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 serif text-white">{t('footer.exploreTitle')}</h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              <li><Link to="/about" className="hover:text-white">{t('common.aboutUs')}</Link></li>
              <li><Link to="/magazine" className="hover:text-white">{t('common.digitalMagazine')}</Link></li>
              <li><Link to="/gallery" className="hover:text-white">{t('common.mediaGallery')}</Link></li>
              <li><Link to="/advertisers" className="hover:text-white">{t('footer.partnerWithUs')}</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 serif text-white">{t('footer.topSectionsTitle')}</h3>
            <ul className="space-y-3 text-gray-300 text-sm">
              {NEWS_CATEGORIES.slice(0, 5).map((cat) => (
                <li key={cat}>
                  <Link to={`/category/${buildCategorySlug(cat)}`} className="hover:text-white">{translateCategory(t, cat)}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-bold mb-6 serif text-white">{t('footer.newsletterTitle')}</h3>
            <p className="text-sm text-gray-300 mb-4">{t('footer.newsletterDescription')}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setNewsletterError('');
                setNewsletterSuccess('');

                if (!newsletterEmail.trim()) {
                  setNewsletterError(t('footer.newsletterErrorEmpty'));
                  return;
                }

                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail.trim())) {
                  setNewsletterError(t('footer.newsletterErrorInvalid'));
                  return;
                }

                setNewsletterSuccess(t('footer.newsletterSuccess'));
                setNewsletterEmail('');
              }}
              className="space-y-3"
            >
              <input
                type="email"
                value={newsletterEmail}
                onChange={(event) => setNewsletterEmail(event.target.value)}
                placeholder={t('common.emailAddress')}
                className="w-full rounded-lg bg-white/10 border border-white/10 px-4 py-3 text-sm placeholder:text-gray-400 text-white"
              />
              <button type="submit" className="w-full rounded-lg bg-white text-[#001f3f] py-3 font-bold text-sm hover:bg-gray-100 transition-colors">
                {t('common.subscribe')}
              </button>
              {newsletterError && <p className="text-sm text-red-200">{newsletterError}</p>}
              {newsletterSuccess && !newsletterError && <p className="text-sm text-green-200">{newsletterSuccess}</p>}
            </form>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-3 md:items-center md:justify-between text-xs uppercase tracking-[0.25em] text-gray-400">
          <p>{t('footer.copyright')}</p>
          <div className="flex gap-4">
            <span>{t('footer.tagline')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
