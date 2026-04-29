import React, { useCallback, useEffect, useRef, useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import { useApp } from '../vartmaan-frontend-app-context';
import { UserRole } from '../vartmaan-shared-types';
import {
  RECAPTCHA_SITE_KEY,
  PUBLIC_UPI_ID,
  PUBLIC_BANK_NAME,
  PUBLIC_BANK_ACCOUNT,
  PUBLIC_BANK_IFSC,
  formatCurrencyINR
} from '../utils/app';

function getErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const data = (err as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong. Please try again.';
}

function isEndpointNotFound(err: unknown): boolean {
  if (err instanceof Error && err.message === 'Endpoint not found.') return true;
  if (!err || typeof err !== 'object' || !('response' in err)) return false;
  const response = (err as { response?: { status?: number; data?: { message?: string } } }).response;
  return response?.status === 404 && response.data?.message === 'Endpoint not found.';
}

function validateNameClient(name: string): string | null {
  const v = name.trim();
  if (v.length < 2) return 'Name must be at least 2 characters.';
  if (/\d/.test(v)) return 'Name must not contain numbers.';
  return null;
}

function validateEmailClient(email: string): string | null {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
  return null;
}

function normalizeMobile(raw: string): string {
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('91') && d.length === 12) d = d.slice(2);
  if (d.startsWith('0') && d.length === 11) d = d.slice(1);
  return d;
}

function validateMobileClient(mobile: string): string | null {
  const d = normalizeMobile(mobile);
  if (d.length !== 10) return 'Mobile must be exactly 10 digits.';
  return null;
}

const MAX_FILE = 5 * 1024 * 1024;

const DIGITAL_FEATURES = [
  'Unlimited digital article access',
  'E-magazine flipbook reader',
  'Breaking news & updates',
  'All 23 Indian language editions'
];

const PHYSICAL_FEATURES = [
  'Printed magazine delivered monthly',
  'Includes digital access',
  'Priority support'
];

