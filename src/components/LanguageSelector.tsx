import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-500" />
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value as 'ru' | 'ka')}
        className="bg-transparent border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 cursor-pointer"
      >
        <option value="ru">🇷🇺 Русский</option>
        <option value="ka">🇬🇪 ქართული</option>
      </select>
    </div>
  );
};

// Compact version for header
export const LanguageSelectorCompact: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
      <button
        onClick={() => setLanguage('ru')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          language === 'ru' 
            ? 'bg-white text-orange-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        RU
      </button>
      <button
        onClick={() => setLanguage('ka')}
        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
          language === 'ka' 
            ? 'bg-white text-orange-600 shadow-sm' 
            : 'text-gray-500 hover:text-gray-700'
        }`}
      >
        KA
      </button>
    </div>
  );
};
