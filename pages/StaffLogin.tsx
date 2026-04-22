import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { useApp } from '../AppContext';
import { STAFF_DEV_DEMO_PASSWORD, STAFF_LOGIN_EMAILS } from '../utils/app';

const StaffLogin = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, login } = useApp();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const staffRoles = ['SUPER_ADMIN', 'ADMIN', 'EDITOR'] as const;

  /** If already signed in, send staff to dashboard (or return URL only if it is an admin route). */
  React.useEffect(() => {
    if (!currentUser) return;
    if (staffRoles.includes(currentUser.role as (typeof staffRoles)[number])) {
      const from = location.state?.from?.pathname;
      const target =
        typeof from === 'string' && from.startsWith('/admin') ? from : '/admin';
      navigate(target, { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }, [currentUser, navigate, location.state]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email.trim()) {
      setError(t('staffLogin.emailError'));
      return;
    }

    if (!password.trim()) {
      setError(t('staffLogin.passwordError'));
      return;
    }

    setLoading(true);

    try {
      const user = await login(email.trim(), password);
      const r = user.role as string;
      if (staffRoles.includes(r as (typeof staffRoles)[number])) {
        const from = location.state?.from?.pathname;
        const target =
          typeof from === 'string' && from.startsWith('/admin') ? from : '/admin';
        navigate(target, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err: any) {
      setError(err.message || t('staffLogin.unexpectedError'));
    } finally {
      setLoading(false);
    }
  };

  /** Prefill email only in production. In dev, optional `VITE_DEV_STAFF_DEMO` in `.env.local` can prefill a test password (never commit). */
  const fillDemoCredentials = (role: 'superadmin' | 'admin' | 'editor') => {
    const emails = {
      superadmin: STAFF_LOGIN_EMAILS.superAdmin,
      admin: STAFF_LOGIN_EMAILS.admin,
      editor: STAFF_LOGIN_EMAILS.editor
    };
    setEmail(emails[role]);
    setPassword(import.meta.env.DEV && STAFF_DEV_DEMO_PASSWORD ? STAFF_DEV_DEMO_PASSWORD : '');
    setError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A1A2E] to-[#0F0F1A] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#800000] rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-2xl font-black">VS</span>
          </div>
          <h1 className="text-3xl font-black text-white serif mb-2">
            {t('staffLogin.title')}
          </h1>
          <p className="text-gray-400 text-sm">
            {t('staffLogin.subtitle')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-white mb-6 text-center">
            {t('staffLogin.loginTitle')}
          </h2>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3">
              <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={18} />
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
              <CheckCircle className="text-green-400 shrink-0 mt-0.5" size={18} />
              <p className="text-green-200 text-sm">{t('staffLogin.loginSuccess')}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {t('staffLogin.emailLabel')}
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('staffLogin.emailPlaceholder')}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] transition-all"
                  disabled={loading || success}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                {t('staffLogin.passwordLabel')}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('staffLogin.passwordPlaceholder')}
                  className="w-full bg-white/10 border border-white/20 rounded-xl py-3 pl-12 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-[#800000] focus:ring-1 focus:ring-[#800000] transition-all"
                  disabled={loading || success}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  disabled={loading || success}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#800000] hover:bg-[#600000] text-white font-bold py-3.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  {t('staffLogin.signingIn')}
                </span>
              ) : (
                t('staffLogin.signInButton')
              )}
            </button>
          </form>

          {/* Email shortcuts: production prefills email only; password is your Worker STAFF_PASSWORD (secret). */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-gray-400 text-xs text-center mb-3">
              {import.meta.env.DEV && STAFF_DEV_DEMO_PASSWORD
                ? t('staffLogin.quickLogin')
                : t('staffLogin.emailShortcuts', 'Fill staff email (password: server secret / your account)')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillDemoCredentials('superadmin')}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {t('staffLogin.superadmin')}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('admin')}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {t('staffLogin.admin')}
              </button>
              <button
                type="button"
                onClick={() => fillDemoCredentials('editor')}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 transition-colors"
              >
                {t('staffLogin.editor')}
              </button>
            </div>
          </div>
        </div>

        {/* Role Info */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            {t('staffLogin.roleInfo')}
            <br />
            {t('staffLogin.rolesLabel')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StaffLogin;