const SubscriptionPopup: React.FC = () => {
  const { subscriptionPopupOpen, closeSubscriptionPopup, currentUser, fetchSubscriptionRequests } = useApp();
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const digitalCaptchaRef = useRef<InstanceType<typeof ReCAPTCHA>>(null);
  const physicalCaptchaRef = useRef<InstanceType<typeof ReCAPTCHA>>(null);

  const [digitalToken, setDigitalToken] = useState<string | null>(null);
  const [physicalToken, setPhysicalToken] = useState<string | null>(null);

  const [digitalForm, setDigitalForm] = useState({ name: '', mobile: '', email: '', message: '' });
  const [physicalForm, setPhysicalForm] = useState({ name: '', mobile: '', email: '', address: '' });
  const [physicalFile, setPhysicalFile] = useState<File | null>(null);
  const [physicalPreview, setPhysicalPreview] = useState<string | null>(null);

  const [digitalErrors, setDigitalErrors] = useState<Record<string, string>>({});
  const [physicalErrors, setPhysicalErrors] = useState<Record<string, string>>({});

  const [digitalLoading, setDigitalLoading] = useState(false);
  const [physicalLoading, setPhysicalLoading] = useState(false);
  const [digitalSuccess, setDigitalSuccess] = useState(false);
  const [physicalSuccess, setPhysicalSuccess] = useState(false);

  const resetPhysicalFile = useCallback(() => {
    setPhysicalFile(null);
    setPhysicalPreview(null);
  }, []);

  useEffect(() => {
    if (!subscriptionPopupOpen) return;
    setDigitalForm((f) => ({
      ...f,
      name: currentUser?.name || f.name,
      email: currentUser?.email || f.email,
      mobile: (currentUser as { phone?: string })?.phone || f.mobile
    }));
    setPhysicalForm((f) => ({
      ...f,
      name: currentUser?.name || f.name,
      email: currentUser?.email || f.email,
      mobile: (currentUser as { phone?: string })?.phone || f.mobile
    }));
  }, [subscriptionPopupOpen, currentUser]);

  useEffect(() => {
    if (!subscriptionPopupOpen) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [subscriptionPopupOpen]);

  useEffect(() => {
    if (subscriptionPopupOpen) return;
    setDigitalSuccess(false);
    setPhysicalSuccess(false);
    setDigitalErrors({});
    setPhysicalErrors({});
    setDigitalToken(null);
    setPhysicalToken(null);
    setDigitalForm({ name: '', mobile: '', email: '', message: '' });
    setPhysicalForm({ name: '', mobile: '', email: '', address: '' });
    resetPhysicalFile();
    digitalCaptchaRef.current?.reset();
    physicalCaptchaRef.current?.reset();
  }, [subscriptionPopupOpen, resetPhysicalFile]);

  useEffect(() => {
    if (!subscriptionPopupOpen) return;
    const t = window.setTimeout(() => {
      const root = panelRef.current;
      const first = root?.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      first?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [subscriptionPopupOpen]);

  useEffect(() => {
    if (!subscriptionPopupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSubscriptionPopup();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [subscriptionPopupOpen, closeSubscriptionPopup]);

  useEffect(() => {
    if (!digitalSuccess && !physicalSuccess) return;
    const t = window.setTimeout(() => {
      closeSubscriptionPopup();
      setDigitalSuccess(false);
      setPhysicalSuccess(false);
    }, 3000);
    return () => window.clearTimeout(t);
  }, [digitalSuccess, physicalSuccess, closeSubscriptionPopup]);

  const onPhysicalFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    resetPhysicalFile();
    if (!f) return;
    if (f.size > MAX_FILE) {
      setPhysicalErrors((prev) => ({ ...prev, screenshot: 'File must be 5MB or smaller.' }));
      return;
    }
    const isImage = f.type.startsWith('image/');
    const isPdf = f.type === 'application/pdf';
    if (!isImage && !isPdf) {
      setPhysicalErrors((prev) => ({ ...prev, screenshot: 'Use any image format (JPG, PNG, WEBP, etc.) or PDF.' }));
      return;
    }
    setPhysicalFile(f);
    setPhysicalErrors((prev) => {
      const next = { ...prev };
      delete next.screenshot;
      return next;
    });
    if (f.type.startsWith('image/')) {
      setPhysicalPreview(URL.createObjectURL(f));
    }
  };

  useEffect(() => {
    return () => {
      if (physicalPreview) URL.revokeObjectURL(physicalPreview);
    };
  }, [physicalPreview]);

  const submitDigital = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const n = validateNameClient(digitalForm.name);
    if (n) err.name = n;
    const em = validateEmailClient(digitalForm.email);
    if (em) err.email = em;
    const ph = validateMobileClient(digitalForm.mobile);
    if (ph) err.mobile = ph;
    if (RECAPTCHA_SITE_KEY && !digitalToken) err.recaptcha = 'Please complete the reCAPTCHA.';
    setDigitalErrors(err);
    if (Object.keys(err).length) return;

    setDigitalLoading(true);
    try {
      const payload = new FormData();
      payload.append('name', digitalForm.name.trim());
      payload.append('email', digitalForm.email.trim());
      payload.append('phone', normalizeMobile(digitalForm.mobile));
      payload.append('plan', 'DIGITAL');
      if (digitalForm.message.trim()) payload.append('address', digitalForm.message.trim());
      await api.post('/api/subscriptions', payload);
      setDigitalSuccess(true);
      digitalCaptchaRef.current?.reset();
      setDigitalToken(null);
      if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.SUPER_ADMIN) {
        void fetchSubscriptionRequests();
      }
    } catch (er) {
      setDigitalErrors({ form: getErrorMessage(er) });
    } finally {
      setDigitalLoading(false);
    }
  };

  const submitPhysical = async (e: React.FormEvent) => {
    e.preventDefault();
    const err: Record<string, string> = {};
    const n = validateNameClient(physicalForm.name);
    if (n) err.name = n;
    const em = validateEmailClient(physicalForm.email);
    if (em) err.email = em;
    const ph = validateMobileClient(physicalForm.mobile);
    if (ph) err.mobile = ph;
    if (physicalForm.address.trim().length < 20) err.address = 'Address must be at least 20 characters.';
    if (!physicalFile) err.screenshot = 'Payment screenshot is required.';
    if (RECAPTCHA_SITE_KEY && !physicalToken) err.recaptcha = 'Please complete the reCAPTCHA.';
    setPhysicalErrors(err);
    if (Object.keys(err).length) return;

    setPhysicalLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', physicalForm.name.trim());
      fd.append('email', physicalForm.email.trim());
      fd.append('phone', normalizeMobile(physicalForm.mobile));
      fd.append('address', physicalForm.address.trim());
      fd.append('recaptchaToken', physicalToken || '');
      fd.append('screenshot', physicalFile!);
      try {
        await api.post('/api/subscribers/physical', fd);
      } catch (er) {
        if (!isEndpointNotFound(er)) throw er;
        const fallback = new FormData();
        fallback.append('name', physicalForm.name.trim());
        fallback.append('email', physicalForm.email.trim());
        fallback.append('phone', normalizeMobile(physicalForm.mobile));
        fallback.append('address', physicalForm.address.trim());
        fallback.append('plan', 'PRINT');
        fallback.append('file', physicalFile!);
        await api.post('/api/subscriptions', fallback);
      }
      setPhysicalSuccess(true);
      physicalCaptchaRef.current?.reset();
      setPhysicalToken(null);
      resetPhysicalFile();
    } catch (er) {
      setPhysicalErrors({ form: getErrorMessage(er) });
    } finally {
      setPhysicalLoading(false);
    }
  };

  if (!subscriptionPopupOpen) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-[#001f3f]/85 backdrop-blur-sm p-0 sm:p-4"
      role="presentation"
      onClick={(ev) => {
        if (ev.target === overlayRef.current) closeSubscriptionPopup();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="subscription-popup-title"
        data-dialog-panel
        className="relative w-full max-w-6xl max-h-[100dvh] sm:max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={closeSubscriptionPopup}
          className="absolute right-4 top-4 z-10 rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-red-700"
          aria-label="Close subscription dialog"
        >
          <X size={22} />
        </button>

        <div className="px-5 pt-12 pb-8 sm:px-8 sm:pt-10">
          <h2 id="subscription-popup-title" className="text-2xl sm:text-3xl font-black text-[#001f3f] serif text-center mb-2">
            Choose your <span className="text-[#800000]">Vartmaan</span> access
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8 max-w-2xl mx-auto">
            All subscription requests are reviewed by Admin/Super Admin. Access is activated after approval.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10">
            {/* Digital */}
            <section className="rounded-2xl border border-gray-100 bg-[#FAF7F2] p-6 flex flex-col">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#800000] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                  Limited offer — FREE
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="line-through text-gray-400">{formatCurrencyINR(199)}/month</span>{' '}
                <span className="text-2xl font-black text-[#001f3f]">FREE</span>
              </p>
              <p className="text-xs font-bold text-amber-700 mb-4">Grab it while it lasts — no payment needed!</p>
              <ul className="text-sm text-[#0f172a] space-y-2 mb-6 flex-1">
                {DIGITAL_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckCircle2 className="shrink-0 text-green-600" size={18} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {digitalSuccess ? (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-green-800 text-sm font-semibold">
                  Request received. Our team will review and approve soon. This window will close shortly.
                </div>
              ) : (
                <form onSubmit={submitDigital} className="space-y-3" noValidate aria-label="Digital subscription form">
                  {digitalErrors.form && <p className="text-sm text-red-600 font-medium">{digitalErrors.form}</p>}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Full name *</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={digitalForm.name}
                      onChange={(e) => setDigitalForm({ ...digitalForm, name: e.target.value })}
                      disabled={digitalLoading}
                      autoComplete="name"
                    />
                    {digitalErrors.name && <p className="text-xs text-red-600 mt-1">{digitalErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Mobile *</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={digitalForm.mobile}
                      onChange={(e) => setDigitalForm({ ...digitalForm, mobile: e.target.value })}
                      disabled={digitalLoading}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                    {digitalErrors.mobile && <p className="text-xs text-red-600 mt-1">{digitalErrors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Email *</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={digitalForm.email}
                      onChange={(e) => setDigitalForm({ ...digitalForm, email: e.target.value })}
                      disabled={digitalLoading}
                      autoComplete="email"
                    />
                    {digitalErrors.email && <p className="text-xs text-red-600 mt-1">{digitalErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Message (optional)</label>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[72px]"
                      value={digitalForm.message}
                      onChange={(e) => setDigitalForm({ ...digitalForm, message: e.target.value })}
                      disabled={digitalLoading}
                    />
                  </div>
                  {RECAPTCHA_SITE_KEY ? (
                    <div className="flex justify-center">
                      <ReCAPTCHA
                        ref={digitalCaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={(t) => {
                          setDigitalToken(t);
                          setDigitalErrors((e) => {
                            const n = { ...e };
                            delete n.recaptcha;
                            return n;
                          });
                        }}
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                      reCAPTCHA is not configured (set <code className="font-mono">VITE_RECAPTCHA_SITE_KEY</code> and server{' '}
                      <code className="font-mono">RECAPTCHA_SECRET_KEY</code> for production).
                    </p>
                  )}
                  {digitalErrors.recaptcha && <p className="text-xs text-red-600">{digitalErrors.recaptcha}</p>}
                  <button
                    type="submit"
                    disabled={digitalLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#800000] text-white py-3.5 font-black text-sm uppercase tracking-wide hover:bg-red-900 disabled:opacity-60"
                  >
                    {digitalLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                    Submit digital request →
                  </button>
                </form>
              )}
            </section>

            {/* Physical */}
            <section className="rounded-2xl border border-gray-100 bg-white p-6 flex flex-col shadow-inner">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="bg-[#001f3f] text-white text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded">
                  Home delivery
                </span>
              </div>
              <p className="text-2xl font-black text-[#001f3f] mb-1">{formatCurrencyINR(499)}/month</p>
              <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 text-xs text-slate-800 mb-4 space-y-1">
                <p className="font-black uppercase tracking-wider text-[10px] text-slate-500">UPI / bank</p>
                <p>
                  <span className="text-gray-500">UPI:</span>{' '}
                  <span className="font-mono font-bold">{PUBLIC_UPI_ID || '— configure VITE_PUBLIC_UPI_ID'}</span>
                </p>
                {PUBLIC_BANK_NAME ? (
                  <>
                    <p>
                      <span className="text-gray-500">Bank:</span> {PUBLIC_BANK_NAME}
                    </p>
                    <p>
                      <span className="text-gray-500">A/C:</span> <span className="font-mono">{PUBLIC_BANK_ACCOUNT}</span>
                    </p>
                    <p>
                      <span className="text-gray-500">IFSC:</span> <span className="font-mono">{PUBLIC_BANK_IFSC}</span>
                    </p>
                  </>
                ) : null}
                <p className="text-amber-800 font-semibold pt-2">After payment, upload a screenshot. We verify as soon as possible.</p>
              </div>
              <ul className="text-sm text-[#0f172a] space-y-2 mb-6">
                {PHYSICAL_FEATURES.map((f) => (
                  <li key={f} className="flex gap-2">
                    <CheckCircle2 className="shrink-0 text-green-600" size={18} />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              {physicalSuccess ? (
                <div className="rounded-xl bg-green-50 border border-green-100 p-4 text-green-800 text-sm font-semibold">
                  Request received. Our team will verify within 24 hours. This window will close shortly.
                </div>
              ) : (
                <form onSubmit={submitPhysical} className="space-y-3" noValidate aria-label="Print subscription form">
                  {physicalErrors.form && <p className="text-sm text-red-600 font-medium">{physicalErrors.form}</p>}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Full name *</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={physicalForm.name}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, name: e.target.value })}
                      disabled={physicalLoading}
                      autoComplete="name"
                    />
                    {physicalErrors.name && <p className="text-xs text-red-600 mt-1">{physicalErrors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Mobile *</label>
                    <input
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={physicalForm.mobile}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, mobile: e.target.value })}
                      disabled={physicalLoading}
                      inputMode="numeric"
                    />
                    {physicalErrors.mobile && <p className="text-xs text-red-600 mt-1">{physicalErrors.mobile}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Email *</label>
                    <input
                      type="email"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm"
                      value={physicalForm.email}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, email: e.target.value })}
                      disabled={physicalLoading}
                    />
                    {physicalErrors.email && <p className="text-xs text-red-600 mt-1">{physicalErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Delivery address *</label>
                    <textarea
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm min-h-[88px]"
                      value={physicalForm.address}
                      onChange={(e) => setPhysicalForm({ ...physicalForm, address: e.target.value })}
                      disabled={physicalLoading}
                    />
                    {physicalErrors.address && <p className="text-xs text-red-600 mt-1">{physicalErrors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-500 mb-1">Payment screenshot * (all image formats or PDF, max 5MB)</label>
                    <input type="file" accept="image/*,application/pdf" onChange={onPhysicalFile} disabled={physicalLoading} />
                    {physicalPreview && (
                      <img src={physicalPreview} alt="Payment preview" className="mt-2 max-h-32 rounded-lg border object-contain" />
                    )}
                    {physicalFile && physicalFile.type === 'application/pdf' && (
                      <p className="text-xs text-gray-600 mt-1">Selected: {physicalFile.name}</p>
                    )}
                    {physicalErrors.screenshot && <p className="text-xs text-red-600 mt-1">{physicalErrors.screenshot}</p>}
                  </div>
                  {RECAPTCHA_SITE_KEY ? (
                    <div className="flex justify-center">
                      <ReCAPTCHA
                        ref={physicalCaptchaRef}
                        sitekey={RECAPTCHA_SITE_KEY}
                        onChange={(t) => {
                          setPhysicalToken(t);
                          setPhysicalErrors((e) => {
                            const n = { ...e };
                            delete n.recaptcha;
                            return n;
                          });
                        }}
                      />
                    </div>
                  ) : null}
                  {physicalErrors.recaptcha && <p className="text-xs text-red-600">{physicalErrors.recaptcha}</p>}
                  <button
                    type="submit"
                    disabled={physicalLoading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#001f3f] text-white py-3.5 font-black text-sm uppercase tracking-wide hover:bg-black disabled:opacity-60"
                  >
                    {physicalLoading ? <Loader2 className="animate-spin" size={20} /> : null}
                    Submit subscription →
                  </button>
                </form>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPopup;
