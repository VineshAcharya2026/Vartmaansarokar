import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Lock, ArrowRight, X, Check, ShieldCheck, Mail, Smartphone } from 'lucide-react';
import { useApp } from '../AppContext';

interface SubscriptionWallProps {
  isOpen: boolean;
  onClose: () => void;
  resourceTitle: string;
}

const SubscriptionWall: React.FC<SubscriptionWallProps> = ({
  isOpen,
  onClose,
  resourceTitle
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { currentUser } = useApp();

  if (!isOpen) return null;

  const handleSubscribe = () => {
    onClose();
    navigate('/subscribe');
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      {/* OVERLAY */}
      <div 
        className="absolute inset-0 bg-[#001f3f]/90 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* MODAL */}
      <div className="relative bg-white rounded-[40px] max-w-lg w-full overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.45)] animate-in zoom-in-95 fade-in duration-300">
        {/* CLOSE BUTTON */}
        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-700 transition-colors z-20"
        >
          <X size={24} />
        </button>

        <div className="p-8 md:p-12 text-center">
          {/* HEADER */}
          <div className="mb-10">
            <div className="w-20 h-20 bg-red-50 text-[#800000] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Lock size={36} />
            </div>
            <h3 className="text-3xl font-black text-[#001f3f] serif leading-tight mb-4">
              Premium Content
            </h3>
            <p className="text-gray-500 font-medium leading-relaxed">
              To read <span className="text-[#800000] font-bold">"{resourceTitle}"</span> and get full access to our investigative archives, please subscribe to one of our plans.
            </p>
          </div>

          {/* PERKS LIST */}
          <div className="space-y-4 mb-10 text-left bg-[#FAF7F2] p-6 rounded-3xl border border-gray-100">
            <div className="flex items-center gap-3 text-sm text-[#001f3f] font-semibold">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Exclusive Investigative Reports</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#001f3f] font-semibold">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>In-depth Digital Library Access</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-[#001f3f] font-semibold">
              <div className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                <Check size={14} strokeWidth={3} />
              </div>
              <span>Verified Fact-Checked Journalism</span>
            </div>
          </div>

          {/* CTA BUTTONS */}
          <div className="space-y-4">
            <button
              onClick={handleSubscribe}
              className="w-full bg-[#800000] text-white py-5 rounded-[24px] font-black shadow-2xl shadow-red-900/20 hover:bg-black transition-all flex items-center justify-center gap-3 text-lg group"
            >
              <span>Subscribe Now</span>
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={onClose}
              className="w-full bg-transparent text-gray-400 py-3 rounded-2xl font-bold hover:text-[#001f3f] transition-colors text-sm"
            >
              Maybe later
            </button>
          </div>

          {/* FOOTER */}
          {currentUser ? (
            <div className="mt-8 pt-8 border-t border-gray-100 flex items-center justify-center gap-4">
              <div className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck size={14} className="text-green-500" />
                Subscription Status: <span className={currentUser.subscription_status === 'ACTIVE' ? 'text-green-600' : 'text-amber-600'}>{currentUser.subscription_status || 'INACTIVE'}</span>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <p className="text-xs text-gray-400 font-medium italic">
                Get started today and join thousands of informed readers across the country.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionWall;
