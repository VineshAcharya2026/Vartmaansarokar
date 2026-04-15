import React from 'react';
import { useApp } from '../AppContext';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowUpRight } from 'lucide-react';
import { resolveAssetUrl } from '../utils/app';

export default function AdsPage() {
  const { ads } = useApp();
  const navigate = useNavigate();

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <header className="mb-12 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-[#001f3f] serif mb-4">
          Marketplace & <span className="text-[#800000]">Offers</span>
        </h1>
        <p className="text-gray-500 text-lg max-w-2xl">
          Explore exclusive deals, community announcements, and featured partner content from across our network.
        </p>
      </header>

      {ads.length === 0 ? (
        <div className="bg-[#FAF7F2] rounded-[32px] p-20 text-center border-2 border-dashed border-gray-200">
           <Megaphone size={48} className="mx-auto text-gray-300 mb-6" />
           <h2 className="text-2xl font-bold text-[#001f3f] mb-2">No active ads right now</h2>
           <p className="text-gray-500">Interested in placing an ad? <button onClick={() => navigate('/advertisers')} className="text-[#800000] font-bold hover:underline">Contact our sales team</button>.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {ads.map((ad) => (
            <div 
              key={ad.id} 
              onClick={() => navigate(`/ads/${ad.id}`)}
              className="group cursor-pointer bg-white rounded-[24px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-gray-100 flex flex-col"
            >
              <div className="relative h-64 overflow-hidden">
                <img 
                  src={resolveAssetUrl(ad.image)} 
                  alt={ad.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                />
                <div className="absolute top-4 right-4 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all">
                   <div className="bg-white/90 backdrop-blur-sm p-3 rounded-xl shadow-lg">
                      <ArrowUpRight size={20} className="text-[#800000]" />
                   </div>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#800000] mb-3">Sponsored Content</span>
                <h3 className="text-2xl font-black text-[#001f3f] serif mb-4 group-hover:text-[#800000] transition-colors line-clamp-2">
                  {ad.title}
                </h3>
                <p className="text-gray-500 mb-8 line-clamp-3 leading-relaxed flex-1">
                  {ad.description}
                </p>
                <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#001f3f] uppercase tracking-widest">Learn More</span>
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#800000] group-hover:text-white transition-all">
                    <ArrowUpRight size={18} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
