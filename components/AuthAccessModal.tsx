import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, Lock, Mail, ShieldCheck, Upload, User as UserIcon, X } from 'lucide-react';
import { useApp } from '../AppContext';
import { toast } from 'react-hot-toast';
import { API_BASE, GOOGLE_CLIENT_ID } from '../utils/app';

export type AccessType = 'DIGITAL' | 'PHYSICAL';
export type AuthModalView = 'subscribe' | 'login';

export type MainAuthTab = 'signin' | 'signup' | 'membership';

export interface AuthAccessModalLaunchOptions {
  initialView?: AuthModalView;
  initialAccessType?: AccessType;
  /** Which tab to show when opening the modal */
  initialMainTab?: MainAuthTab;
  prefillEmail?: string;
}

interface AuthAccessModalProps extends AuthAccessModalLaunchOptions {
  isOpen: boolean;
  onClose: () => void;
}

const AuthAccessModal: React.FC<AuthAccessModalProps> = ({
  isOpen,
  onClose,
  initialView = 'subscribe',
  initialAccessType = 'DIGITAL',
  initialMainTab,
  prefillEmail
}) => {
  const { currentUser, login, loginWithGoogle, registerReader } = useApp();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const resolveMainTab = (): MainAuthTab => {
    if (initialMainTab) return initialMainTab;
    if (initialView === 'login') return 'signin';
    return 'membership';
  };

  const [mainTab, setMainTab] = React.useState<MainAuthTab>(resolveMainTab);
  const [accessType, setAccessType] = React.useState<AccessType>(initialAccessType);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState(prefillEmail || '');
  const [phone, setPhone] = React.useState('');
  const [address, setAddress] = React.useState('');
  const [signInPassword, setSignInPassword] = React.useState('');
  const [signUpPassword, setSignUpPassword] = React.useState('');
  const [signUpConfirm, setSignUpConfirm] = React.useState('');
  const [screenshot, setScreenshot] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const googleSignInRef = React.useRef<HTMLDivElement>(null);
  const googleSignUpRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isOpen) return;
    setMainTab(resolveMainTab());
    setAccessType(initialAccessType);
    setEmail((e) => prefillEmail || e || '');
    setName(currentUser?.name || '');
  }, [isOpen, initialView, initialAccessType, initialMainTab, prefillEmail, currentUser?.name]);

  const initGoogleButton = React.useCallback(
    (el: HTMLDivElement | null) => {
      if (!el || !GOOGLE_CLIENT_ID || currentUser) return;
      try {
        const g = window.google;
        g?.accounts?.id?.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: { credential: string }) => {
            try {
              await loginWithGoogle(response.credential);
              toast.success(t('authAccess.signedIn', 'Signed in'));
              onClose();
              navigate('/profile');
            } catch (e: unknown) {
              toast.error(e instanceof Error ? e.message : 'Google sign-in failed');
            }
          }
        });
        el.innerHTML = '';
        g?.accounts?.id?.renderButton(el, {
          theme: 'outline',
          size: 'large',
          width: Math.min(el.offsetWidth || 320, 400),
          text: 'continue_with'
        });
      } catch (e) {
        console.error('Google Sign-In init failed', e);
      }
    },
    [GOOGLE_CLIENT_ID, currentUser, loginWithGoogle, navigate, onClose, t]
  );

  React.useEffect(() => {
    if (!isOpen || currentUser) return;
    const t = setTimeout(() => {
      if (mainTab === 'signin') initGoogleButton(googleSignInRef.current);
      if (mainTab === 'signup') initGoogleButton(googleSignUpRef.current);
    }, 0);
    return () => clearTimeout(t);
  }, [isOpen, mainTab, currentUser, initGoogleButton]);

  if (!isOpen) return null;

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !signInPassword) {
      toast.error(t('authAccess.fillAll', 'Enter email and password'));
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), signInPassword);
      toast.success(t('authAccess.signedIn', 'Signed in'));
      onClose();
      navigate('/profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !signUpPassword) {
      toast.error(t('authAccess.fillAll', 'Fill all required fields'));
      return;
    }
    if (signUpPassword !== signUpConfirm) {
      toast.error(t('authAccess.passwordMismatch', 'Passwords do not match'));
      return;
    }
    if (signUpPassword.length < 6) {
      toast.error(t('authAccess.passwordShort', 'Password must be at least 6 characters'));
      return;
    }
    setIsSubmitting(true);
    try {
      await registerReader({ email: email.trim(), password: signUpPassword, name: name.trim() });
      toast.success(t('authAccess.checkEmail', 'Check your email to verify your account.'));
      setMainTab('signin');
      setSignUpPassword('');
      setSignUpConfirm('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (accessType === 'DIGITAL') {
        onClose();
        navigate('/subscribe');
        return;
      }

      if (!currentUser) {
        toast.error(t('authAccess.signInForPrint', 'Sign in to request print delivery'));
        setMainTab('signin');
        return;
      }

      if (!screenshot) throw new Error('Payment proof is required for print');
      const token = localStorage.getItem('token') || '';
      const formData = new FormData();
      formData.append('file', screenshot);
      formData.append('name', name);
      formData.append('email', email);
      formData.append('phone', phone);
      formData.append('address', address);
      formData.append('plan', 'PRINT');

      const res = await fetch(`${API_BASE}/api/subscriptions`, {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });
      if (!res.ok) throw new Error('Request failed');
      toast.success(t('authAccess.printSubmitted', 'Request submitted'));
      onClose();
      navigate('/profile');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabClass = (tab: MainAuthTab) =>
    `flex-1 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
      mainTab === tab ? 'bg-[#800000] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
    }`;

  return (
    <div
      className="fixed inset-0 z-[300] flex animate-in fade-in items-center justify-center bg-[#001f3f]/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
          aria-label="Close"
        >
          <X size={22} />
        </button>

        <div className="p-6 md:p-8">
          <div className="mb-6 flex flex-col gap-3 border-b border-gray-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-black text-[#001f3f] serif">
                {t('authAccess.title', 'Account & membership')}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {t('authAccess.subtitle', 'Sign in, create a reader account, or choose a plan. Staff use the dedicated staff login page.')}
              </p>
            </div>
          </div>

          <div className="mb-6 flex flex-col gap-2 sm:flex-row">
            <button type="button" className={tabClass('signin')} onClick={() => setMainTab('signin')}>
              {t('authAccess.tabSignIn', 'Sign in')}
            </button>
            <button type="button" className={tabClass('signup')} onClick={() => setMainTab('signup')}>
              {t('authAccess.tabCreateAccount', 'Create account')}
            </button>
            <button
              type="button"
              className={tabClass('membership')}
              onClick={() => setMainTab('membership')}
            >
              {t('authAccess.tabMembership', 'Plans & print')}
            </button>
          </div>

          {mainTab === 'signin' && !currentUser && (
            <div className="grid gap-6 md:grid-cols-2">
              <form
                onSubmit={handleEmailSignIn}
                className="space-y-4 rounded-2xl border border-gray-200 bg-slate-50/80 p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#0f172a]">{t('authAccess.emailSignIn', 'Email sign in')}</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t('common.email', 'Email')}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#800000]"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">
                    {t('common.password', 'Password')}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#800000]"
                      autoComplete="current-password"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#800000] py-3 text-sm font-bold text-white transition hover:bg-red-900 disabled:opacity-50"
                >
                  {isSubmitting ? t('authAccess.working', '…') : t('authAccess.signIn', 'Sign in')}
                </button>
              </form>
              <div className="flex flex-col justify-center space-y-4 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                <h3 className="text-lg font-bold text-[#0f172a]">{t('authAccess.continueWithGoogle', 'Continue with Google')}</h3>
                <p className="text-sm text-gray-500">
                  {t('authAccess.googleBlurb', 'One-tap sign in or new account with your Google profile.')}
                </p>
                <div ref={googleSignInRef} className="mx-auto w-full min-h-[40px] flex justify-center" />
                {!GOOGLE_CLIENT_ID && (
                  <p className="text-xs text-amber-700">{t('authAccess.googleMissing', 'Set VITE_GOOGLE_CLIENT_ID for production.')}</p>
                )}
              </div>
            </div>
          )}

          {mainTab === 'signup' && !currentUser && (
            <div className="grid gap-6 md:grid-cols-2">
              <form
                onSubmit={handleRegister}
                className="space-y-4 rounded-2xl border border-gray-200 bg-slate-50/80 p-6 shadow-sm"
              >
                <h3 className="text-lg font-bold text-[#0f172a]">{t('authAccess.createReader', 'Create a reader account')}</h3>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-[#800000]"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#800000]"
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Password</label>
                  <input
                    type="password"
                    required
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#800000]"
                    autoComplete="new-password"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-gray-500">Confirm</label>
                  <input
                    type="password"
                    required
                    value={signUpConfirm}
                    onChange={(e) => setSignUpConfirm(e.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-3 text-sm outline-none focus:border-[#800000]"
                    autoComplete="new-password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#001f3f] py-3 text-sm font-bold text-white transition hover:bg-blue-900 disabled:opacity-50"
                >
                  {t('authAccess.register', 'Create account')}
                </button>
              </form>
              <div className="flex flex-col justify-center space-y-4 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center">
                <h3 className="text-lg font-bold text-[#0f172a]">Google</h3>
                <p className="text-sm text-gray-500">{t('authAccess.googleSignUp', 'Prefer Google? Use the same button — new users are registered automatically.')}</p>
                <div ref={googleSignUpRef} className="mx-auto w-full min-h-[40px] flex justify-center" />
              </div>
            </div>
          )}

          {mainTab === 'membership' && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-2xl bg-slate-50 p-6">
                <h3 className="text-lg font-black text-[#001f3f]">{t('authAccess.choosePlan', 'Choose a plan')}</h3>
                <button
                  type="button"
                  onClick={() => setAccessType('DIGITAL')}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                    accessType === 'DIGITAL'
                      ? 'border-[#800000] bg-red-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-red-200'
                  }`}
                >
                  <span className="mb-1 inline-block rounded bg-[#800000] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                    Free
                  </span>
                  <p className="text-lg font-black text-[#0f172a]">Digital access</p>
                  <p className="text-sm text-gray-500">Read online; continue on the subscription page.</p>
                  {accessType === 'DIGITAL' && <CheckCircle2 className="mt-2 text-[#800000]" size={20} />}
                </button>
                <button
                  type="button"
                  onClick={() => setAccessType('PHYSICAL')}
                  className={`w-full rounded-2xl border-2 p-5 text-left transition ${
                    accessType === 'PHYSICAL'
                      ? 'border-[#001f3f] bg-blue-50/50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <p className="text-lg font-black text-[#0f172a]">Print — ₹499/mo</p>
                  <p className="text-sm text-gray-500">Delivered; includes digital. Sign in to submit payment proof.</p>
                  {accessType === 'PHYSICAL' && <CheckCircle2 className="mt-2 text-[#001f3f]" size={20} />}
                </button>
              </div>
              <div>
                {!currentUser ? (
                  <div className="space-y-4 rounded-2xl border border-gray-200 p-6 text-center">
                    {accessType === 'DIGITAL' ? (
                      <>
                        <p className="text-sm text-gray-600">
                          {t('authAccess.freeDigitalBlurb', 'Browse free content or open the full subscription page.')}
                        </p>
                        <Link
                          to="/subscribe"
                          className="inline-flex w-full justify-center rounded-xl bg-[#800000] px-4 py-3 text-sm font-bold text-white"
                          onClick={onClose}
                        >
                          {t('authAccess.continueSubscribe', 'Continue to subscription')}
                        </Link>
                        <p className="text-xs text-gray-400">{t('authAccess.or', 'or')}</p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600">
                        {t('authAccess.signInForPlan', 'Sign in or create an account to submit a print request.')}
                      </p>
                    )}
                    <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                      <button
                        type="button"
                        onClick={() => setMainTab('signin')}
                        className="rounded-xl bg-[#800000] px-4 py-2 text-sm font-bold text-white"
                      >
                        {t('authAccess.tabSignIn', 'Sign in')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setMainTab('signup')}
                        className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700"
                      >
                        {t('authAccess.tabCreateAccount', 'Create account')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubscribe} className="space-y-4 rounded-2xl border border-gray-200 p-6">
                    {accessType === 'DIGITAL' ? (
                      <div className="text-center">
                        <ShieldCheck className="mx-auto text-[#800000]" size={40} />
                        <h4 className="mt-2 font-bold text-[#0f172a]">Free digital</h4>
                        <p className="text-sm text-gray-500">You are signed in. Continue to the full subscription page.</p>
                        <button
                          type="submit"
                          className="mt-4 w-full rounded-xl bg-[#800000] py-3 font-bold text-white"
                        >
                          Continue
                        </button>
                      </div>
                    ) : (
                      <>
                        <h4 className="font-bold text-[#001f3f]">Print delivery</h4>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            required
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                          />
                          <input
                            required
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
                            placeholder="Phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                          />
                        </div>
                        <input
                          required
                          type="email"
                          className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                        />
                        <textarea
                          className="h-20 w-full resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm"
                          placeholder="Address"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                        />
                        <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-gray-300 py-6">
                          <Upload className="h-6 w-6 text-gray-400" />
                          <span className="text-xs text-gray-500">{screenshot ? screenshot.name : 'Payment screenshot'}</span>
                          <input
                            type="file"
                            className="hidden"
                            accept="image/jpeg,image/png,application/pdf"
                            onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full rounded-xl bg-[#001f3f] py-3 font-bold text-white disabled:opacity-50"
                        >
                          {isSubmitting ? '…' : 'Submit request'}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </div>
          )}

          {(currentUser && (mainTab === 'signin' || mainTab === 'signup')) && (
            <p className="mt-4 text-center text-sm text-gray-500">
              {t('authAccess.alreadyIn', 'You are already signed in.')}{' '}
              <button type="button" className="font-bold text-[#800000] underline" onClick={() => navigate('/profile')}>
                Profile
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthAccessModal;
