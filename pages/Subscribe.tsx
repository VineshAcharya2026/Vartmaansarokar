import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Check, Mail, Smartphone, MapPin, Loader2, ArrowRight, Upload, X } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

type PlanType = 'DIGITAL' | 'PRINT';

export default function Subscribe() {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<PlanType>('DIGITAL');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [screenshot, setScreenshot] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plan === 'PRINT' && !screenshot) {
      toast.error('Please upload payment screenshot for Print plan');
      return;
    }
    
    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('email', formData.email);
      data.append('phone', formData.phone);
      data.append('plan', plan);
      if (formData.address) data.append('address', formData.address);
      if (screenshot) data.append('file', screenshot);

      await api.post('/api/subscriptions', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Subscription failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-20 px-4 text-center animate-in fade-in zoom-in duration-500">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
          <Check size={40} />
        </div>
        <h2 className="text-3xl md:text-4xl font-black text-[#1A1A2E] mb-4 serif">Request Received</h2>
        <p className="text-gray-600 max-w-md mx-auto text-lg">
          Your subscription request for the <span className="font-bold text-[#800000]">{plan}</span> plan has been received. 
          Our administrators will review and approve your access shortly.
        </p>
        <div className="mt-10 p-6 bg-[#FAF7F2] rounded-2xl border border-amber-100 text-amber-800 text-sm max-w-lg">
          <p><strong>Next steps:</strong> Once approved, you will be able to log in and access all premium digital content and features.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <header className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-[#001f3f] serif mb-4 tracking-tight">
            Choose Your <span className="text-[#800000]">Plan</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Join our growing community of readers and get exclusive access to premium investigative journalism and monthly issues.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16 max-w-4xl mx-auto">
          {/* DIGITAL PLAN CARD */}
          <div 
            onClick={() => setPlan('DIGITAL')}
            className={`cursor-pointer group relative p-8 rounded-3xl border-2 transition-all duration-300 bg-white ${
              plan === 'DIGITAL' ? 'border-[#800000] shadow-2xl scale-[1.02]' : 'border-transparent shadow-sm grayscale opacity-70 scale-100 hover:grayscale-0 hover:opacity-100'
            }`}
          >
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              plan === 'DIGITAL' ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white border-gray-200'
            }`}>
              {plan === 'DIGITAL' && <Check size={14} strokeWidth={3} />}
            </div>
            
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#800000]">Read Online</span>
              <h3 className="text-3xl font-black text-[#001f3f] serif mt-1">Free Access</h3>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-600 text-sm">
                <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span>Unlimited access to all digital articles</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 text-sm">
                <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span>Daily news updates and newsletters</span>
              </li>
              <li className="flex items-start gap-3 text-gray-600 text-sm">
                <Check size={16} className="text-green-500 shrink-0 mt-0.5" />
                <span>Premium investigative reports</span>
              </li>
            </ul>
            
            <div className="text-5xl font-black text-[#001f3f]">Free</div>
          </div>

          {/* PRINT PLAN CARD */}
          <div 
            onClick={() => setPlan('PRINT')}
            className={`cursor-pointer group relative p-8 rounded-3xl border-2 transition-all duration-300 bg-[#001f3f] text-white ${
              plan === 'PRINT' ? 'border-[#800000] shadow-2xl scale-[1.02]' : 'border-transparent shadow-sm grayscale opacity-70 scale-100 hover:grayscale-0 hover:opacity-100'
            }`}
          >
            <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              plan === 'PRINT' ? 'bg-[#800000] border-[#800000] text-white' : 'bg-white/10 border-white/20'
            }`}>
              {plan === 'PRINT' && <Check size={14} strokeWidth={3} />}
            </div>
            
            <div className="mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400">Hard Copy + Digital</span>
              <h3 className="text-3xl font-black serif mt-1">Print Magazine</h3>
            </div>
            
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-200 text-sm">
                <Check size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>Monthly physical copy delivered to home</span>
              </li>
              <li className="flex items-start gap-3 text-gray-200 text-sm">
                <Check size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>Full digital access (Includes Digital plan)</span>
              </li>
              <li className="flex items-start gap-3 text-gray-200 text-sm">
                <Check size={16} className="text-red-400 shrink-0 mt-0.5" />
                <span>Early access to premium digital content</span>
              </li>
            </ul>
            
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-black">₹499</span>
              <span className="text-gray-400 text-sm">/month</span>
            </div>
          </div>
        </div>

        {/* SUBSCRIPTION FORM */}
        <div className="max-w-2xl mx-auto bg-white rounded-[32px] p-8 md:p-12 shadow-2xl border border-gray-100">
          <div className="text-center mb-10">
            <h4 className="text-2xl font-bold text-[#001f3f] serif mb-2">Complete Your Request</h4>
            <p className="text-gray-500 text-sm">Fill in your details below to get started with <span className="font-bold text-[#800000]">{plan === 'DIGITAL' ? 'Digital Access' : 'Print Delivery'}</span>.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#001f3f] uppercase tracking-wider ml-1">
                  <span className="p-1 rounded bg-[#FAF7F2]"><Check size={12} /></span> Full Name
                </label>
                <input 
                  required 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter your name" 
                  className="w-full bg-[#FAF7F2] border-transparent focus:bg-white focus:border-[#800000] focus:ring-0 rounded-xl px-4 py-3.5 transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-[#001f3f] uppercase tracking-wider ml-1">
                  <span className="p-1 rounded bg-[#FAF7F2]"><Mail size={12} /></span> Email Address
                </label>
                <input 
                  required 
                  type="email" 
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  placeholder="name@example.com" 
                  className="w-full bg-[#FAF7F2] border-transparent focus:bg-white focus:border-[#800000] focus:ring-0 rounded-xl px-4 py-3.5 transition-all text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#001f3f] uppercase tracking-wider ml-1">
                <span className="p-1 rounded bg-[#FAF7F2]"><Smartphone size={12} /></span> Phone Number
              </label>
              <input 
                required 
                type="tel" 
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
                placeholder="+91 00000 00000" 
                className="w-full bg-[#FAF7F2] border-transparent focus:bg-white focus:border-[#800000] focus:ring-0 rounded-xl px-4 py-3.5 transition-all text-sm"
              />
            </div>

            {plan === 'PRINT' && (
              <>
                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                  <label className="flex items-center gap-2 text-xs font-bold text-[#001f3f] uppercase tracking-wider ml-1">
                    <span className="p-1 rounded bg-[#FAF7F2]"><MapPin size={12} /></span> Delivery Address
                  </label>
                  <textarea 
                    required={plan === 'PRINT'}
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                    placeholder="Enter your full shipping address for delivery" 
                    rows={3}
                    className="w-full bg-[#FAF7F2] border-transparent focus:bg-white focus:border-[#800000] focus:ring-0 rounded-xl px-4 py-3.5 transition-all text-sm resize-none"
                  />
                </div>

                <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                   <label className="flex items-center gap-2 text-xs font-bold text-[#001f3f] uppercase tracking-wider ml-1">
                    <span className="p-1 rounded bg-[#FAF7F2]"><Upload size={12} /></span> Payment Screenshot (QR/Bank Transfer)
                  </label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={e => setScreenshot(e.target.files?.[0] || null)}
                      className="hidden"
                      id="screenshot-upload"
                    />
                    <label 
                      htmlFor="screenshot-upload"
                      className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-2xl p-8 bg-[#FAF7F2] hover:bg-white hover:border-[#800000] cursor-pointer transition-all"
                    >
                      {screenshot ? (
                        <div className="flex items-center gap-2 text-[#800000] font-bold">
                          <Check size={20} />
                          <span>{screenshot.name}</span>
                          <button type="button" onClick={(e) => { e.preventDefault(); setScreenshot(null); }} className="hover:text-red-700 ml-2">
                             <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <>
                          <Upload className="text-gray-400 mb-2" size={32} />
                          <span className="text-gray-500 text-sm font-medium">Click to upload transfer receipt</span>
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </>
            )}

            <button 
              disabled={loading}
              type="submit" 
              className="w-full bg-[#800000] text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[#600000] shadow-xl hover:shadow-[#800000]/20 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <Loader2 size={24} className="animate-spin" />
              ) : (
                <>
                  <span>Request Subscription</span>
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 font-medium">
              By clicking request, you agree to our Terms of Service and Privacy Policy. Await admin approval for activation.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
