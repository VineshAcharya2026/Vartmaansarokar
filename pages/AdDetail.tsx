import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { ArrowLeft, ExternalLink, Megaphone, Share2 } from 'lucide-react';
import { resolveAssetUrl } from '../utils/app';
import toast from 'react-hot-toast';

export default function AdDetail() {
  const { id } = useParams<{ id: string }>();
  const { ads } = useApp();
  const navigate = useNavigate();

  const ad = ads.find(a => a.id === id);

  if (!ad) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-4 text-center">
         <h2 className="text-2xl font-bold">Ad not found</h2>
         <button onClick={() => navigate('/ads')} className="mt-4 text-[#800000] font-bold">Back to Marketplace</button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-12 px-4">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-400 hover:text-[#001f3f] mb-10 group transition-colors"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-bold uppercase tracking-widest">Go Back</span>
      </button>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
        {/* LEFT COLUMN - MEDIA */}
        <div className="md:col-span-7 space-y-8">
           <div className="relative rounded-[32px] overflow-hidden shadow-2xl border border-gray-100 bg-white p-2">
              <img 
                src={resolveAssetUrl(ad.image)} 
                alt={ad.title} 
                className="w-full h-auto rounded-[28px] object-cover" 
              />
           </div>
        </div>

        {/* RIGHT COLUMN - CONTENT */}
        <div className="md:col-span-5 flex flex-col justify-center">
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                 <span className="bg-[#800000] text-white text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                   Sponsored
                 </span>
                 <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">
                   Partnership
                 </span>
              </div>
              <h1 className="text-4xl md:text-5xl font-black text-[#001f3f] serif leading-tight">
                {ad.title}
              </h1>
            </div>

            <div className="p-8 bg-gray-50 rounded-[32px] border border-gray-100 italic text-gray-600 leading-relaxed text-lg">
               "{ad.description}"
            </div>

            <div className="space-y-4 pt-6">
              <a 
                href={ad.redirect_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-3 bg-[#001f3f] text-white py-5 rounded-2xl font-black uppercase tracking-[0.1em] hover:bg-[#800000] transition-all shadow-xl hover:translate-y-[-2px]"
              >
                <span>Visit Official Website</span>
                <ExternalLink size={20} />
              </a>
              
              <button 
                onClick={() => {
                   if(navigator.share) {
                     navigator.share({ title: ad.title, url: window.location.href });
                   } else {
                     navigator.clipboard.writeText(window.location.href);
                     toast.success('Link copied to clipboard');
                   }
                }}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-500 py-4 rounded-2xl font-bold hover:border-[#001f3f] hover:text-[#001f3f] transition-all"
              >
                <Share2 size={18} />
                <span>Share this Offer</span>
              </button>
            </div>
            
            <div className="pt-10 border-t border-gray-50 text-center md:text-left">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.1em] mb-4">Interested in placing an ad?</p>
              <button 
                onClick={() => navigate('/advertisers')}
                className="inline-flex items-center gap-2 text-[#001f3f] font-black uppercase tracking-widest text-xs hover:text-[#800000] transition-colors"
              >
                <Megaphone size={16} />
                <span>Contact Advertisers Team</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
