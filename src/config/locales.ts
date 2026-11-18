/**
 * All languages in one place. A new language = one line here (live: false) + src/i18n/<code>.json
 * + slugs in tool-map.ts + content. Flip live to true when it's reviewed and ready.
 * Hreflang, sitemaps, menus and the language switcher only ever include live languages.
 */
export type LocaleCode = 'de' | 'es' | 'pt-br' | 'en';

export interface Locale {
  code: LocaleCode;
  /** hreflang value */
  hreflang: string;
  /** <html lang> */
  htmlLang: string;
  /** Name in its own language (switcher, picker) */
  name: string;
  live: boolean;
  /** Intl locale for dates/numbers */
  intl: string;
  currency: string;
  ogLocale: string;
  /** Countries we tailor data for, first = default */
  countries: string[];
}

export const LOCALES: Locale[] = [
  { code: 'de', hreflang: 'de', htmlLang: 'de', name: 'Deutsch', live: true, intl: 'de-DE', currency: 'EUR', ogLocale: 'de_DE', countries: ['DE', 'AT', 'CH'] },
  { code: 'es', hreflang: 'es', htmlLang: 'es', name: 'Español', live: false, intl: 'es-MX', currency: 'MXN', ogLocale: 'es_MX', countries: ['MX', 'ES'] },
  { code: 'pt-br', hreflang: 'pt-BR', htmlLang: 'pt-BR', name: 'Português (Brasil)', live: false, intl: 'pt-BR', currency: 'BRL', ogLocale: 'pt_BR', countries: ['BR'] },
  { code: 'en', hreflang: 'en', htmlLang: 'en', name: 'English', live: false, intl: 'en-US', currency: 'USD', ogLocale: 'en_US', countries: ['US', 'GB', 'CA'] },
];

export const LIVE_LOCALES = LOCALES.filter((l) => l.live);
export const DEFAULT_LOCALE: LocaleCode = 'de';
export const getLocale = (code: string) => LOCALES.find((l) => l.code === code)!;
