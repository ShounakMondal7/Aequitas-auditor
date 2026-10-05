import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

export const languages = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'pt', label: 'Português' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文 (Mandarin)' },
  { code: 'hi', label: 'हिन्दी (Hindi)' },
  { code: 'bn', label: 'বাংলা (Bengali)' },
  { code: 'ar', label: 'العربية (Arabic)', rtl: true },
  { code: 'ur', label: 'اردو (Urdu)', rtl: true },
];

export const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
    setIsOpen(false);
  };

  const currentLang = languages.find(
    (l) => l.code === i18n.language || i18n.language?.startsWith(l.code)
  ) || languages[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white/50 dark:bg-black/40 hover:bg-white/80 dark:hover:bg-black/60 border border-black/10 dark:border-white/10 rounded-full text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
        title="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
        <span className="truncate max-w-[100px]">{currentLang.label}</span>
        <ChevronDown className="w-3 h-3 opacity-60 shrink-0" />
      </button>

      {isOpen && (
        <div className="absolute right-0 rtl:right-auto rtl:left-0 mt-2 w-44 bg-white/95 dark:bg-[#0A0A0A]/95 backdrop-blur-2xl border border-black/10 dark:border-white/[0.08] rounded-xl shadow-2xl py-1.5 z-[99999] max-h-72 overflow-y-auto terminal-scroll">
          {languages.map((lang) => {
            const isSelected = i18n.language === lang.code || i18n.language?.startsWith(lang.code);
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => changeLanguage(lang.code)}
                className={`w-full text-left rtl:text-right px-4 py-2 text-xs transition-colors flex items-center justify-between ${
                  isSelected
                    ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/[0.04] hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <span>{lang.label}</span>
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
