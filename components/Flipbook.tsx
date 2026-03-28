
import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft, ChevronRight, Maximize2, ZoomIn, BookOpen, 
  Lock, X, Upload, CheckCircle, Smartphone, Mail, 
  User as UserIcon, MessageSquare, Image as ImageIcon,
  ArrowRight
} from 'lucide-react';
import { MagazineIssue, UserRole } from '../types';
import { useApp } from '../AppContext';

interface FlipbookProps {
  magazine: MagazineIssue;
}

const Flipbook: React.FC<FlipbookProps> = ({ magazine }) => {
  const { currentUser } = useApp();
  const [currentPage, setCurrentPage] = useState(0);
  const [isFlipping, setIsFlipping] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | null>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showUnlockForm, setShowUnlockForm] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    accessType: 'DIGITAL' as 'DIGITAL' | 'PHYSICAL',
    message: '',
    screenshot: null as File | null
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const gatedPage = magazine.gatedPage ?? 2; 

  // Initialize sound
  useEffect(() => {
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    audioRef.current.volume = 0.4;
  }, []);

  const playFlipSound = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  };

  const isAccessAllowed = currentUser?.role === UserRole.MAGAZINE || currentUser?.role === UserRole.ADMIN || magazine.isFree;

  const handleNext = () => {
    if (isFlipping) return;
    if (currentPage < magazine.pages.length - 1) {
      const targetPageNumber = currentPage + 1; // 0-indexed + 1 for logic
      
      // Strict rule: if target page is >= gatedPage, show subscription prompt
      if (!isAccessAllowed && (targetPageNumber + 1) > gatedPage) {
        setShowSubscriptionModal(true);
        return;
      }

      playFlipSound();
      setDirection('next');
      setIsFlipping(true);
      
      setTimeout(() => {
        setCurrentPage(prev => prev + 1);
        setIsFlipping(false);
        setDirection(null);
      }, 750);
    }
  };

  const handlePrev = () => {
    if (isFlipping) return;
    if (currentPage > 0) {
      playFlipSound();
      setDirection('prev');
      setIsFlipping(true);

      setTimeout(() => {
        setCurrentPage(prev => prev - 1);
        setIsFlipping(false);
        setDirection(null);
      }, 750);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    // Simulate API call delay
    setTimeout(() => {
      setShowUnlockForm(false);
      setIsSubmitted(false);
      setShowSubscriptionModal(false);
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        accessType: 'DIGITAL',
        message: '',
        screenshot: null
      });
    }, 2500);
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto flex flex-col items-center py-10">
      {/* 3D Flipbook Container */}
      <div 
        className={`relative w-full aspect-[4/5] md:aspect-[3/2] rounded-r-xl overflow-visible flip-container transition-transform duration-700 ${isFlipping ? 'scale-[1.01]' : 'scale-100'}`}
        style={{ perspective: '3000px' }}
      >
        {/* Book Body / Deep Spine Shadow */}
        <div className="absolute inset-0 bg-[#0a0a0a] rounded-xl flex shadow-[0_30px_60px_-12px_rgba(0,0,0,0.5),0_18px_36px_-18px_rgba(0,0,0,0.5)]">
          <div className="w-1/2 h-full bg-[#111] rounded-l-xl border-r border-white/5 shadow-[inset_-15px_0_30px_rgba(0,0,0,0.8)]" />
          <div className="w-1/2 h-full bg-[#111] rounded-r-xl shadow-[inset_15px_0_30px_rgba(0,0,0,0.8)]" />
        </div>

        {/* Desktop View Layers */}
        <div className="hidden md:flex h-full w-full relative transform-gpu" style={{ transformStyle: 'preserve-3d' }}>
          
          <div className="w-1/2 h-full bg-white relative overflow-hidden rounded-l-sm">
            {currentPage > 0 && (
              <img src={magazine.pages[currentPage - 1]} className="w-full h-full object-cover" alt="prev" />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/10 to-transparent" />
          </div>

          <div className="w-1/2 h-full bg-white relative overflow-hidden border-l border-black/10 rounded-r-sm">
             {currentPage < magazine.pages.length - 1 && (
               <img src={magazine.pages[currentPage + 1]} className="w-full h-full object-cover" alt="next" />
             )}
             <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent pointer-events-none" />
             <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent" />
          </div>

          {/* The Flipping Leaf - NEXT */}
          <div 
            className={`absolute top-0 right-0 w-1/2 h-full origin-left z-40 transition-transform duration-[750ms]`}
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipping && direction === 'next' ? 'rotateY(-180deg)' : 'rotateY(0deg)',
              display: isFlipping && direction === 'next' ? 'block' : 'none',
              transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)'
            }}
          >
            <div className="absolute inset-0 backface-hidden z-10 bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.3)]">
              <img src={magazine.pages[currentPage]} className="w-full h-full object-cover" alt="flip-front" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
            <div className="absolute inset-0 backface-hidden bg-white shadow-[20px_0_50px_rgba(0,0,0,0.3)]" style={{ transform: 'rotateY(180deg)' }}>
              <img src={magazine.pages[currentPage + 1]} className="w-full h-full object-cover" alt="flip-back" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
          </div>

          {/* Reverse Flipping Leaf - PREV */}
          <div 
            className={`absolute top-0 left-0 w-1/2 h-full origin-right z-40 transition-transform duration-[750ms]`}
            style={{ 
              transformStyle: 'preserve-3d',
              transform: isFlipping && direction === 'prev' ? 'rotateY(180deg)' : 'rotateY(0deg)',
              display: isFlipping && direction === 'prev' ? 'block' : 'none',
              transitionTimingFunction: 'cubic-bezier(0.15, 0, 0.15, 1)'
            }}
          >
            <div className="absolute inset-0 backface-hidden z-10 bg-white shadow-[20px_0_50px_rgba(0,0,0,0.3)]">
              <img src={magazine.pages[currentPage]} className="w-full h-full object-cover" alt="flip-front-prev" />
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-black/20 to-transparent" />
            </div>
            <div className="absolute inset-0 backface-hidden bg-white shadow-[-20px_0_50px_rgba(0,0,0,0.3)]" style={{ transform: 'rotateY(-180deg)' }}>
              <img src={magazine.pages[currentPage - 1]} className="w-full h-full object-cover" alt="flip-back-prev" />
              <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-black/20 to-transparent" />
            </div>
          </div>

          {!isFlipping && (
             <div className="absolute inset-0 flex z-30 pointer-events-none">
                <div className="w-1/2 h-full relative overflow-hidden rounded-l-sm bg-white">
                   {currentPage > 0 && <img src={magazine.pages[currentPage - 1]} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage - 1 >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="left-page" />}
                   <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-black/5 to-transparent" />
                </div>
                <div className="w-1/2 h-full relative overflow-hidden border-l border-black/20 bg-white rounded-r-sm">
                   <img src={magazine.pages[currentPage]} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="right-page" />
                   <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent" />
                </div>
             </div>
          )}
        </div>

        {/* Mobile View */}
        <div className="md:hidden w-full h-full bg-white relative overflow-hidden shadow-2xl rounded-lg">
           <div className={`w-full h-full transition-all duration-700 ease-in-out ${isFlipping ? 'opacity-0 scale-110 translate-x-4 blur-lg' : 'opacity-100 scale-100 translate-x-0'}`}>
              <img src={magazine.pages[currentPage]} className={`w-full h-full object-cover ${!isAccessAllowed && currentPage >= gatedPage - 1 && magazine.blurPaywall ? 'blur-sm' : ''}`} alt="mobile-page" />
           </div>
        </div>

        {/* Controls Overlay */}
        <button 
          onClick={handlePrev} 
          disabled={isFlipping || currentPage === 0}
          className="absolute inset-y-0 left-0 w-24 flex items-center justify-center bg-gradient-to-r from-black/50 via-black/10 to-transparent group z-[60] disabled:opacity-0 transition-opacity cursor-pointer"
        >
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white group-hover:scale-110 group-hover:bg-white/20 transition-all border border-white/20 shadow-2xl">
            <ChevronLeft size={36} />
          </div>
        </button>
        <button 
          onClick={handleNext} 
          disabled={isFlipping || currentPage === magazine.pages.length - 1}
          className="absolute inset-y-0 right-0 w-24 flex items-center justify-center bg-gradient-to-l from-black/50 via-black/10 to-transparent group z-[60] disabled:opacity-0 transition-opacity cursor-pointer"
        >
          <div className="p-4 bg-white/10 backdrop-blur-md rounded-full text-white group-hover:scale-110 group-hover:bg-white/20 transition-all border border-white/20 shadow-2xl">
            <ChevronRight size={36} />
          </div>
        </button>

        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[4px] h-full z-[55] hidden md:block">
           <div className="w-full h-full bg-black/40 shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
        </div>
      </div>

      {/* Meta Info */}
      <div className="mt-16 flex flex-col items-center space-y-8">
        <div className="flex items-center space-x-6 bg-[#000080] px-10 py-4 rounded-2xl text-white shadow-2xl border border-white/10">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-blue-300 mb-1">Issue Progress</span>
            <div className="text-2xl font-black serif">Page {currentPage + 1} <span className="text-red-500 mx-1">/</span> {magazine.pages.length}</div>
          </div>
          <div className="h-10 w-[1px] bg-white/10" />
          <div className="flex space-x-6">
             <button className="hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl"><ZoomIn size={24} /></button>
             <button className="hover:text-red-500 transition-colors p-2 hover:bg-white/5 rounded-xl"><Maximize2 size={24} /></button>
          </div>
        </div>
        
        <div className="relative w-96 h-2 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#800000] to-red-600 transition-all duration-700 ease-out shadow-[0_0_10px_rgba(128,0,0,0.5)]" 
            style={{ width: `${((currentPage + 1) / magazine.pages.length) * 100}%` }} 
          />
        </div>
      </div>

      {/* Initial Subscription Modal */}
      {showSubscriptionModal && !showUnlockForm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] max-w-lg w-full p-12 text-center animate-in fade-in zoom-in duration-500 shadow-[0_0_120px_rgba(128,0,0,0.4)] border border-red-50">
            <div className="w-28 h-28 bg-red-50 rounded-[32px] flex items-center justify-center mx-auto mb-10 text-[#800000] rotate-3 shadow-lg">
              <BookOpen className="animate-bounce" size={56} />
            </div>
            <h2 className="text-4xl font-black mb-6 serif text-[#000080]">Continue Your Journey</h2>
            <p className="text-gray-500 mb-10 leading-relaxed text-lg">You've reached our exclusive preview limit. Unlock full access to dive deeper into the stories shaping our world.</p>
            
            <div className="grid grid-cols-2 gap-6 mb-12">
              <div className="border-2 border-[#800000] rounded-[24px] p-8 bg-red-50/50 relative shadow-md">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#800000] text-white text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest">DIGITAL</div>
                <p className="text-4xl font-black text-[#800000] mb-1">₹0</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Digital Archive</p>
              </div>
              <div className="border border-gray-100 rounded-[24px] p-8 hover:border-[#000080] cursor-pointer transition-all hover:bg-gray-50 group">
                <div className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-3 group-hover:text-[#000080]">PHYSICAL</div>
                <p className="text-4xl font-black text-gray-800 mb-1 group-hover:text-[#000080]">₹499</p>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Monthly Print</p>
              </div>
            </div>

            <div className="flex flex-col space-y-4">
              <button 
                onClick={() => setShowUnlockForm(true)}
                className="w-full bg-[#800000] text-white py-5 rounded-[20px] font-black shadow-2xl shadow-red-900/40 hover:bg-red-800 transition-all active:scale-[0.98] text-lg uppercase tracking-wider"
              >
                Unlock Access
              </button>
              <button 
                onClick={() => setShowSubscriptionModal(false)}
                className="text-gray-400 text-xs font-black hover:text-[#000080] transition-colors uppercase tracking-[0.2em] pt-4"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Unlock Form Modal */}
      {showUnlockForm && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#001f3f]/90 backdrop-blur-lg p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] max-w-xl w-full relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <button 
              onClick={() => setShowUnlockForm(false)}
              className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-600 transition-colors z-20"
            >
              <X size={28} />
            </button>

            {isSubmitted ? (
              <div className="p-16 text-center animate-in zoom-in">
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-8">
                  <CheckCircle size={48} />
                </div>
                <h3 className="text-3xl font-black text-[#001f3f] serif mb-4">Request Sent!</h3>
                <p className="text-gray-500 text-lg">We are processing your access request. You will receive an email confirmation shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-10 md:p-14 overflow-y-auto max-h-[90vh]">
                <div className="mb-10 text-center">
                  <div className="w-16 h-16 bg-red-50 text-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Lock size={32} />
                  </div>
                  <h3 className="text-3xl font-black text-[#001f3f] serif">Subscriber Details</h3>
                  <p className="text-gray-400 mt-2 font-medium">Please provide your info to unlock the full edition.</p>
                </div>

                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        required
                        type="text" 
                        placeholder="Full Name" 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000] transition-all"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input 
                        required
                        type="email" 
                        placeholder="Email Address" 
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000] transition-all"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                      required
                      type="tel" 
                      placeholder="Phone Number / WhatsApp" 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000] transition-all"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
                    <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest block mb-4">Select Access Level</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, accessType: 'DIGITAL'})}
                        className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${formData.accessType === 'DIGITAL' ? 'border-[#800000] bg-white text-[#800000] shadow-sm' : 'border-transparent bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      >
                        DIGITAL ACCESS
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, accessType: 'PHYSICAL'})}
                        className={`py-4 rounded-2xl text-xs font-black transition-all border-2 ${formData.accessType === 'PHYSICAL' ? 'border-[#800000] bg-white text-[#800000] shadow-sm' : 'border-transparent bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                      >
                        PHYSICAL COPY
                      </button>
                    </div>

                    {formData.accessType === 'PHYSICAL' && (
                      <div className="mt-6 animate-in slide-in-from-top-2">
                        <label className="text-[10px] font-black uppercase text-[#800000] tracking-widest block mb-3">Upload Payment Proof (Screenshot)</label>
                        <div className="relative h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center group hover:border-[#800000] transition-colors bg-white">
                          <input 
                            type="file" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={(e) => setFormData({...formData, screenshot: e.target.files?.[0] || null})}
                          />
                          <div className="text-center p-4">
                            <Upload className="mx-auto text-gray-300 group-hover:text-[#800000] mb-2" size={24} />
                            <p className="text-xs text-gray-400 font-bold">
                              {formData.screenshot ? formData.screenshot.name : 'Click to upload or drag screenshot'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18} />
                    <textarea 
                      placeholder="Mailing Address (for physical copies) or Special Instructions..." 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000] transition-all min-h-[120px] resize-none"
                      value={formData.message}
                      onChange={e => setFormData({...formData, message: e.target.value})}
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#001f3f] text-white py-5 rounded-[20px] font-black shadow-2xl hover:bg-blue-900 transition-all text-sm uppercase tracking-widest flex items-center justify-center space-x-3 group"
                  >
                    <span>Submit & Unlock Edition</span>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <p className="text-[10px] text-center text-gray-400 uppercase font-bold tracking-widest mt-6">
                    Authentic Journalism for the Modern Reader
                  </p>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .backface-hidden {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
      ` }} />
    </div>
  );
};

export default Flipbook;
