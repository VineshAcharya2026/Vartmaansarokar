import React from 'react';
import { Check, Globe2, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGUAGES = [
  { code: 'en', nativeLabel: 'English', region: 'Global' },
  { code: 'hi', nativeLabel: 'हिन्दी', region: 'Hindi' },
  { code: 'bn', nativeLabel: 'বাংলা', region: 'Bengali' },
  { code: 'mr', nativeLabel: 'मराठी', region: 'Marathi' },
  { code: 'ta', nativeLabel: 'தமிழ்', region: 'Tamil' },
  { code: 'te', nativeLabel: 'తెలుగు', region: 'Telugu' },
  { code: 'gu', nativeLabel: 'ગુજરાતી', region: 'Gujarati' },
  { code: 'kn', nativeLabel: 'ಕನ್ನಡ', region: 'Kannada' },
  { code: 'ml', nativeLabel: 'മലയാളം', region: 'Malayalam' },
  { code: 'pa', nativeLabel: 'ਪੰਜਾਬੀ', region: 'Punjabi' },
  { code: 'or', nativeLabel: 'ଓଡ଼ିଆ', region: 'Odia' },
  { code: 'as', nativeLabel: 'অসমীয়া', region: 'Assamese' },
  { code: 'ur', nativeLabel: 'اردو', region: 'Urdu' }
];

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const wrapperRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const changeLanguage = async (languageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      window.localStorage.setItem('i18nextLng', languageCode);
    } catch (error) {
      console.error('Unable to change language', error);
    } finally {
      setIsOpen(false);
    }
  };

  const activeLanguage = LANGUAGES.find((language) => language.code === i18n.resolvedLanguage) || LANGUAGES[0];

  return (
    <div ref={wrapperRef} className="fixed bottom-5 right-5 z-[220]">
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-3 rounded-full border border-gray-200 bg-white/95 px-4 py-3 text-sm font-bold text-[#001f3f] shadow-[0_18px_50px_-18px_rgba(0,0,0,0.35)] backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_50px_-18px_rgba(128,0,0,0.35)]"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={t('languageSwitcher.buttonLabel')}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#001f3f] text-white shadow-inner">
            <Languages size={16} />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[10px] uppercase tracking-[0.24em] text-gray-400">{t('languageSwitcher.label')}</p>
            <p className="text-sm font-black">{activeLanguage.nativeLabel}</p>
          </div>
          <Globe2 size={16} className="text-[#800000]" />
        </button>

        {isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-64 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#800000]">
                {t('languageSwitcher.dropdownTitle')}
              </p>
              <p className="mt-1 text-sm text-gray-500">{t('languageSwitcher.dropdownSubtitle')}</p>
            </div>
            <div className="p-2">
              {LANGUAGES.map((language) => {
                const isActive = activeLanguage.code === language.code;
                return (
                  <button
                    key={language.code}
                    type="button"
                    onClick={() => void changeLanguage(language.code)}
                    className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-sm transition-colors ${
                      isActive ? 'bg-red-50 text-[#800000]' : 'text-[#001f3f] hover:bg-gray-50'
                    }`}
                    role="menuitem"
                  >
                    <div>
                      <p className="font-bold">{language.nativeLabel}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{language.code}</p>
                    </div>
                    {isActive && <Check size={16} className="text-[#800000]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
