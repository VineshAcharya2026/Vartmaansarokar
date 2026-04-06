import React from 'react';
import { Link } from 'react-router-dom';
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
  const { currentUser, login, loginWithGoogle, logout, activateDigitalSubscription } = useApp();
  const { t } = useTranslation();
  const googleButtonRef = React.useRef<HTMLDivElement | null>(null);
  const [view, setView] = React.useState<AuthModalView>(initialView);
  const [accessType, setAccessType] = React.useState<AccessType>(initialAccessType);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(prefillEmail || '');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState(prefillPassword || '');
  const [message, setMessage] = React.useState('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  React.useEffect(() => {
    if (!isOpen) return;

    setView(initialView);
    setAccessType(initialAccessType);
    setName(currentUser?.name || '');
    setEmail(prefillEmail || currentUser?.email || '');
    setPhone('');
    setPassword(prefillPassword || '');
    setMessage('');
    setScreenshot(null);
    setError('');
    setSuccessMessage('');
  }, [currentUser?.email, currentUser?.name, initialAccessType, initialView, isOpen, prefillEmail, prefillPassword]);

  React.useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  React.useEffect(() => {
    if (!isOpen || currentUser || view !== 'login' || !GOOGLE_CLIENT_ID || !googleButtonRef.current) {
      return;
    }

    let isMounted = true;

    const mountGoogleButton = () => {
      if (!isMounted || !googleButtonRef.current || !window.google?.accounts.id) {
        return false;
      }

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          try {
            setError('');
            setIsSubmitting(true);
            await loginWithGoogle(response.credential);
            setSuccessMessage(t('auth.googleSuccess', { defaultValue: 'Signed in with Google successfully.' }));
            window.setTimeout(() => onClose(), 900);
          } catch (googleError) {
            setError(googleError instanceof Error ? googleError.message : t('auth.googleError', { defaultValue: 'Unable to sign in with Google.' }));
          } finally {
            setIsSubmitting(false);
          }
        }
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: '100%'
      });
      return true;
    };

    if (mountGoogleButton()) {
      return () => {
        isMounted = false;
      };
    }

    const interval = window.setInterval(() => {
      if (mountGoogleButton()) {
        window.clearInterval(interval);
      }
    }, 300);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [currentUser, isOpen, loginWithGoogle, onClose, t, view]);

  if (!isOpen) return null;

  const isStaffUser =
    currentUser?.role === UserRole.MAGAZINE ||
    currentUser?.role === UserRole.ADMIN ||
    currentUser?.role === UserRole.SUPER_ADMIN;

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error(t('subscription.readError')));
      reader.readAsDataURL(file);
    });

  const handleDigitalOrPhysicalSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      if (accessType === 'DIGITAL') {
        await activateDigitalSubscription({ name, email, phone });
        setSuccessMessage(t('subscription.digitalSuccess'));
        window.setTimeout(() => onClose(), 1200);
        return;
      }

      await fetchApi<SubscriptionRequestPayload>(API_BASE + '/api/subscription-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...MEMBERSHIP_RESOURCE,
          name,
          email,
          phone,
          message,
          accessType,
          screenshotName: screenshot?.name,
          screenshotData: screenshot ? await readFileAsDataUrl(screenshot) : undefined
        })
      });

      setSuccessMessage(t('subscription.physicalSuccess'));
      window.setTimeout(() => onClose(), 1400);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : t('subscription.genericError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSubmitting(true);

    try {
      await login({ email, password });
      setSuccessMessage(t('auth.loginSuccess', { defaultValue: 'Signed in successfully.' }));
      window.setTimeout(() => onClose(), 900);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('auth.loginError', { defaultValue: 'Unable to sign in.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center bg-[#001f3f]/72 px-4 py-6 backdrop-blur-lg" onClick={onClose}>
      <div
        className="relative w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-white shadow-[0_40px_120px_-50px_rgba(0,0,0,0.55)]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-2xl border border-[#001f3f]/10 bg-white text-[#001f3f] shadow-sm transition-colors hover:bg-[#001f3f] hover:text-white"
          aria-label={t('common.close')}
        >
          <X size={20} />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.05fr,1fr]" style={{ maxHeight: '85vh', overflow: 'auto' }}>
          <div className="px-6 py-8 bg-[#001f3f] text-white md:px-8 md:py-10">
            <div>
              <span className="inline-flex rounded-full bg-[#800000] px-3 py-1 text-[10px] font-black uppercase tracking-[0.28em] text-white">
                {t('auth.membership', { defaultValue: 'Membership' })}
              </span>
              <h2 className="mt-5 text-3xl font-black leading-tight md:text-4xl text-white">
                {t('auth.popupTitle', { defaultValue: 'Choose your membership access' })}
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-slate-200 md:text-base">
                {t('subscription.info', { defaultValue: 'Pick one option below. Online access gives instant reading. Print copy needs payment proof and delivery details.' })}
              </p>

              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setAccessType('DIGITAL');
                    setView('subscribe');
                  }}
                  className={`w-full rounded-[26px] border border-white/20 bg-white p-5 text-left text-slate-900 transition-all hover:border-[#d8d8d8] hover:bg-slate-100 ${
                    accessType === 'DIGITAL' ? 'shadow-sm' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#001f3f]">
                        {t('auth.digitalAccess', { defaultValue: 'Digital access' })}
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-[#001f3f]">{t('subscription.digital')}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t('auth.digitalPitch', { defaultValue: 'Read the magazine online right away with full access.' })}
                      </p>
                    </div>
                    {accessType === 'DIGITAL' && <CheckCircle2 size={22} className="mt-1 shrink-0 text-[#001f3f]" />}
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setAccessType('PHYSICAL');
                    setView('subscribe');
                  }}
                  className={`w-full rounded-[26px] border border-white/20 bg-white p-5 text-left text-slate-900 transition-all hover:border-[#d8d8d8] hover:bg-slate-100 ${
                    accessType === 'PHYSICAL' ? 'shadow-sm' : 'border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.28em] text-[#001f3f]">
                        {t('auth.physicalCopy', { defaultValue: 'Physical Copy' })}
                      </div>
                      <h3 className="mt-2 text-xl font-bold text-[#001f3f]">{t('subscription.physicalCopy')}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600">
                        {t('auth.physicalPitch', { defaultValue: 'Upload your payment proof and we will confirm the printed magazine order.' })}
                      </p>
                    </div>
                    {accessType === 'PHYSICAL' && <CheckCircle2 size={22} className="mt-1 shrink-0 text-[#001f3f]" />}
                  </div>
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-white/20 bg-white p-4 text-center text-[#001f3f]">
                  <p className="text-xl font-black">24/7</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {t('auth.digitalReading', { defaultValue: 'Digital Reading' })}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white p-4 text-center text-[#001f3f]">
                  <p className="text-xl font-black">PDF + Print</p>
                  <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-slate-500">
                    {t('auth.magazineFormats', { defaultValue: 'Magazine Formats' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#fcfaf7] px-6 py-8 md:px-8 md:py-10">
            {currentUser ? (
              <div className="rounded-[28px] border border-[#001f3f]/10 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#800000]">
                      {translateRole(t, currentUser.role)}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#001f3f]">{currentUser.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{currentUser.email}</p>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#001f3f]/8 text-[#001f3f]">
                    <BadgeCheck size={22} />
                  </span>
                </div>

                <div className="mt-5 rounded-2xl bg-[#f6f3ee] p-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#001f3f]/55">
                    {t('auth.currentStatus', { defaultValue: 'Current Status' })}
                  </p>
                  <p className="mt-2 text-sm font-semibold text-[#001f3f]">
                    {currentUser.subscription?.status === 'ACTIVE'
                      ? t('auth.activeSubscription', { defaultValue: 'Active subscription on this account.' })
                      : t('auth.noSubscription', { defaultValue: 'No active subscription yet. Choose digital or physical access.' })}
                  </p>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {isStaffUser && (
                    <Link
                      to="/admin"
                      onClick={onClose}
                      className="inline-flex items-center gap-2 rounded-xl bg-[#001f3f] px-4 py-2.5 text-sm font-bold text-white"
                    >
                      <ShieldCheck size={16} />
                      <span>{t('common.dashboardPanel')}</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      logout();
                      setSuccessMessage('');
                      setError('');
                    }}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-[#800000]"
                  >
                    <LogOut size={16} />
                    <span>{t('common.signOut')}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[28px] border border-[#001f3f]/10 bg-white p-2 shadow-sm">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setView('subscribe')}
                    className={`rounded-[18px] px-4 py-3 text-sm font-bold transition-colors ${
                      view === 'subscribe' ? 'bg-[#001f3f] text-white' : 'text-[#001f3f] hover:bg-[#f3efe8]'
                    }`}
                  >
                    {t('common.subscribe')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('login')}
                    className={`rounded-[18px] px-4 py-3 text-sm font-bold transition-colors ${
                      view === 'login' ? 'bg-[#001f3f] text-white' : 'text-[#001f3f] hover:bg-[#f3efe8]'
                    }`}
                  >
                    {t('common.signIn')}
                  </button>
                </div>
              </div>
            )}

            <div className="mt-5">
              {currentUser || view === 'subscribe' ? (
                <form onSubmit={handleDigitalOrPhysicalSubmit} className="space-y-4 rounded-[28px] border border-[#001f3f]/10 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#800000]">
                      {accessType === 'DIGITAL'
                        ? t('auth.digitalAccess', { defaultValue: 'Digital Access' })
                        : t('auth.physicalCopy', { defaultValue: 'Magazine Physical Copy' })}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#001f3f]">
                      {accessType === 'DIGITAL'
                        ? t('auth.subscribeDigitalTitle', { defaultValue: 'Subscribe to Digital Access' })
                        : t('auth.subscribePhysicalTitle', { defaultValue: 'Request a Physical Magazine Copy' })}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <label className="relative block">
                      <UserIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        required
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t('subscription.fullName')}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] py-3 pl-12 pr-4 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                      />
                    </label>
                    <label className="relative block">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input
                        required
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t('subscription.emailAddress')}
                        className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] py-3 pl-12 pr-4 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                      />
                    </label>
                  </div>

                  <label className="relative block">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      required
                      type="tel"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder={t('subscription.phoneNumber')}
                      className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] py-3 pl-12 pr-4 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                    />
                  </label>

                  {accessType === 'PHYSICAL' && (
                    <label className="block rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] p-4 transition-colors hover:border-[#001f3f]/25">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#001f3f]/8 text-[#001f3f]">
                          <Upload size={18} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[#001f3f]">{t('subscription.uploadPaymentScreenshot')}</p>
                          <p className="truncate text-xs text-gray-500">
                            {screenshot ? screenshot.name : t('subscription.clickToUpload')}
                          </p>
                        </div>
                      </div>
                      <input type="file" className="mt-3 w-full text-sm text-[#001f3f]" onChange={(event) => setScreenshot(event.target.files?.[0] || null)} />
                    </label>
                  )}

                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder={
                      accessType === 'DIGITAL'
                        ? t('subscription.digitalNotePlaceholder')
                        : t('subscription.physicalNotePlaceholder')
                    }
                    className="min-h-[120px] w-full rounded-2xl border border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                  />

                  {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  {successMessage && <p className="text-sm font-medium text-green-700">{successMessage}</p>}

                  <button
                    type="submit"
                    disabled={isSubmitting || (accessType === 'PHYSICAL' && !screenshot)}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001f3f] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0b2c52] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>
                      {isSubmitting
                        ? t('subscription.submitting')
                        : accessType === 'DIGITAL'
                          ? t('subscription.activateDigital')
                          : t('subscription.submitPhysical')}
                    </span>
                    <ArrowRight size={16} />
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4 rounded-[28px] border border-[#001f3f]/10 bg-white p-6 shadow-sm">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#800000]">
                      {t('auth.loginLabel', { defaultValue: 'Secure Login' })}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[#001f3f]">
                      {t('auth.loginTitle', { defaultValue: 'Sign in to your account' })}
                    </h3>
                  </div>

                  {staffLabel && (
                    <div className="rounded-2xl bg-[#f6f3ee] px-4 py-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#800000]">{staffLabel}</p>
                      <p className="mt-1 text-sm text-[#001f3f]">
                        {t('auth.staffPasswordHint', {
                          defaultValue: 'Use the assigned staff email with the provided password.'
                        })}
                      </p>
                    </div>
                  )}

                  <label className="relative block">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder={t('subscription.emailAddress')}
                      className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] py-3 pl-12 pr-4 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                    />
                  </label>

                  <label className="relative block">
                    <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="Password"
                      className="w-full rounded-2xl border border-gray-200 bg-[#fafafa] py-3 pl-12 pr-4 text-sm text-[#001f3f] outline-none transition-colors focus:border-[#800000]"
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#001f3f] px-4 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#0b2c52] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{isSubmitting ? t('common.loading') : t('common.signIn')}</span>
                    <ArrowRight size={16} />
                  </button>

                  {GOOGLE_CLIENT_ID ? (
                    <div className="rounded-2xl border border-gray-200 bg-[#fafafa] p-3">
                      <div ref={googleButtonRef} />
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-gray-200 bg-[#fafafa] px-4 py-3 text-sm text-gray-500">
                      {t('auth.googleConfigHint', {
                        defaultValue: 'Google sign-in will appear after GOOGLE_CLIENT_ID and VITE_GOOGLE_CLIENT_ID are configured.'
                      })}
                    </div>
                  )}

                  {error && <p className="text-sm font-medium text-red-600">{error}</p>}
                  {successMessage && <p className="text-sm font-medium text-green-700">{successMessage}</p>}
                </form>
              )}
            </div>

            {!currentUser && (
              <p className="mt-4 text-center text-xs text-gray-500">
                {t('auth.staffAccountsHint', {
                  defaultValue: 'Staff accounts can be opened from the footer shortcuts.'
                })}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthAccessModal;
