import React, { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowUpRight, BookOpen, Megaphone, Newspaper, Send } from 'lucide-react';
import { useApp } from '../AppContext';
import { translateAdDescription, translateAdTitle } from '../utils/i18n';
import { resolveAssetUrl } from '../utils/app';

const Sidebar: React.FC = () => {
  const { ads, news, magazines } = useApp();
  const { t } = useTranslation();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const featuredAd = ads[0];
  const secondaryAds = ads.slice(1, 3);

  useLayoutEffect(() => {
    if (!sidebarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-sidebar-card]', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: 'power2.out' });
    }, sidebarRef);

    return () => ctx.revert();
  }, [ads.length]);

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div ref={sidebarRef} className="sticky top-36 space-y-6">
        {featuredAd && (
          <div data-sidebar-card className="overflow-hidden rounded-[26px] shadow-[0_22px_50px_-34px_rgba(0,31,63,0.45)]">
            <div className="relative isolate overflow-hidden rounded-[26px] border border-[#001f3f]/10 bg-gradient-to-br from-[#17395b] via-[#001f3f] to-[#800000] p-6 text-white">
              <img src={resolveAssetUrl(featuredAd.imageUrl)} alt={featuredAd.title} className="absolute inset-0 h-full w-full object-cover opacity-15" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent_42%)]" />
              <div className="relative">
                <span className="inline-flex rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-white/90">
                  {t('sidebar.sponsored')}
                </span>
                <h3 className="mt-5 text-xl font-bold leading-tight text-white">
                  {translateAdTitle(t, featuredAd.title)}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  {translateAdDescription(t, featuredAd.title, t('ads.fallbackDescription'))}
                </p>
                <a
                  href={featuredAd.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-[#001f3f] transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <span>{t('sidebar.learnMore')}</span>
                  <ArrowUpRight size={16} />
                </a>
              </div>
            </div>
          </div>
        )}

        <Link
          to="/advertisers"
          data-sidebar-card
          className="block rounded-[24px] border-2 border-dashed border-[#001f3f]/12 bg-[#faf7f2] p-5 text-center transition-all duration-300 hover:-translate-y-0.5 hover:border-[#001f3f]/25 hover:bg-white"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#001f3f]/8 text-[#001f3f]">
            <Megaphone size={28} />
          </div>
          <h4 className="mt-4 text-base font-bold text-[#001f3f]">{t('footer.partnerWithUs')}</h4>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">{t('routes.advertisers.body')}</p>
          <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#001f3f] px-4 py-2.5 text-xs font-bold uppercase tracking-[0.18em] text-white">
            <span>{t('sidebar.learnMore')}</span>
            <ArrowUpRight size={14} />
          </span>
        </Link>

        <div data-sidebar-card className="grid grid-cols-2 gap-3">
          <div className="rounded-[20px] border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#001f3f]/8 text-[#001f3f]">
              <Newspaper size={20} />
            </div>
            <p className="mt-3 text-lg font-bold text-[#001f3f]">{news.length}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{t('admin.newsArticles')}</p>
          </div>
          <div className="rounded-[20px] border border-gray-200 bg-white p-4 text-center shadow-sm">
            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#800000]/8 text-[#800000]">
              <BookOpen size={20} />
            </div>
            <p className="mt-3 text-lg font-bold text-[#800000]">{magazines.length}</p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400">{t('admin.activeIssues')}</p>
          </div>
        </div>

        {secondaryAds.map((ad) => (
          <a
            key={ad.id}
            data-sidebar-card
            href={ad.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-[22px] border border-transparent bg-white p-4 shadow-sm transition-all duration-300 hover:translate-x-1 hover:border-[#001f3f]/12 hover:bg-[#f8f8f8]"
          >
            <div className="flex gap-3">
              <img src={resolveAssetUrl(ad.imageUrl)} alt={ad.title} className="h-20 w-20 shrink-0 rounded-2xl object-cover" />
              <div className="min-w-0">
                <span className="inline-flex rounded-full bg-[#001f3f]/6 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-[#001f3f]">
                  {t('sidebar.sponsored')}
                </span>
                <h4 className="mt-3 text-sm font-bold text-[#001f3f]">{translateAdTitle(t, ad.title)}</h4>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  {translateAdDescription(t, ad.title, t('ads.fallbackDescription'))}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#800000]">
                  <span>{t('sidebar.learnMore')}</span>
                  <ArrowUpRight size={14} className="transition-transform duration-300 group-hover:translate-x-0.5" />
                </span>
              </div>
            </div>
          </a>
        ))}

        <div data-sidebar-card className="rounded-[24px] border border-[#001f3f]/10 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#001f3f]/8 text-[#001f3f]">
              <Send size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#001f3f]">{t('common.newsletter')}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">{t('sidebar.newsletterBody')}</p>
            </div>
          </div>
          <input
            type="email"
            placeholder={t('sidebar.yourEmail')}
            className="mt-4 w-full rounded-xl border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
          />
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#001f3f] py-3 text-sm font-bold text-white transition-colors hover:bg-[#0b2c52]">
            <span>{t('sidebar.subscribeNow')}</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
