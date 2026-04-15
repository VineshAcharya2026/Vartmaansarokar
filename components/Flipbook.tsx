import React, { useRef, useState } from 'react';
import HTMLFlipBook from 'react-pageflip';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MagazineIssue, UserRole } from '../types';
import { useApp } from '../AppContext';
import { resolveAssetUrl } from '../utils/app';
import SubscriptionWall from './SubscriptionWall';

const Page = React.forwardRef<HTMLDivElement, { imageUrl: string, isBlurred: boolean, isGated: boolean, onScribe: () => void }>((props, ref) => {
  const { t } = useTranslation();
  return (
    <div className="page bg-white relative" ref={ref} data-density="soft">
      <img src={props.imageUrl} className={`w-full h-full object-cover shadow-inner ${props.isBlurred ? 'blur-xl grayscale' : ''}`} alt="page" />
      {props.isGated && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm p-6 text-center">
          <div className="bg-white/90 p-6 rounded-2xl shadow-2xl max-w-[280px]">
            <BookOpen className="text-[#800000] mx-auto mb-4" size={40} />
            <h4 className="text-[#001f3f] font-bold text-lg mb-2">Premium Content</h4>
            <p className="text-gray-600 text-sm mb-6">Enjoy unlimited access to all our magazines and exclusive articles.</p>
            <button 
              onClick={(e) => { e.stopPropagation(); props.onScribe(); }}
              className="w-full bg-[#800000] text-white py-2.5 rounded-lg font-bold text-sm hover:bg-[#a00000] transition-colors"
            >
              Unlock Access
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

class FlipbookErrorBoundary extends React.Component<any, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface FlipbookProps {
  magazine: MagazineIssue;
}

const FlipbookInner: React.FC<FlipbookProps> = ({ magazine }) => {
  const flipBookRef = useRef<any>(null);
  const { currentUser } = useApp();
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const gatedPage = magazine.gatedPage ?? 2;
  const isStaff = [UserRole.EDITOR, UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(currentUser?.role || '' as any);
  const hasActiveSub = currentUser?.subscription_status === 'ACTIVE' || currentUser?.subscription?.status === 'ACTIVE';
  const isAccessAllowed = isStaff || hasActiveSub || magazine.isFree;

  const handlePageChange = (e: any) => {
    setCurrentPage(e.data);
  };

  const handleNext = () => {
    const nextBatch = currentPage + 2;
    if (!isAccessAllowed && nextBatch >= gatedPage) {
      setShowSubscriptionModal(true);
      return;
    }
    if (flipBookRef.current?.pageFlip()) flipBookRef.current.pageFlip().flipNext();
  };

  const handlePrev = () => {
    if (flipBookRef.current?.pageFlip()) flipBookRef.current.pageFlip().flipPrev();
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center py-10">
      <div className="relative w-full aspect-[3/2] flex justify-center items-center">
        {/* @ts-ignore */}
        <HTMLFlipBook 
          width={400} 
          height={600} 
          size="stretch"
          minWidth={315}
          maxWidth={1000}
          minHeight={400}
          maxHeight={1533}
          drawShadow={true}
          flippingTime={1000}
          usePortrait={true}
          startZIndex={0}
          autoSize={true}
          maxShadowOpacity={0.5}
          showCover={true}
          mobileScrollSupport={true}
          ref={flipBookRef}
          onFlip={handlePageChange}
          className="flip-book shadow-2xl"
          style={{}}
        >
          {magazine.pages.map((page, i) => {
            const isGated = !isAccessAllowed && i >= gatedPage - 1;
            return (
              <Page 
                key={i} 
                imageUrl={resolveAssetUrl(page)} 
                isBlurred={isGated && magazine.blurPaywall} 
                isGated={isGated && !magazine.blurPaywall}
                onScribe={() => setShowSubscriptionModal(true)}
              />
            );
          })}
        </HTMLFlipBook>

        <button onClick={handlePrev} className="absolute left-[-10px] md:left-4 z-50 p-2 md:p-3 bg-black/50 text-white rounded-full hover:bg-[#800000] focus:outline-none transition-colors">
          <ChevronLeft size={24} />
        </button>
        <button onClick={handleNext} className="absolute right-[-10px] md:right-4 z-50 p-2 md:p-3 bg-black/50 text-white rounded-full hover:bg-[#800000] focus:outline-none transition-colors">
          <ChevronRight size={24} />
        </button>
      </div>

      <div className="mt-8 text-center text-gray-500 font-bold tracking-widest text-sm uppercase">
        {t('flipbook.page')} {currentPage + 1} / {magazine.pages.length}
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
    </div>
  );
};

export default function Flipbook({ magazine }: FlipbookProps) {
  return (
    <FlipbookErrorBoundary fallback={
      <div className="flex flex-col gap-6 items-center p-4">
        {magazine.pages.map((p, i) => (
          <img key={i} src={resolveAssetUrl(p)} className="max-w-full shadow-lg border border-gray-200 rounded" alt={`Page ${i+1}`} />
        ))}
      </div>
    }>
      <FlipbookInner magazine={magazine} />
    </FlipbookErrorBoundary>
  );
}
