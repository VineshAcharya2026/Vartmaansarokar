import React, { useLayoutEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { BookOpen, Target, Globe, Users, Award, ShieldCheck, ArrowRight, Newspaper, Mail, MapPin } from 'lucide-react';
import { APP_BASE } from '../utils/app';

const About: React.FC = () => {
  const { t } = useTranslation();
  const pageRef = useRef<HTMLDivElement | null>(null);

  const team = [
    { name: 'Chhaya Rani', role: t('about.publisher'), initial: 'CR' },
    { name: 'Rahul Neil', role: t('about.editor'), initial: 'RN' },
    { name: 'Sarthak Pandey', role: t('about.digitalHead'), initial: 'SP' },
    { name: 'Tarun Munjal', role: t('about.adminHead'), initial: 'TM' }
  ];

  const pillars = [
    { title: t('about.pillar1Title'), description: t('about.pillar1Body'), icon: Globe, accent: 'bg-[#001f3f]/8 text-[#001f3f]' },
    { title: t('about.pillar2Title'), description: t('about.pillar2Body'), icon: Users, accent: 'bg-[#800000]/8 text-[#800000]' },
    { title: t('about.pillar3Title'), description: t('about.pillar3Body'), icon: Award, accent: 'bg-[#001f3f]/8 text-[#001f3f]' }
  ];

  useLayoutEffect(() => {
    if (!pageRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo('[data-about-reveal]', { opacity: 0, y: 28 }, { opacity: 1, y: 0, duration: 0.75, stagger: 0.08, ease: 'power3.out' });
    }, pageRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={pageRef} className="space-y-14 pb-16">

      {/* ─── SECTION 1 · Hero ─── */}
      <section data-about-reveal className="rounded-2xl border border-gray-200 bg-white px-6 py-10 md:px-12 md:py-14 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">

          {/* Left: brand intro */}
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-md border border-[#800000]/15 bg-[#800000]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#800000]">
              <Newspaper size={13} />
              {t('about.badge')}
            </div>

            <div className="flex items-center gap-4">
              <img src={`${APP_BASE}logo.png`} alt="Vartmaan Sarokar logo" className="h-12 w-12 rounded-lg border border-gray-200 bg-white p-1.5 shadow-sm" />
              <div>
                <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#001f3f]">{t('brand.lineOne')}</p>
                <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-[#800000]">{t('brand.lineTwo')}</p>
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-[#001f3f] serif leading-tight">
              {t('about.heroTitle')}
            </h1>
            <p className="max-w-xl text-base text-gray-600 leading-relaxed">
              {t('about.heroBody')}
            </p>

            <div className="flex flex-wrap gap-2 pt-1">
              <span className="rounded-md bg-[#001f3f] px-3.5 py-2 text-xs font-bold text-white shadow-sm">{t('about.tagCurrentAffairs')}</span>
              <span className="rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-[#001f3f] shadow-sm">{t('about.tagCulture')}</span>
              <span className="rounded-md border border-gray-200 bg-white px-3.5 py-2 text-xs font-bold text-[#001f3f] shadow-sm">{t('about.tagIdeas')}</span>
            </div>
          </div>

          {/* Right: mission / audience / quote card */}
          <div className="rounded-xl border border-gray-200 bg-[#fafafa] p-5 md:p-7 shadow-sm">
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="rounded-lg bg-white p-4 border border-gray-100 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#800000] mb-1.5">{t('about.missionTitle')}</p>
                <p className="text-sm text-[#001f3f] font-semibold leading-relaxed">{t('about.missionBody')}</p>
              </div>
              <div className="rounded-lg bg-white p-4 border border-gray-100 shadow-sm">
                <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-[#001f3f] mb-1.5">{t('about.audienceTitle')}</p>
                <p className="text-sm text-[#001f3f] font-semibold leading-relaxed">{t('about.audienceBody')}</p>
              </div>
            </div>
            <div className="rounded-lg bg-[#001f3f] px-5 py-6 text-white">
              <Target className="mb-3 text-[#800000] opacity-70" size={24} />
              <p className="text-lg md:text-xl font-bold serif leading-relaxed">
                {t('about.quote')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SECTION 2 · Who We Are ─── */}
      <section data-about-reveal className="grid grid-cols-1 lg:grid-cols-[0.95fr,1.05fr] gap-10 items-center">
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1200"
            alt="Editorial newsroom"
            className="h-[380px] w-full object-cover"
          />
        </div>

        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 rounded-md bg-[#001f3f]/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-[#001f3f]">
            <BookOpen size={13} />
            {t('about.whoWeAreBadge')}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-[#001f3f] serif tracking-tight">
            {t('about.whoWeAreTitle')}
          </h2>
          <div className="space-y-3 text-gray-600 text-[15px] leading-relaxed">
            <p>{t('about.whoWeAreP1')}</p>
            <p>{t('about.whoWeAreP2')}</p>
            <p>{t('about.whoWeAreP3')}</p>
          </div>
        </div>
      </section>

      {/* ─── SECTION 3 · Vision ─── */}
      <section data-about-reveal className="rounded-2xl bg-[#001f3f] text-white px-6 py-10 md:px-12 md:py-14 shadow-sm">
        <div className="max-w-3xl mx-auto text-center space-y-5">
          <Target className="mx-auto text-[#800000]" size={30} />
          <h2 className="text-2xl md:text-4xl font-black serif tracking-tight">{t('about.visionTitle')}</h2>
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed">{t('about.visionLead')}</p>
          <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl mx-auto">{t('about.visionBody')}</p>
        </div>
      </section>

      {/* ─── SECTION 4 · What We Cover (Pillars) ─── */}
      <section data-about-reveal className="space-y-7">
        <div className="max-w-2xl">
          <h2 className="text-2xl md:text-3xl font-black text-[#001f3f] serif tracking-tight">{t('about.coverTitle')}</h2>
          <p className="text-gray-500 mt-2 text-[15px]">{t('about.coverBody')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {pillars.map((pillar) => (
            <article key={pillar.title} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-lg ${pillar.accent}`}>
                <pillar.icon size={22} />
              </div>
              <h3 className="text-lg font-bold text-[#001f3f] serif mb-2">{pillar.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{pillar.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ─── SECTION 5 · Team ─── */}
      <section data-about-reveal className="space-y-7">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#001f3f] serif tracking-tight">{t('about.teamTitle')}</h2>
          <p className="text-gray-500 mt-2 text-[15px]">{t('about.teamBody')}</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {team.map((member, index) => (
            <div key={member.name} className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm hover:shadow-md transition-shadow">
              <div
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-lg text-xl font-black text-white shadow-sm"
                style={{ backgroundColor: index % 2 === 0 ? '#001f3f' : '#800000' }}
              >
                {member.initial}
              </div>
              <h4 className="text-base font-bold text-[#001f3f] serif">{member.name}</h4>
              <p className="mt-1.5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#800000]">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── SECTION 6 · Published By / CTA ─── */}
      <section data-about-reveal className="rounded-xl border border-gray-200 bg-white p-6 md:p-8 shadow-sm flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#800000]/8 text-[#800000]">
            <ShieldCheck size={22} />
          </div>
          <div className="max-w-2xl">
            <h4 className="text-xl font-bold text-[#001f3f] serif">{t('about.publishedByTitle')}</h4>
            <p className="text-gray-500 mt-1.5 text-sm leading-relaxed">{t('about.publishedByBody')}</p>
          </div>
        </div>
        <Link to="/magazine" className="inline-flex items-center gap-2 rounded-lg bg-[#001f3f] px-5 py-3 text-sm font-bold text-white hover:bg-[#002b57] transition-colors shadow-sm">
          {t('about.exploreMagazine')}
          <ArrowRight size={15} />
        </Link>
      </section>

    </div>
  );
};

export default About;
