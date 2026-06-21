export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
}

export const LANGUAGES: LanguageOption[] = [
  // Recommended / Featured
  { code: 'es', name: 'Español', nativeName: 'Español' },
  { code: 'en', name: 'Inglés', nativeName: 'English' },
  // Other options
  { code: 'pt', name: 'Portugués', nativeName: 'Português' },
  { code: 'zh', name: 'Chino', nativeName: '中文' },
  { code: 'fr', name: 'Francés', nativeName: 'Français' },
  { code: 'it', name: 'Italiano', nativeName: 'Italiano' },
  { code: 'de', name: 'Alemán', nativeName: 'Deutsch' },
  { code: 'ko', name: 'Coreano', nativeName: '한국어' },
  { code: 'ja', name: 'Japónes', nativeName: '日本語' },
];
