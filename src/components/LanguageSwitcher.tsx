'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown } from 'lucide-react';
import { locales } from '@/i18n';

type Language = {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
};

const languages: Language[] = [
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' }, // Netherlands flag
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' }, // France flag
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' }, // Germany flag
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' }, // UK flag
];

interface LanguageSwitcherProps {
  currentLocale: string;
}

export function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useTranslations('common.language');

  const currentLanguage = languages.find(lang => lang.code === currentLocale) || languages[0];
  const otherLanguages = languages.filter(lang => lang.code !== currentLocale);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
    
    return undefined;
  }, [isOpen]);

  const switchLanguage = (newLocale: string) => {
    const pathnameWithoutLocale = pathname.replace(`/${currentLocale}`, '');
    const newPath = `/${newLocale}${pathnameWithoutLocale}`;
    const queryString = searchParams.toString();
    const fullPath = queryString ? `${newPath}?${queryString}` : newPath;
    
    router.replace(fullPath);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else if (focusedIndex >= 0 && otherLanguages[focusedIndex]) {
          switchLanguage(otherLanguages[focusedIndex].code);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        if (!isOpen) {
          setIsOpen(true);
          setFocusedIndex(0);
        } else {
          setFocusedIndex(prev => 
            prev < otherLanguages.length - 1 ? prev + 1 : 0
          );
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (isOpen) {
          setFocusedIndex(prev => 
            prev > 0 ? prev - 1 : otherLanguages.length - 1
          );
        }
        break;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        className="
          inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
          text-gray-700 bg-white border border-gray-300 rounded-lg
          hover:bg-gray-50 hover:border-gray-400
          focus:outline-none focus:ring-2 focus:ring-hospitality-500 focus:border-transparent
          transition-all duration-200 ease-in-out
        "
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t('current') + ': ' + (currentLanguage?.nativeName || 'Unknown')}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
      >
        <span className="text-lg" aria-hidden="true">{currentLanguage?.flag || '🌐'}</span>
        <span className="hidden sm:inline">{currentLanguage?.nativeName || 'Unknown'}</span>
        <span className="sm:hidden">{currentLanguage?.code.toUpperCase() || 'XX'}</span>
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
          aria-hidden="true" 
        />
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 z-50 mt-2 w-48 py-1
            bg-white border border-gray-200 rounded-lg shadow-lg
            ring-1 ring-black ring-opacity-5
            animate-in fade-in-0 zoom-in-95 duration-200
            origin-top-right
          "
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="language-menu-button"
        >
          <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-100">
            {t('switchTo', { language: '' }).replace('{language}', '').trim()}
          </div>
          
          {otherLanguages.map((language, index) => (
            <button
              key={language.code}
              type="button"
              className={`
                w-full text-left px-3 py-2 text-sm
                hover:bg-gray-50 transition-colors duration-150
                focus:outline-none focus:bg-hospitality-50 focus:text-hospitality-900
                ${focusedIndex === index ? 'bg-hospitality-50 text-hospitality-900' : 'text-gray-700'}
              `}
              role="menuitem"
              tabIndex={focusedIndex === index ? 0 : -1}
              onClick={() => switchLanguage(language.code)}
              onKeyDown={handleKeyDown}
              onMouseEnter={() => setFocusedIndex(index)}
              aria-label={t('switchTo', { language: language.nativeName })}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-lg" aria-hidden="true">{language.flag}</span>
                  <div className="flex flex-col">
                    <span className="font-medium">{language.nativeName}</span>
                    <span className="text-xs text-gray-500 hidden sm:block">
                      {language.name}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 font-mono">
                  {language.code.toUpperCase()}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}