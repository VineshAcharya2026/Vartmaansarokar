
import React from 'react';
import { useApp } from '../AppContext';

const Sidebar: React.FC = () => {
  const { ads } = useApp();

  return (
    <aside className="hidden lg:block w-80 flex-shrink-0">
      <div className="sticky top-24 space-y-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 group transition-all duration-300 hover:shadow-lg">
            <a href={ad.link} target="_blank" rel="noopener noreferrer">
              <div className="relative">
                <img 
                  src={ad.imageUrl} 
                  alt={ad.title} 
                  className="w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ minHeight: ad.position === 'SIDEBAR_TOP' ? '400px' : '200px' }}
                />
                <div className="absolute top-2 right-2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                  Sponsored
                </div>
              </div>
              <div className="p-3 bg-gray-50 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-[#001f3f] truncate">{ad.title}</h4>
                <p className="text-xs text-gray-500 mt-1">Visit website &rarr;</p>
              </div>
            </a>
          </div>
        ))}
        
        <div className="bg-[#001f3f] text-white p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-bold mb-3 serif">Newsletter</h3>
          <p className="text-xs text-gray-300 mb-4">Get the latest news directly to your inbox every morning.</p>
          <input 
            type="email" 
            placeholder="Your Email" 
            className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#800000] mb-3"
          />
          <button className="w-full bg-[#800000] hover:bg-red-800 transition-colors py-2 rounded-lg font-bold text-sm">
            Subscribe Now
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
