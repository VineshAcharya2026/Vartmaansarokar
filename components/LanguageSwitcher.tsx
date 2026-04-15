import React from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Globe } from 'lucide-react';
import { useTranslate } from '../context/TranslationContext';

const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useTranslate();

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'mr', label: 'मराठी' },
    { code: 'ta', label: 'தமிழ்' },
    { code: 'te', label: 'తెలుగు' },
    { code: 'kn', label: 'ಕನ್ನಡ' },
    { code: 'ml', label: 'മലയാളം' },
    { code: 'bn', label: 'বাংলা' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ' }
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe size={16} className="text-gray-400" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="bg-transparent border-none text-sm font-bold text-[#001f3f] focus:outline-none cursor-pointer hover:text-[#800000] transition-colors"
      >
        {languages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
