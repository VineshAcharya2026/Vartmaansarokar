import React, { useLayoutEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  MessageSquare,
  CreditCard,
  Shield,
  Users,
  BookOpen,
  Newspaper,
  Star,
  ArrowRight,
  MessageCircle,
  Bell,
  Globe,
  Headphones,
  FileText,
  Zap
} from 'lucide-react';
import { APP_BASE } from '../utils/app';

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const contactSections = [
    {
      key: 'general',
      icon: MessageSquare,
      color: 'bg-blue-50 text-blue-700',
      borderColor: 'border-blue-200'
    },
    {
      key: 'subscriptions',
      icon: BookOpen,
      color: 'bg-green-50 text-green-700',
      borderColor: 'border-green-200'
    },
    {
      key: 'advertising',
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      borderColor: 'border-purple-200'
    },
    {
      key: 'editorial',
      icon: Newspaper,
      color: 'bg-amber-50 text-amber-700',
      borderColor: 'border-amber-200'
    },
    {
      key: 'technical',
      icon: Zap,
      color: 'bg-red-50 text-red-700',
      borderColor: 'border-red-200'
    }
  ];

  const subscriptionPlans = [
    {
      key: 'digital',
      icon: Globe,
      popular: false,
      features: (t('contact.subscriptionDetails.digital.features', { returnObjects: true }) as string[]) || []
    },
    {
      key: 'print',
      icon: BookOpen,
      popular: true,
      features: (t('contact.subscriptionDetails.print.features', { returnObjects: true }) as string[]) || []
    }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      setSubmitStatus('success');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-contact-reveal]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out' });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="space-y-16 pb-16">
      {/* Hero Section */}
      <section data-contact-reveal className="relative overflow-hidden rounded-[28px] border border-gray-100 bg-gradient-to-br from-[#f8fafc] via-white to-[#fdf2f2] px-6 py-12 md:px-12 md:py-16 shadow-xl">
        <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-[#800000]/8 blur-3xl" />
        <div className="absolute -bottom-24 -left-12 h-64 w-64 rounded-full bg-[#001f3f]/8 blur-3xl" />

        <div className="relative text-center space-y-6">
          <div className="inline-flex items-center gap-3 rounded-full border border-[#800000]/15 bg-white/80 px-4 py-2 text-[11px] font-black uppercase tracking-[0.28em] text-[#800000]">
            <MessageSquare size={14} />
            {t('contact.pageTitle')}
          </div>

          <h1 className="text-4xl md:text-6xl font-black text-[#001f3f] leading-tight">
            {t('routes.contact.heroTitle')}
          </h1>

          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t('routes.contact.heroSubtitle')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Clock size={16} />
              <span>{t('routes.contact.responseTime')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Headphones size={16} />
              <span>{t('routes.contact.officeHours')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Sections */}
      <section data-contact-reveal className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {contactSections.map((section) => {
          const Icon = section.icon;
          return (
            <div key={section.key} className={`rounded-2xl border ${section.borderColor} bg-white p-6 shadow-lg hover:shadow-xl transition-all duration-300`}>
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${section.color} mb-4`}>
                <Icon size={24} />
              </div>

              <h3 className="text-xl font-bold text-[#001f3f] mb-2">
                {t(`contact.sections.${section.key}.title`)}
              </h3>

              <p className="text-gray-600 mb-4 leading-relaxed">
                {t(`contact.sections.${section.key}.description`)}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail size={16} />
                  <span>{t(`contact.sections.${section.key}.email`)}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone size={16} />
                  <span>{t(`contact.sections.${section.key}.phone`)}</span>
                </div>
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle size={16} />
                  <span>{t(`contact.sections.${section.key}.response`)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* Office Information & Social */}
      <div data-contact-reveal className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Office Information */}
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#001f3f]/10 text-[#001f3f]">
              <MapPin size={24} />
            </div>
            <h3 className="text-2xl font-bold text-[#001f3f]">
              {t('contact.office.title')}
            </h3>
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                {t('contact.office.address')}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-[#001f3f] mb-3">
                {t('contact.office.hours.title')}
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                <p>{t('contact.office.hours.weekdays')}</p>
                <p>{t('contact.office.hours.sunday')}</p>
                <p>{t('contact.office.hours.holidays')}</p>
              </div>
            </div>

            <p className="text-sm text-gray-500 italic">
              {t('contact.office.location')}
            </p>
          </div>
        </div>

        {/* Social & Communication */}
        <div className="space-y-6">
          {/* WhatsApp Updates */}
          <div className="rounded-2xl border border-green-200 bg-green-50/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 text-green-700">
                <MessageCircle size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#001f3f]">
                {t('contact.social.whatsapp.title')}
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              {t('contact.social.whatsapp.description')}
            </p>

            <div className="space-y-2">
              <p className="font-medium text-[#001f3f]">
                {t('contact.social.whatsapp.number')}
              </p>
              <p className="text-sm text-green-600 font-medium">
                {t('contact.social.whatsapp.action')}
              </p>
            </div>
          </div>

          {/* Newsletter */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-4">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 text-blue-700">
                <Bell size={24} />
              </div>
              <h3 className="text-xl font-bold text-[#001f3f]">
                {t('contact.social.newsletter.title')}
              </h3>
            </div>

            <p className="text-gray-600 mb-4">
              {t('contact.social.newsletter.description')}
            </p>

            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              {t('contact.social.newsletter.action')}
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>

      {/* Subscription Details */}
      <section data-contact-reveal className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-black text-[#001f3f]">
            {t('contact.subscriptionDetails.title')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Choose the subscription that works best for you. All plans include our commitment to quality journalism.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {subscriptionPlans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div key={plan.key} className={`relative rounded-2xl border bg-white p-8 shadow-lg hover:shadow-xl transition-all duration-300 ${plan.popular ? 'border-[#800000] ring-2 ring-[#800000]/20' : 'border-gray-200'}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-[#800000] text-white px-4 py-1 rounded-full text-sm font-bold">
                      Most Popular
                    </div>
                  </div>
                )}

                <div className="text-center space-y-4">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${plan.popular ? 'bg-[#800000]/10 text-[#800000]' : 'bg-gray-100 text-gray-600'}`}>
                    <Icon size={32} />
                  </div>

                  <div>
                    <h3 className="text-2xl font-bold text-[#001f3f]">
                      {t(`contact.subscriptionDetails.${plan.key}.title`)}
                    </h3>
                    <p className="text-3xl font-black text-[#800000] mt-2">
                      {t(`contact.subscriptionDetails.${plan.key}.price`)}
                    </p>
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature: string, index: number) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle size={18} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {plan.key === 'combo' && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-green-700 font-medium text-sm">
                        {t('contact.subscriptionDetails.combo.savings')}
                      </p>
                    </div>
                  )}

                  <button className={`w-full py-3 px-6 rounded-xl font-bold transition-all duration-300 ${plan.popular ? 'bg-[#800000] text-white hover:bg-[#600000]' : 'bg-[#001f3f] text-white hover:bg-[#002f5f]'}`}>
                    {t(`contact.subscriptionDetails.${plan.key}.cta`)}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment & Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#001f3f]/10 text-[#001f3f]">
                <CreditCard size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#001f3f]">
                {t('contact.subscriptionDetails.payment.title')}
              </h3>
            </div>

            <ul className="space-y-3 mb-6">
              {((t('contact.subscriptionDetails.payment.methods', { returnObjects: true }) as string[]) || []).map((method: string, index: number) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-green-600" />
                  <span className="text-gray-600">{method}</span>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2 text-green-600">
              <Shield size={16} />
              <span className="text-sm font-medium">
                {t('contact.subscriptionDetails.payment.security')}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-[#800000]/10 text-[#800000]">
                <Headphones size={24} />
              </div>
              <h3 className="text-2xl font-bold text-[#001f3f]">
                {t('contact.subscriptionDetails.support.title')}
              </h3>
            </div>

            <div className="space-y-4">
              <div>
                <p className="font-medium text-[#001f3f]">{t('contact.subscriptionDetails.support.contact')}</p>
                <p className="text-gray-600">{t('contact.subscriptionDetails.support.email')}</p>
              </div>
              <p className="text-sm text-gray-500">
                {t('contact.subscriptionDetails.support.hours')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section data-contact-reveal className="rounded-2xl border border-gray-200 bg-white p-8 md:p-12 shadow-lg">
        <div className="text-center space-y-4 mb-8">
          <h2 className="text-3xl md:text-4xl font-black text-[#001f3f]">
            {t('contact.form.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('contact.form.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.form.name')}
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#001f3f] focus:border-transparent transition-all duration-300"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.form.email')}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#001f3f] focus:border-transparent transition-all duration-300"
                placeholder="yourname@gmail.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.form.phone')}
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#001f3f] focus:border-transparent transition-all duration-300"
                placeholder="+91 98765 43210"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                {t('contact.form.subject')}
              </label>
              <select
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#001f3f] focus:border-transparent transition-all duration-300"
              >
                <option value="">{t('contact.form.subjectOptions.general')}</option>
                <option value="subscription">{t('contact.form.subjectOptions.subscription')}</option>
                <option value="advertising">{t('contact.form.subjectOptions.advertising')}</option>
                <option value="editorial">{t('contact.form.subjectOptions.editorial')}</option>
                <option value="technical">{t('contact.form.subjectOptions.technical')}</option>
                <option value="feedback">{t('contact.form.subjectOptions.feedback')}</option>
                <option value="other">{t('contact.form.subjectOptions.other')}</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
              {t('contact.form.message')}
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
              rows={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#001f3f] focus:border-transparent transition-all duration-300 resize-none"
              placeholder={t('contact.form.messagePlaceholder')}
            />
          </div>

          <div className="text-center">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 bg-[#001f3f] text-white px-8 py-4 rounded-xl font-bold hover:bg-[#002f5f] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {isSubmitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t('contact.form.sending')}
                </>
              ) : (
                <>
                  <Send size={20} />
                  {t('contact.form.submit')}
                </>
              )}
            </button>
          </div>

          {submitStatus === 'success' && (
            <div className="text-center p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-green-700">
                <CheckCircle size={20} />
                <span className="font-medium">{t('contact.form.success')}</span>
              </div>
            </div>
          )}

          {submitStatus === 'error' && (
            <div className="text-center p-4 bg-red-50 border border-red-200 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-red-700">
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">!</span>
                </div>
                <span className="font-medium">{t('contact.form.error')}</span>
              </div>
            </div>
          )}
        </form>
      </section>
    </div>
  );
};

export default Contact;