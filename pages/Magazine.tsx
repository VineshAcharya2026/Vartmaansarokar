
import React, { useState } from 'react';
import { useApp } from '../AppContext';
import Flipbook from '../components/Flipbook';
import { BookOpen, Newspaper, Star } from 'lucide-react';

const Magazine: React.FC = () => {
  const { magazines } = useApp();
  const [selectedMag, setSelectedMag] = useState(magazines[0]);

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <h1 className="text-4xl md:text-5xl font-bold text-[#001f3f] serif">Digital Archive</h1>
        <p className="text-gray-600 text-lg">
          Immerse yourself in our premium collection of magazines. Experience our realistic 3D flipbook viewer for an authentic reading experience.
        </p>
      </div>

      {/* Main Viewer */}
      {selectedMag && (
        <section className="bg-white p-6 md:p-12 rounded-3xl shadow-xl border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-[#800000] font-bold text-sm uppercase tracking-widest">{selectedMag.issueNumber} Edition</span>
              <h2 className="text-3xl font-bold text-[#001f3f] serif mt-1">{selectedMag.title}</h2>
            </div>
            <div className="flex space-x-2">
              <span className="px-4 py-2 bg-green-100 text-green-700 rounded-full text-xs font-bold">DIGITAL: FREE</span>
              <span className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">PHYSICAL: ₹499</span>
            </div>
          </div>
          
          <Flipbook magazine={selectedMag} />
          
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            <div className="flex items-center space-x-3 text-gray-500">
               <BookOpen size={24} className="text-[#800000]" />
               <span className="text-sm">High-Resolution Graphics</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-500">
               <Newspaper size={24} className="text-[#800000]" />
               <span className="text-sm">Exclusive Author Interviews</span>
            </div>
            <div className="flex items-center space-x-3 text-gray-500">
               <Star size={24} className="text-[#800000]" />
               <span className="text-sm">Interactive Content</span>
            </div>
          </div>
        </section>
      )}

      {/* List of Issues */}
      <section>
        <h3 className="text-2xl font-bold text-[#001f3f] serif mb-8">Previous Issues</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {magazines.map(mag => (
            <div 
              key={mag.id}
              onClick={() => setSelectedMag(mag)}
              className={`group cursor-pointer transition-all ${selectedMag.id === mag.id ? 'ring-2 ring-[#800000] p-1 rounded-xl' : ''}`}
            >
              <div className="relative overflow-hidden rounded-lg aspect-[3/4] mb-3">
                <img src={mag.coverImage} alt={mag.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <BookOpen className="text-white" size={32} />
                </div>
              </div>
              <h4 className="text-sm font-bold text-[#001f3f] line-clamp-1">{mag.title}</h4>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">{mag.issueNumber}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription Plans */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-[#800000] text-white p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 serif">Digital Subscription</h3>
            <p className="text-red-100 mb-6">Unlimited access to our 3D flipbook archive and premium articles on any device.</p>
            <div className="flex items-baseline space-x-2 mb-8">
              <span className="text-4xl font-bold">₹0</span>
              <span className="text-red-200 line-through">₹399/mo</span>
            </div>
            <button className="w-full bg-white text-[#800000] py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
              Claim Free Access
            </button>
          </div>
          <div className="absolute bottom-0 right-0 p-4 opacity-10">
            <BookOpen size={160} />
          </div>
        </div>
        
        <div className="bg-white border-2 border-[#001f3f] p-8 rounded-2xl shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-2xl font-bold mb-4 text-[#001f3f] serif">Physical Subscription</h3>
            <p className="text-gray-500 mb-6">Get a glossy high-quality print delivered to your home every single month.</p>
            <div className="flex items-baseline space-x-2 mb-8 text-[#001f3f]">
              <span className="text-4xl font-bold">₹499</span>
              <span className="text-gray-400 font-normal">/mo</span>
            </div>
            <button className="w-full bg-[#001f3f] text-white py-3 rounded-xl font-bold hover:bg-blue-900 transition-colors">
              Subscribe to Print
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Magazine;
