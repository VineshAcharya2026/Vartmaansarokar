import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../AppContext';
import Flipbook from '../components/Flipbook';
import SubscriptionWall from '../components/SubscriptionWall';
import { BookOpen, Newspaper, Star, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import gsap from 'gsap';
import { formatCurrencyINR, resolveAssetUrl } from '../utils/app';

const Magazine: React.FC = () => {
  const { magazines } = useApp();
  const { t } = useTranslation();
  const [selectedMagId, setSelectedMagId] = useState<string | null>(null);
  const [showSubscriptionWall, setShowSubscriptionWall] = useState(false);
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
      gsap.fromTo('[data-magazine-reveal]', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  if (!selectedMag) {
    return (
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-12 text-center">
        <h1 className="text-4xl font-bold text-[#001f3f] serif mb-4">Digital Library</h1>
        <p className="text-gray-600">No magazines are currently available. Check back soon!</p>
      </div>
    );
  }

  return (
    <div ref={pageRef} className="space-y-16 py-10">
      {/* HEADER SECTION */}
      <div data-magazine-reveal className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-6xl font-black text-[#001f3f] serif tracking-tight">
          Monthly <span className="text-[#800000]">Library</span>
        </h1>
        <p className="text-gray-500 text-lg md:text-xl font-medium max-w-2xl mx-auto">
          Explore our collection of investigative journalism, deep-dive reports, and exclusive monthly issues.
        </p>
      </div>

      {/* FEATURED MAGAZINE READER */}
      <section data-magazine-reveal className="bg-white p-6 md:p-12 rounded-[32px] shadow-2xl border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
               <span className="bg-[#800000] text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                LATEST ISSUE
              </span>
              <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                {selectedMag.issueNumber}
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-[#001f3f] serif leading-tight">
              {selectedMag.title}
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">DIGITAL ACCESS</span>
              <span className="px-4 py-2 bg-green-50 text-green-700 rounded-xl text-sm font-bold border border-green-100">
                {selectedMag.isFree ? "FREE" : formatCurrencyINR(selectedMag.priceDigital)}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">PRINT DELIVERY</span>
              <span className="px-4 py-2 bg-blue-50 text-[#001f3f] rounded-xl text-sm font-bold border border-blue-100">
                {formatCurrencyINR(selectedMag.pricePhysical)}
              </span>
            </div>
          </div>
        </div>

        {/* READER CONTAINER */}
        <div className="relative group">
          <Flipbook magazine={selectedMag} />
          
          {/* OVERLAY INDICATOR FOR UX */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white text-[10px] font-black px-4 py-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-widest">
            Click corners to turn pages
          </div>
        </div>

        {selectedMag.pdfUrl && (
          <div className="mt-10 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-black text-[#001f3f] serif">Magazine PDF</h3>
              <a
                href={resolveAssetUrl(selectedMag.pdfUrl)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#800000] text-white rounded-xl font-bold hover:bg-red-900 transition-colors"
              >
                Open PDF
              </a>
            </div>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-gray-50">
              <iframe
                src={resolveAssetUrl(selectedMag.pdfUrl)}
                title={`${selectedMag.title} PDF`}
                className="w-full h-[680px]"
              />
            </div>
          </div>
        )}

        {/* VALUE PROPS */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-gray-50">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-50 text-[#800000] rounded-2xl flex items-center justify-center shrink-0">
              <BookOpen size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[#001f3f] mb-1">High Resolution</h4>
              <p className="text-sm text-gray-500">Crystal clear reading experience on any device.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-50 text-[#001f3f] rounded-2xl flex items-center justify-center shrink-0">
              <Star size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[#001f3f] mb-1">Premium Insights</h4>
              <p className="text-sm text-gray-500">Unfiltered investigation and deep-dive reporting.</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="font-bold text-[#001f3f] mb-1">Verify Status</h4>
              <p className="text-sm text-gray-500">Secure access for verified active subscribers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* BROWSE ARCHIVES */}
      <section data-magazine-reveal className="space-y-8">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-black text-[#001f3f] serif uppercase tracking-tight">Explore Previous Issues</h3>
          <div className="h-px flex-1 bg-gray-100 mx-6 hidden md:block"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {magazines.map((mag) => (
            <button
              key={mag.id}
              onClick={() => setSelectedMagId(mag.id)}
              className={`group text-left transition-all relative ${selectedMag.id === mag.id ? 'scale-105' : 'hover:scale-102 opacity-80 hover:opacity-100'}`}
            >
              <div className={`relative overflow-hidden rounded-2xl aspect-[3/4] mb-3 shadow-lg group-hover:shadow-2xl transition-all border-4 ${selectedMag.id === mag.id ? 'border-[#800000]' : 'border-transparent'}`}>
                <img 
                  src={resolveAssetUrl(mag.coverImage)} 
                  alt={mag.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                   <BookOpen className="text-white" size={24} />
                </div>
              </div>
              <h4 className="text-sm font-black text-[#001f3f] line-clamp-1 uppercase tracking-tight">{mag.title}</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{mag.issueNumber}</p>
            </button>
          ))}
        </div>
      </section>

      {/* SUBSCRIPTION CTA SECTION */}
      <section data-magazine-reveal className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* DIGITAL CARD */}
        <div className="group relative bg-[#800000] p-10 rounded-[40px] shadow-2xl overflow-hidden transition-all hover:translate-y-[-4px]">
          <div className="relative z-10 text-white">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-300">Read Anywhere</span>
            <h3 className="text-3xl font-black mb-4 serif mt-2">Digital Member</h3>
            <p className="text-red-100/80 mb-8 leading-relaxed font-medium">Get instant access to our entire digital archive of past and future issues.</p>
            
            <div className="flex items-baseline space-x-2 mb-10">
              <span className="text-5xl font-black">{selectedMag.isFree ? "FREE" : formatCurrencyINR(selectedMag.priceDigital)}</span>
              {!selectedMag.isFree && <span className="text-red-200 text-sm font-bold uppercase">/ Issue</span>}
            </div>
            
            <button
              type="button"
              onClick={() => setShowSubscriptionWall(true)}
              className="w-full bg-white text-[#800000] py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-black hover:text-white transition-all shadow-xl"
            >
              Claim Digital Access
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
            <Smartphone size={240} />
          </div>
        </div>

        {/* PRINT CARD */}
        <div className="group relative bg-white border-2 border-[#001f3f] p-10 rounded-[40px] shadow-2xl overflow-hidden transition-all hover:translate-y-[-4px]">
          <div className="relative z-10">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#800000]">Home Delivery</span>
            <h3 className="text-3xl font-black mb-4 text-[#001f3f] serif mt-2">Print Subscription</h3>
            <p className="text-gray-500 mb-8 leading-relaxed font-medium">Receive a high-quality physical copy delivered right to your doorstep every month.</p>
            
            <div className="flex items-baseline space-x-2 mb-10 text-[#001f3f]">
              <span className="text-5xl font-black">{formatCurrencyINR(selectedMag.pricePhysical)}</span>
              <span className="text-gray-400 text-sm font-bold uppercase">/ Month</span>
            </div>
            
            <button
              type="button"
              onClick={() => setShowSubscriptionWall(true)}
              className="w-full bg-[#001f3f] text-white py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-[#800000] transition-all shadow-xl shadow-blue-900/10"
            >
              Subscribe To Print
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-110 transition-transform duration-700 text-[#001f3f]">
            <Mail size={240} />
          </div>
        </div>
      </section>

      {/* SUBSCRIPTION MODAL */}
      <SubscriptionWall
        isOpen={showSubscriptionWall}
        onClose={() => setShowSubscriptionWall(false)}
        resourceTitle={selectedMag?.title ?? "Monthly Magazine"}
      />
    </div>
  );
};

export default Magazine;
