import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../AppContext';
import Flipbook from '../components/Flipbook';
import SubscriptionWall from '../components/SubscriptionWall';
import { BookOpen, Newspaper, Star } from 'lucide-react';
import gsap from 'gsap';
import { formatCurrencyINR, resolveAssetUrl } from '../utils/app';

const Magazine: React.FC = () => {
  const { magazines } = useApp();
  const { t } = useTranslation();
  const [selectedMagId, setSelectedMagId] = useState<string | null>(null);
  const [showSubscriptionWall, setShowSubscriptionWall] = useState(false);
  const [selectedAccessType, setSelectedAccessType] = useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const pageRef = useRef<HTMLDivElement | null>(null);

  const selectedMag = magazines.find((item) => item.id === selectedMagId) ?? magazines[0] ?? null;

  useEffect(() => {
    if (!selectedMagId && magazines[0]) {
      setSelectedMagId(magazines[0].id);
      return;
    }

    if (selectedMagId && !magazines.some((item) => item.id === selectedMagId)) {
      setSelectedMagId(magazines[0]?.id ?? null);
    }
  }, [magazines, selectedMagId]);

  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-magazine-reveal]', { opacity: 0, y: 32 }, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out' });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  if (!selectedMag) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
        <h1 className="text-4xl font-bold text-[#001f3f] serif mb-4">{t('magazine.title')}</h1>
        <p className="text-gray-600">{t('magazine.emptyBody')}</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-12">
      <div data-magazine-reveal className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-[#001f3f] serif">{t('magazine.title')}</h1>
        <p className="text-gray-600 text-lg">{t('magazine.subtitle')}</p>
      </div>

      <section data-magazine-reveal className="bg-white p-6 md:p-12 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div>
            <span className="text-[#800000] font-bold text-sm uppercase tracking-widest">{selectedMag.issueNumber} {t('magazine.edition')}</span>
            <h2 className="text-3xl font-bold text-[#001f3f] serif mt-1">{selectedMag.title}</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className={`px-4 py-2 rounded-full text-xs font-bold ${selectedMag.isFree ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
              {t('magazine.digitalPrice').toUpperCase()}: {selectedMag.isFree ? t('subscription.free') : formatCurrencyINR(selectedMag.priceDigital)}
            </span>
            <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
              {t('magazine.physicalPrice').toUpperCase()}: {formatCurrencyINR(selectedMag.pricePhysical)}
            </span>
          </div>
        </div>

        <Flipbook magazine={selectedMag} />

        <div className="mt-12 flex flex-wrap justify-center gap-8">
          <div className="flex items-center space-x-3 text-gray-500">
            <BookOpen size={24} className="text-[#800000]" />
            <span className="text-sm">{t('magazine.highResolution')}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <Newspaper size={24} className="text-[#800000]" />
            <span className="text-sm">{t('magazine.editorialDepth')}</span>
          </div>
          <div className="flex items-center space-x-3 text-gray-500">
            <Star size={24} className="text-[#800000]" />
            <span className="text-sm">{t('magazine.premiumAccess')}</span>
          </div>
        </div>
      </section>

      <section data-magazine-reveal>
        <h3 className="text-2xl font-bold text-[#001f3f] serif mb-8">{t('magazine.previousIssues')}</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {magazines.map((mag) => (
            <button
              key={mag.id}
              onClick={() => setSelectedMagId(mag.id)}
              className={`group cursor-pointer text-left transition-all ${selectedMag.id === mag.id ? 'ring-2 ring-[#800000] p-1 rounded-xl' : ''}`}
            >
              <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-3">
                <img src={resolveAssetUrl(mag.coverImage)} alt={mag.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <BookOpen className="text-white" size={32} />
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#001f3f] line-clamp-1">{mag.title}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{mag.issueNumber}</p>
            </button>
          ))}
        </div>
      </section>

      <section data-magazine-reveal className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#800000] text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 serif">{t('magazine.digitalSubscription')}</h3>
            <p className="text-red-100 mb-6">{t('magazine.digitalSubscriptionBody')}</p>
            <div className="flex items-baseline space-x-2 mb-8">
              <span className="text-4xl font-bold">{selectedMag.isFree ? t('subscription.free') : formatCurrencyINR(selectedMag.priceDigital)}</span>
              {!selectedMag.isFree && <span className="text-red-200">{t('magazine.perIssue')}</span>}
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAccessType('DIGITAL');
                setShowSubscriptionWall(true);
              }}
              className="w-full bg-white text-[#800000] py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors"
            >
              {t('magazine.claimDigitalAccess')}
            </button>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
            <BookOpen size={160} />
          </div>
        </div>

        <div className="bg-white border-2 border-[#001f3f] p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 text-[#001f3f] serif">{t('magazine.physicalSubscription')}</h3>
            <p className="text-gray-500 mb-6">{t('magazine.physicalSubscriptionBody')}</p>
            <div className="flex items-baseline space-x-2 mb-8 text-[#001f3f]">
              <span className="text-4xl font-bold">{formatCurrencyINR(selectedMag.pricePhysical)}</span>
              <span className="text-gray-400 font-normal">{t('magazine.perIssue')}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedAccessType('PHYSICAL');
                setShowSubscriptionWall(true);
              }}
              className="w-full bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors"
            >
              {t('magazine.subscribePrint')}
            </button>
          </div>
        </div>
      </section>
      <SubscriptionWall
        isOpen={showSubscriptionWall}
        onClose={() => setShowSubscriptionWall(false)}
        onAccessGranted={() => setShowSubscriptionWall(false)}
        resourceId={selectedMag?.id ?? 'magazine-access'}
        resourceTitle={selectedMag?.title ?? t('magazine.title')}
        resourceType="MAGAZINE"
        digitalPrice={selectedMag?.priceDigital ?? 0}
        physicalPrice={selectedMag?.pricePhysical ?? 0}
        digitalLabel={t('magazine.digitalLabel')}
      />
    </div>
  );
};

export default Magazine;
