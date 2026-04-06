import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Maximize2, ZoomIn } from 'lucide-react';
import gsap from 'gsap';
import { MagazineIssue, UserRole } from '../types';
import { useApp } from '../AppContext';
import { APP_BASE, resolveAssetUrl } from '../utils/app';
import SubscriptionWall from './SubscriptionWall';

interface FlipbookProps {
  magazine: MagazineIssue;
}

const Flipbook: React.FC<FlipbookProps> = ({ magazine }) => {
  const { currentUser } = useApp();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const nextLeafRef = useRef<HTMLDivElement | null>(null);
  const prevLeafRef = useRef<HTMLDivElement | null>(null);
  const mobilePageRef = useRef<HTMLDivElement | null>(null);
  const progressRef = useRef<HTMLDivElement | null>(null);
  const pageFlipAudioRef = useRef<HTMLAudioElement | null>(null);

  const gatedPage = magazine.gatedPage ?? 2;
  const hasSubscriptionAccess =
    currentUser?.role === UserRole.MAGAZINE ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN ||
    currentUser?.subscription?.status === 'ACTIVE';
  const isAccessAllowed = hasSubscriptionAccess || magazine.isFree;
  const progressWidth = useMemo(() => `${((currentPage + 1) / Math.max(magazine.pages.length, 1)) * 100}%`, [currentPage, magazine.pages.length]);

  useEffect(() => {
    setCurrentPage(0);
    setDirection(null);
    setIsFlipping(false);
    setShowSubscriptionModal(false);
  }, [magazine.id]);

  useEffect(() => {
    pageFlipAudioRef.current = new Audio(`${APP_BASE}${encodeURIComponent('10. Page Flipping.mp3')}`);
    pageFlipAudioRef.current.volume = 0.45;

    return () => {
      if (pageFlipAudioRef.current) {
        pageFlipAudioRef.current.pause();
        pageFlipAudioRef.current = null;
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!wrapperRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-flip-reveal]', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65, stagger: 0.06, ease: 'power3.out' });
    }, wrapperRef);
    return () => ctx.revert();
  }, [magazine.id]);

  useEffect(() => {
    if (!progressRef.current) return;
    gsap.to(progressRef.current, { width: progressWidth, duration: 0.55, ease: 'power2.out' });
  }, [progressWidth]);

  const animateMobilePage = (delta: number) => {
    if (!mobilePageRef.current) {
      setCurrentPage((prev) => prev + delta);
      setIsFlipping(false);
      setDirection(null);
      return;
    }

    const target = mobilePageRef.current;
    const timeline = gsap.timeline({
      onComplete: () => {
        setCurrentPage((prev) => prev + delta);
        gsap.set(target, { clearProps: 'all' });
        setIsFlipping(false);
        setDirection(null);
      }
    });

    timeline.to(target, {
      opacity: 0,
      scale: 1.05,
      x: delta > 0 ? 24 : -24,
      filter: 'blur(10px)',
      duration: 0.28,
      ease: 'power2.in'
    });
  };

  const animateDesktopLeaf = (leaf: HTMLDivElement | null, rotation: number, delta: number) => {
    if (!leaf) {
      setCurrentPage((prev) => prev + delta);
      setIsFlipping(false);
      setDirection(null);
      return;
    }

    gsap.set(leaf, { display: 'block', opacity: 1, rotateY: 0 });
    gsap.to(leaf, {
      rotateY: rotation,
      duration: 0.75,
      ease: 'power3.inOut',
      onComplete: () => {
        gsap.set(leaf, { clearProps: 'all' });
        setCurrentPage((prev) => prev + delta);
        setIsFlipping(false);
        setDirection(null);
      }
    });
  };

  const handleTurn = (nextDirection: 'next' | 'prev') => {
    if (isFlipping || magazine.pages.length <= 1) return;
    if (nextDirection === 'next' && currentPage >= magazine.pages.length - 1) return;
    if (nextDirection === 'prev' && currentPage <= 0) return;

    if (nextDirection === 'next') {
      const targetPageNumber = currentPage + 2;
      if (!isAccessAllowed && targetPageNumber > gatedPage) {
        setShowSubscriptionModal(true);
        return;
      }
    }

    if (pageFlipAudioRef.current) {
      pageFlipAudioRef.current.currentTime = 0;
      void pageFlipAudioRef.current.play().catch(() => {});
    }

    setDirection(nextDirection);
    setIsFlipping(true);

    const isDesktop = window.matchMedia('(min-width: 768px)').matches;
    if (isDesktop) {
      animateDesktopLeaf(nextDirection === 'next' ? nextLeafRef.current : prevLeafRef.current, nextDirection === 'next' ? -180 : 180, nextDirection === 'next' ? 1 : -1);
    } else {
      animateMobilePage(nextDirection === 'next' ? 1 : -1);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-5xl mx-auto flex flex-col items-center py-10">
      <div
        data-flip-reveal
        className={`relative w-full aspect-[4/5] md:aspect-[3/2] rounded-r-xl overflow-visible flip-container ${isFlipping ? 'scale-[1.01]' : 'scale-100'}`}
        style={{ perspective: '3000px' }}
      >
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-xl flex shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5),0_18px_36px_-18px_rgba(0,0,0,0.5)]">
          <div className="w-1/2 h-full bg-[#111] rounded-l-xl border-r border-white/5 shadow-[inset_-15px_0_30px_rgba(0,0,0,0.8)]" />
          <div className="w-1/2 h-full bg-[#111] rounded-r-xl shadow-[inset_15px_0_30px_rgba(0,0,0,0.8)]" />
        </div>

        <div className="hidden md:flex h-full w-full relative transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
          <div className="w-1/2 h-full bg-white relative overflow-hidden rounded-l-sm">
            {currentPage > 0 && <img src={resolveAssetUrl(magazine.pages[currentPage - 1])} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage - 1 >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="left-page" />}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none" />
          </div>

          <div className="w-1/2 h-full bg-white relative overflow-hidden border-l border-black/10 rounded-r-sm">
            <img src={resolveAssetUrl(magazine.pages[currentPage])} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="right-page" />
            <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none" />
          </div>

          <div ref={nextLeafRef} className="absolute top-0 right-0 w-1/2 h-full origin-left z-40" style={{ transformStyle: 'preserve-3d', display: 'none' }}>
            <div className="absolute inset-0 backface-hidden z-10 bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
              <img src={resolveAssetUrl(magazine.pages[currentPage])} className="w-full h-full object-cover" alt="flip-front" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
            <div className="absolute inset-0 backface-hidden bg-white shadow-[20px_0_50px_rgba(0,0,0,0.3)]" style={{ transform: 'rotateY(180deg)' }}>
              <img src={resolveAssetUrl(magazine.pages[currentPage + 1] ?? magazine.pages[currentPage])} className="w-full h-full object-cover" alt="flip-back" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
          </div>

          <div ref={prevLeafRef} className="absolute top-0 left-0 w-1/2 h-full origin-right z-40" style={{ transformStyle: 'preserve-3d', display: 'none' }}>
            <div className="absolute inset-0 backface-hidden z-10 bg-white shadow-[20px_0_50px_rgba(0,0,0,0.3)]">
              <img src={resolveAssetUrl(magazine.pages[currentPage])} className="w-full h-full object-cover" alt="flip-front-prev" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
            <div className="absolute inset-0 backface-hidden bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.3)]" style={{ transform: 'rotateY(-180deg)' }}>
              <img src={resolveAssetUrl(magazine.pages[currentPage - 1] ?? magazine.pages[currentPage])} className="w-full h-full object-cover" alt="flip-back-prev" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
          </div>
        </div>

        <div ref={mobilePageRef} className="md:hidden w-full h-full bg-white relative overflow-hidden shadow-2xl rounded-lg">
          <img src={resolveAssetUrl(magazine.pages[currentPage])} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="mobile-page" />
        </div>

        <button onClick={() => handleTurn('prev')} disabled={isFlipping || currentPage === 0} className="absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-gradient-to-r from-black/50 via-black/10 to-transparent group z-[60] disabled:opacity-0 transition-opacity cursor-pointer">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white group-hover:scale-110 group-hover:bg-white/20 transition-all border border-white/20 shadow-2xl">
            <ChevronLeft size={36} />
          </div>
        </button>
        <button onClick={() => handleTurn('next')} disabled={isFlipping || currentPage === magazine.pages.length - 1} className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-gradient-to-l from-black/50 via-black/10 to-transparent group z-[60] disabled:opacity-0 transition-opacity cursor-pointer">
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white group-hover:scale-110 group-hover:bg-white/20 transition-all border border-white/20 shadow-2xl">
            <ChevronRight size={36} />
          </div>
        </button>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-full z-[55] hidden md:block">
          <div className="w-full h-full bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      <div data-flip-reveal className="mt-16 flex flex-col items-center space-y-8">
        <div className="flex items-center space-x-6 bg-[#000080] px-10 py-4 rounded-2xl text-white shadow-2xl border border-white/10">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-300 mb-1">{t('flipbook.issueProgress')}</span>
            <div className="text-2xl font-black serif">{t('flipbook.page')} {currentPage + 1} <span className="text-red-500 mx-1">/</span> {magazine.pages.length}</div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex space-x-6">
            <button className="hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl" aria-label={t('flipbook.zoomIn')}><ZoomIn size={24} /></button>
            <button className="hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl" aria-label={t('flipbook.fullscreen')}><Maximize2 size={24} /></button>
          </div>
        </div>

        <div className="relative w-full max-w-96 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div ref={progressRef} className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#800000] to-red-600 shadow-[0_0_10px_rgba(128,0,0,0.5)]" style={{ width: progressWidth }} />
        </div>
      </div>

      <SubscriptionWall
        isOpen={showSubscriptionModal}
        onClose={() => setShowSubscriptionModal(false)}
        onAccessGranted={() => setShowSubscriptionModal(false)}
        resourceId={magazine.id}
        resourceTitle={magazine.title}
        resourceType="MAGAZINE"
        digitalPrice={0}
        physicalPrice={magazine.pricePhysical}
        digitalLabel={t('flipbook.digitalLabel')}
      />

      <style dangerouslySetInnerHTML={{ __html: `
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-container {
          -webkit-perspective: 3000px;
        }
        .transform-gpu {
          -webkit-transform-style: preserve-3d;
          transform-style: preserve-3d;
        }
      ` }} />
    </div>
  );
};

export default Flipbook;
