import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, BookOpen, CheckCircle, Lock, Mail, MessageSquare, Smartphone, Upload, User as UserIcon, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { API_BASE, formatCurrencyINR } from '../utils/app';
import { fetchApi } from '../utils/api';

interface SubscriptionWallProps {
  isOpen: boolean;
  onClose: () => void;
  onAccessGranted?: () => void;
  resourceId: string;
  resourceTitle: string;
  resourceType: 'MAGAZINE' | 'NEWS';
  digitalPrice: number;
  physicalPrice: number;
  digitalLabel: string;
}

const SubscriptionWall: React.FC<SubscriptionWallProps> = ({
  isOpen,
  onClose,
  onAccessGranted,
  resourceId,
  resourceTitle,
  resourceType,
  digitalPrice,
  physicalPrice,
  digitalLabel
}) => {
  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const { currentUser, activateDigitalSubscription } = useApp();
  const { t } = useTranslation();
  const [accessType, setAccessType] = React.useState<'DIGITAL' | 'PHYSICAL'>('DIGITAL');
  const [name, setName] = React.useState(currentUser?.name || '');
  const [email, setEmail] = React.useState(currentUser?.email || '');
  const [phone, setPhone] = React.useState('');
  const [message, setMessage] = React.useState('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [submitError, setSubmitError] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;
    setAccessType('DIGITAL');
    setName(currentUser?.name || '');
    setEmail(currentUser?.email || '');
    setPhone('');
    setMessage('');
    setScreenshot(null);
    setIsSubmitting(false);
    setIsSubmitted(false);
    setSubmitError('');
  }, [currentUser?.email, currentUser?.name, isOpen]);

  if (!isOpen) return null;

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(t('subscription.readError')));
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!name.trim() || !email.trim() || !phone.trim()) {
        throw new Error(t('subscription.validationError'));
      }

      if (!isValidEmail(email)) {
        throw new Error(t('subscription.invalidEmail'));
      }

      if (accessType === 'DIGITAL') {
        await activateDigitalSubscription({ name, email, phone });
        setIsSubmitted(true);
        window.setTimeout(() => {
          onAccessGranted?.();
          onClose();
        }, 1200);
        return;
      }

      await fetchApi<void>(API_BASE + '/api/unlock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone,
          accessType,
          message,
          screenshotName: screenshot?.name,
          screenshotData: screenshot ? await readFileAsDataUrl(screenshot) : undefined,
          resourceId,
          resourceTitle,
          resourceType
        })
      });

      setIsSubmitted(true);
      window.setTimeout(() => {
        onClose();
      }, 1600);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : t('subscription.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center bg-[#001f3f]/90 backdrop-blur-lg p-4">
      <div className="bg-white rounded-[28px] max-w-xl w-full relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.45)]">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-600 transition-colors z-20" aria-label={t('common.close')}>
          <X size={24} />
        </button>

        {isSubmitted ? (
          <div className="p-14 text-center">
            <div className="w-20 h-20 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-7">
              <CheckCircle size={44} />
            </div>
            <h3 className="text-3xl font-black text-[#001f3f] serif mb-4">
              {accessType === 'DIGITAL' ? t('subscription.digitalActivated') : t('subscription.requestReceived')}
            </h3>
            <p className="text-gray-500 text-lg">
              {accessType === 'DIGITAL' ? t('subscription.digitalSuccess') : t('subscription.physicalSuccess')}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 md:p-10 overflow-y-auto max-h-[90vh]">
            <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-red-50 text-[#800000] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock size={30} />
              </div>
              <h3 className="text-3xl font-black text-[#001f3f] serif">{t('subscription.unlockTitle')}</h3>
              <p className="text-gray-400 mt-2 font-medium">
                {t('subscription.unlockBody', { title: resourceTitle })}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-7">
              <button
                type="button"
                onClick={() => setAccessType('DIGITAL')}
                className={`rounded-[20px] border-2 p-6 text-left transition-all ${accessType === 'DIGITAL' ? 'border-[#800000] bg-red-50/60' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="text-[10px] uppercase tracking-[0.24em] font-black text-[#800000] mb-3">{t('subscription.digital')}</div>
                <p className="text-3xl font-black text-[#001f3f]">{digitalPrice === 0 ? t('subscription.free') : formatCurrencyINR(digitalPrice)}</p>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{digitalLabel}</p>
              </button>
              <button
                type="button"
                onClick={() => setAccessType('PHYSICAL')}
                className={`rounded-[20px] border-2 p-6 text-left transition-all ${accessType === 'PHYSICAL' ? 'border-[#001f3f] bg-blue-50/40' : 'border-gray-100 bg-gray-50'}`}
              >
                <div className="text-[10px] uppercase tracking-[0.24em] font-black text-[#001f3f] mb-3">{t('subscription.physicalCopy')}</div>
                <p className="text-3xl font-black text-[#001f3f]">{formatCurrencyINR(physicalPrice)}</p>
                <p className="text-xs text-gray-500 mt-3 leading-relaxed">{t('subscription.physicalCardBody')}</p>
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input required type="text" placeholder={t('subscription.fullName')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000]" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                  <input required type="email" placeholder={t('subscription.emailAddress')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000]" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                <input required type="tel" placeholder={t('subscription.phoneNumber')} className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000]" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {accessType === 'PHYSICAL' && (
                <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100">
                  <label className="text-[10px] font-black uppercase text-[#800000] tracking-widest block mb-3">{t('subscription.uploadPaymentScreenshot')}</label>
                  <div className="relative h-32 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center group hover:border-[#800000] transition-colors bg-white">
                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => setScreenshot(e.target.files?.[0] || null)} />
                    <div className="text-center p-4">
                      <Upload className="mx-auto text-gray-300 group-hover:text-[#800000] mb-2" size={24} />
                      <p className="text-xs text-gray-400 font-bold">{screenshot ? screenshot.name : t('subscription.clickToUpload')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="relative">
                <MessageSquare className="absolute left-4 top-4 text-gray-300" size={18} />
                <textarea
                  placeholder={accessType === 'DIGITAL' ? t('subscription.digitalNotePlaceholder') : t('subscription.physicalNotePlaceholder')}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-0 focus:ring-2 focus:ring-[#800000] min-h-[120px] resize-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              {submitError && <p className="text-sm text-red-600 font-medium">{submitError}</p>}

              <button
                type="submit"
                disabled={isSubmitting || (accessType === 'PHYSICAL' && !screenshot)}
                className="w-full bg-[#001f3f] text-white py-5 rounded-[20px] font-black shadow-2xl hover:bg-blue-900 transition-all text-sm uppercase tracking-widest flex items-center justify-center space-x-3 disabled:opacity-60"
              >
                <span>
                  {isSubmitting
                    ? t('subscription.submitting')
                    : accessType === 'DIGITAL'
                      ? t('subscription.activateDigital')
                      : t('subscription.submitPhysical')}
                </span>
                <ArrowRight size={18} />
              </button>

              <div className="rounded-2xl bg-[#001f3f]/5 px-5 py-4 text-sm text-gray-600">
                <div className="flex items-start gap-3">
                  <BookOpen size={18} className="mt-0.5 text-[#800000]" />
                  <p>{t('subscription.info')}</p>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubscriptionWall;
