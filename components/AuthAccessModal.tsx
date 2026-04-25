import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Upload,
  User as UserIcon,
  X
} from 'lucide-react';
import { useApp } from '../AppContext';
import { toast } from 'react-hot-toast';
import { SubscriptionRequestPayload, UserRole } from '../types';
import { API_BASE, GOOGLE_CLIENT_ID } from '../utils/app';
import { fetchApi } from '../utils/api';
import { translateRole } from '../utils/i18n';

export type AccessType = 'DIGITAL' | 'PHYSICAL';
export type AuthModalView = 'subscribe' | 'login';

export interface AuthAccessModalLaunchOptions {
  initialView?: AuthModalView;
  initialAccessType?: AccessType;
  prefillEmail?: string;
  prefillPassword?: string;
  staffLabel?: string;
}

interface AuthAccessModalProps extends AuthAccessModalLaunchOptions {
  isOpen: boolean;
  onClose: () => void;
}

const MEMBERSHIP_RESOURCE = {
  resourceType: 'MAGAZINE' as const,
  resourceId: 'vartmaansarokar-membership',
  resourceTitle: 'Vartmaan Sarokaar Membership'
};

const AuthAccessModal: React.FC<AuthAccessModalProps> = ({
  isOpen,
  onClose,
  initialView = 'subscribe',
  initialAccessType = 'DIGITAL',
  prefillEmail,
  prefillPassword,
  staffLabel
}) => {
  const { currentUser, login, loginWithGoogle, logout } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [accessType, setAccessType] = React.useState<AccessType>(initialAccessType);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(prefillEmail || '');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (isOpen) {
      setAccessType(initialAccessType);
      setName(currentUser?.name || '');
      setEmail(currentUser?.email || prefillEmail || '');

      // Initialize Google login if needed
      if (!currentUser && GOOGLE_CLIENT_ID && googleButtonRef.current) {
        try {
          // @ts-ignore
          google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: any) => loginWithGoogle(response.credential)
          });
          // @ts-ignore
          google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: googleButtonRef.current.offsetWidth || 300
          });
        } catch (e) {
          console.error('Google Sign-In initialization failed', e);
        }
      }
    }
  }, [isOpen, initialAccessType, currentUser, prefillEmail, loginWithGoogle]);

  if (!isOpen) return null;

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (accessType === 'DIGITAL') {
        onClose();
        navigate('/subscribe');
        return;
      }

      const token = localStorage.getItem('token') || window.localStorage.getItem('vartmaan-auth-token') || '';
      const price = 499;

      if (!screenshot) throw new Error('Payment proof is required for Print tier');
      const formData = new FormData();
      formData.append('file', screenshot);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('plan', 'PRINT');

      const res = await fetch(API_BASE + '/api/subscriptions', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!res.ok) throw new Error('API request failed');
      toast.success('Submitted. Waiting for approval');
      onClose();
      navigate('/profile');
    } catch (err: any) {
      toast.error(err.message || 'Subscription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex animate-in fade-in items-center justify-center bg-[#001f3f]/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-4xl overflow-hidden rounded-[24px] bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 p-2 text-gray-400 hover:text-red-600 transition-colors">
          <X size={24} />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* LEFT SIDE - SELECTION */}
          <div className="bg-[#f8fafc] p-8 md:p-10 border-r border-[#e2e8f0]">
            <h2 className="text-3xl font-black text-[#001f3f] serif mb-8">Choose Your Access</h2>
            
            <div className="space-y-4">
              {/* SECTION 1 - DIGITAL */}
              <button 
                type="button"
                onClick={() => setAccessType('DIGITAL')}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                  accessType === 'DIGITAL' 
                    ? 'border-[#800000] bg-red-50/50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block bg-[#800000] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded mb-2">Free for Everyone</span>
                    <h3 className="text-xl font-black text-[#0f172a]">Read Online (Free)</h3>
                    <p className="text-sm text-gray-500 mt-2">Access all digital content instantly without any extra cost.</p>
                  </div>
                  {accessType === 'DIGITAL' && <CheckCircle2 className="text-[#800000]" size={24} />}
                </div>
              </button>
|
              {/* SECTION 2 - PRINT */}
              <button 
                type="button"
                onClick={() => setAccessType('PHYSICAL')}
                className={`w-full text-left p-6 rounded-2xl border-2 transition-all ${
                  accessType === 'PHYSICAL' 
                    ? 'border-[#001f3f] bg-blue-50/50 shadow-sm' 
                    : 'border-gray-200 bg-white hover:border-blue-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-black text-[#0f172a]">Get Print (₹499/month)</h3>
                    <ul className="text-sm text-gray-500 mt-2 space-y-1">
                      <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600"/> Monthly magazine delivery</li>
                      <li className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-green-600"/> Includes digital access</li>
                    </ul>
                  </div>
                  {accessType === 'PHYSICAL' && <CheckCircle2 className="text-[#001f3f]" size={24} />}
                </div>
              </button>
            </div>
          </div>

          {/* RIGHT SIDE - FORM/ACTION */}
          <div className="p-8 md:p-10 flex flex-col justify-center bg-white">
            {!currentUser ? (
              <div className="w-full max-w-sm mx-auto space-y-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-50 text-[#001f3f] rounded-full flex items-center justify-center mx-auto mb-4">
                    <UserIcon size={32} />
                  </div>
                  <h3 className="text-2xl font-black text-[#0f172a]">Sign in to Subscribe</h3>
                  <p className="text-gray-500 mt-2 text-sm">Create an account or sign in to activate your membership and access exclusive content.</p>
                </div>
                
                {GOOGLE_CLIENT_ID ? (
                  <div className="mt-8">
                    <div ref={googleButtonRef} className="w-full flex justify-center" />
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-500 text-center">
                    Google Sign-in Configuration Missing
                  </div>
                )}
                
                <p className="text-center text-xs text-gray-400 mt-6">
                  By joining, you agree to our Terms of Service and Privacy Policy. Staff members can sign in using the dashboard link.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="w-full">
                {accessType === 'DIGITAL' ? (
                  <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-red-100 text-[#800000] rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-[#0f172a]">Ready to read?</h3>
                    <p className="text-gray-500">You selected the free digital plan. Click below to get instant access to our articles and digital magazines.</p>
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full bg-[#800000] text-white py-4 rounded-xl font-bold hover:bg-red-900 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Activating...' : 'Activate Free Access'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-[#001f3f] mb-4">Delivery Details</h3>
                    <div className="grid grid-cols-2 gap-3">
                      <input required minLength={2} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#001f3f]" placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
                      <input required type="tel" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#001f3f]" placeholder="Phone Number" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <input required type="email" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#001f3f]" placeholder="Email Address" value={email} onChange={e => setEmail(e.target.value)} />
                    <textarea className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#001f3f] h-20 resize-none" placeholder="Delivery Address (Optional)" value={address} onChange={e => setAddress(e.target.value)} />
                    
                    <div className="mt-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Payment Screenshot Upload</label>
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-6 h-6 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500 font-medium">{screenshot ? screenshot.name : 'Click to upload proof'}</p>
                        </div>
                        <input required type="file" className="hidden" accept="image/*" onChange={e => setScreenshot(e.target.files?.[0] || null)} />
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={isSubmitting || !screenshot}
                      className="w-full mt-6 bg-[#001f3f] text-white py-4 rounded-xl font-bold hover:bg-blue-900 transition-colors disabled:opacity-50"
                    >
                      {isSubmitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthAccessModal;
