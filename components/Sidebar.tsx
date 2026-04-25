import React, { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import gsap from 'gsap';
import { ArrowUpRight, Megaphone, Send } from 'lucide-react';
import { useApp } from '../AppContext';
import { resolveAssetUrl } from '../utils/app';

const Sidebar: React.FC = () => {
  const { ads } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sidebarRef = useRef<HTMLDivElement | null>(null);

  // Take only 3 active ads for the sidebar
  const visibleAds = ads.slice(0, 3);

  useLayoutEffect(() => {
    if (!sidebarRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-sidebar-ad]', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' });
    }, sidebarRef);
    return () => ctx.revert();
  }, [ads.length]);

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div ref={sidebarRef} className="sticky top-36 space-y-6">
        
        {/* AD CARDS */}
        {visibleAds.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Featured Ads</span>
              <Megaphone size={14} className="text-gray-300" />
            </div>
            
            {visibleAds.map((ad) => (
              <div 
                key={ad.id} 
                data-sidebar-ad
                className="group bg-white border border-gray-100 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
              >
                <div className="relative overflow-hidden rounded-xl h-32 mb-3">
                  <img 
                    src={resolveAssetUrl(ad.image || ad.imageUrl || 'https://picsum.photos/800/400')} 
                    alt={ad.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-2 right-2">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-widest">Sponsored</span>
                  </div>
                </div>
                
                <h3 className="font-bold text-[#001f3f] line-clamp-1">{ad.title}</h3>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>
                
                <button 
                  onClick={() => navigate(`/ads/${ad.id}`)}
                  className="mt-3 w-full flex items-center justify-center gap-2 bg-[#f8fafc] group-hover:bg-[#800000] text-[#001f3f] group-hover:text-white py-2 rounded-xl text-xs font-bold transition-all border border-gray-100 group-hover:border-[#800000]"
                >
                  <span>View Details</span>
                  <ArrowUpRight size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* PROMOTION / PARTNER CARD */}
        <Link
          to="/advertisers"
          className="block rounded-[24px] border-2 border-dashed border-gray-200 bg-[#faf7f2] p-5 text-center transition-all duration-300 hover:border-[#001f3f]/20 hover:bg-white shadow-sm"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#001f3f]/5 text-[#001f3f]">
            <Megaphone size={24} />
          </div>
          <h4 className="mt-4 text-base font-bold text-[#001f3f]">Partner With Us</h4>
          <p className="mt-2 text-xs leading-relaxed text-gray-500">Reach thousands of engaged readers across India.</p>
        </Link>

        {/* NEWSLETTER */}
        <div className="rounded-[24px] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-[#800000]">
              <Send size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#001f3f]">Our Newsletter</h3>
              <p className="mt-0.5 text-[11px] text-gray-400">Join 50k+ daily readers</p>
            </div>
          </div>
          <input
            type="email"
            placeholder="Your email address"
            className="mt-4 w-full rounded-xl border border-gray-100 bg-[#fafafa] px-4 py-2.5 text-xs text-[#001f3f] outline-none focus:border-[#800000] focus:bg-white transition-all"
          />
          <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#001f3f] py-2.5 text-xs font-bold text-white hover:bg-black transition-all">
            <span>Subscribe Now</span>
            <ArrowUpRight size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
