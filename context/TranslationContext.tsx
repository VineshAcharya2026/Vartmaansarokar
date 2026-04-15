import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import i18n from '../i18n';

interface TranslationContextType {
  language: string;
  setLanguage: (lang: string) => void;
  translate: (text: string) => string;
  batchTranslate: (texts: string[]) => Promise<Record<string, string>>;
  isTranslating: boolean;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const CACHE_KEY_PREFIX = 'vs_trans_cache_';
const BASE_URL = import.meta.env.VITE_API_URL || 'https://vartmaan-sarokaar-api.vineshjm.workers.dev';

export const TranslationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState(localStorage.getItem('lang') || 'en');
  const [cache, setCache] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState(false);
  const pendingTranslations = useRef<Set<string>>(new Set());
  const translationQueue = useRef<string[]>([]);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Load cache for current language
  useEffect(() => {
    const savedCache = localStorage.getItem(`${CACHE_KEY_PREFIX}${language}`);
    if (savedCache) {
      try {
        setCache(JSON.parse(savedCache));
      } catch (e) {
        setCache({});
      }
    } else {
      setCache({});
    }
  }, [language]);

  const setLanguage = (lang: string) => {
    setLanguageState(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;
  };

  const batchTranslate = useCallback(async (texts: string[]) => {
    const untranslated = texts.filter(t => !cache[t] && t.trim().length > 0 && !pendingTranslations.current.has(t));
    if (untranslated.length === 0) return cache;

    untranslated.forEach(t => pendingTranslations.current.add(t));
    setIsTranslating(true);

    try {
      const response = await fetch(`${BASE_URL}/api/translate/batch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts: untranslated, targetLang: language })
      });
      const data = await response.json();
      
      if (data.translations) {
        const newCache = { ...cache, ...data.translations };
        setCache(newCache);
        localStorage.setItem(`${CACHE_KEY_PREFIX}${language}`, JSON.stringify(newCache));
      }
    } catch (e) {
      console.error('Translation error:', e);
    } finally {
      untranslated.forEach(t => pendingTranslations.current.delete(t));
      setIsTranslating(false);
    }
    return cache;
  }, [cache, language]);

  const translate = useCallback((text: string) => {
    if (language === 'en' || !text || text.trim().length < 2) return text;
    
    // Skip if matched by common ignore patterns
    const isUrl = /^(https?:\/\/|www\.)/i.test(text);
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
    const isOnlyNumbers = /^[0-9\s.,₹$%+\-:]+$/.test(text);
    
    if (isUrl || isEmail || isOnlyNumbers) return text;

    if (cache[text]) return cache[text];

    // Add to queue for background translation
    if (!pendingTranslations.current.has(text) && !translationQueue.current.includes(text)) {
      translationQueue.current.push(text);
      
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        const batch = [...translationQueue.current];
        translationQueue.current = [];
        batchTranslate(batch);
      }, 500);
    }

    return text; // Return original until translated
  }, [cache, language, batchTranslate]);

  // Global Auto-Scanner (MutationObserver)
  useEffect(() => {
    if (language === 'en') return;

    const walker = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent?.trim();
        if (text && text.length > 1) {
          const translated = translate(text);
          if (translated !== text && node.textContent !== translated) {
            node.textContent = translated;
          }
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'iframe', 'canvas'].includes(tag)) return;
        
        // Handle placeholders
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          if (el.placeholder) {
            const translated = translate(el.placeholder);
            if (translated !== el.placeholder) el.placeholder = translated;
          }
        }

        el.childNodes.forEach(walker);
      }
    };

    // Initial walk
    walker(document.body);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => walker(node));
        // Also check character data changes
        if (mutation.type === 'characterData') {
          walker(mutation.target);
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => observer.disconnect();
  }, [language, translate, cache]); // Cache is added to trigger re-walk when translations arrive

  return (
    <TranslationContext.Provider value={{ language, setLanguage, translate, batchTranslate, isTranslating }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslate = () => {
  const context = useContext(TranslationContext);
  if (!context) throw new Error('useTranslate must be used within a TranslationProvider');
  return context;
};
