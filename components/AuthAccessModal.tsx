import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, User as UserIcon, X } from 'lucide-react';
import { useApp } from '../vartmaan-frontend-app-context';
import { toast } from 'react-hot-toast';
import { GOOGLE_CLIENT_ID } from '../utils/app';

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

const AuthAccessModal: React.FC<AuthAccessModalProps> = ({
  isOpen,
  onClose,
  initialAccessType = 'DIGITAL',
  prefillEmail,
  prefillPassword
}) => {
  const { currentUser, login, loginWithGoogle } = useApp();
  const navigate = useNavigate();

  const [accessType, setAccessType] = React.useState<AccessType>(initialAccessType);
  const [email, setEmail] = React.useState(prefillEmail || '');
  const [password, setPassword] = React.useState(prefillPassword || '');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const pendingGoogleAccess = React.useRef<AccessType>(initialAccessType);

  React.useEffect(() => {
    if (!isOpen) return;
    setAccessType(initialAccessType);
    setEmail(currentUser?.email || prefillEmail || '');
    setPassword(prefillPassword || '');

    if (!currentUser && GOOGLE_CLIENT_ID) {
      try {
        // @ts-ignore
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response: any) => {
            try {
              const selectedAccess = pendingGoogleAccess.current;
              await loginWithGoogle(response.credential);
              onClose();
              navigate(selectedAccess === 'PHYSICAL' ? '/subscribe?plan=PRINT' : '/subscribe?plan=DIGITAL');
            } catch (error: any) {
              toast.error(error?.message || 'Google sign-in failed');
            }
          }
        });
      } catch (error) {
        console.error('Google Sign-In initialization failed', error);
      }
    }
  }, [isOpen, initialAccessType, currentUser, prefillEmail, prefillPassword, loginWithGoogle, navigate, onClose]);

  if (!isOpen) return null;

  const routeByAccess = (selectedAccess: AccessType) => {
    onClose();
    navigate(selectedAccess === 'PHYSICAL' ? '/subscribe?plan=PRINT' : '/subscribe?plan=DIGITAL');
  };

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Email and password are required.');
      return;
    }
    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      routeByAccess(accessType);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Sign in failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = (selectedAccess: AccessType) => {
    pendingGoogleAccess.current = selectedAccess;
    setAccessType(selectedAccess);
    if (!GOOGLE_CLIENT_ID) {
      toast.error('Google Sign-in is not configured.');
      return;
    }
    try {
      // @ts-ignore
      google.accounts.id.prompt();
    } catch (error) {
      toast.error('Google Sign-in is unavailable right now.');
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex animate-in fade-in items-center justify-center bg-[#001f3f]/80 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="relative w-full max-w-xl overflow-hidden rounded-[24px] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute right-4 top-4 z-10 p-2 text-gray-400 hover:text-red-600 transition-colors" aria-label="Close sign-in modal">
          <X size={24} />
        </button>

        <div className="p-8 md:p-10">
          <div className="text-center mb-7">
            <div className="w-14 h-14 bg-blue-50 text-[#001f3f] rounded-full flex items-center justify-center mx-auto mb-3">
              <UserIcon size={28} />
            </div>
            <h2 className="text-2xl font-black text-[#0f172a]">Welcome to Vartmaan Sarokaar</h2>
            <p className="text-sm text-gray-500 mt-2">Sign in to continue with Digital Access or Print + Digital membership.</p>
          </div>

          {currentUser ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-green-700 font-semibold">Signed in as {currentUser.email}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button type="button" onClick={() => routeByAccess('DIGITAL')} className="rounded-xl bg-[#800000] text-white py-3 font-bold hover:bg-red-900">
                  Continue to Digital Access
                </button>
                <button type="button" onClick={() => routeByAccess('PHYSICAL')} className="rounded-xl bg-[#001f3f] text-white py-3 font-bold hover:bg-black">
                  Continue to Print + Digital
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleEmailSignIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wide text-gray-500 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm"
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wide text-gray-500 mb-1">Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 pl-9 pr-3 py-2.5 text-sm"
                      placeholder="Enter password"
                      autoComplete="current-password"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setAccessType('DIGITAL')}
                    className={`rounded-xl border py-2.5 text-sm font-bold ${accessType === 'DIGITAL' ? 'border-[#800000] text-[#800000] bg-red-50' : 'border-gray-200 text-gray-600'}`}
                  >
                    Digital Access
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccessType('PHYSICAL')}
                    className={`rounded-xl border py-2.5 text-sm font-bold ${accessType === 'PHYSICAL' ? 'border-[#001f3f] text-[#001f3f] bg-blue-50' : 'border-gray-200 text-gray-600'}`}
                  >
                    Print + Digital
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-xl bg-[#001f3f] text-white py-3.5 font-black hover:bg-black disabled:opacity-60"
                >
                  {isSubmitting ? 'Signing in...' : `Sign in for ${accessType === 'PHYSICAL' ? 'Print + Digital' : 'Digital Access'}`}
                </button>
              </form>

              <div className="my-5 text-center text-xs font-bold uppercase tracking-wider text-gray-400">Or sign in with Google</div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('DIGITAL')}
                  className="rounded-xl border border-gray-200 py-3 text-sm font-bold hover:bg-gray-50"
                >
                  Google - Digital Access
                </button>
                <button
                  type="button"
                  onClick={() => handleGoogleSignIn('PHYSICAL')}
                  className="rounded-xl border border-gray-200 py-3 text-sm font-bold hover:bg-gray-50"
                >
                  Google - Print + Digital
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthAccessModal;
