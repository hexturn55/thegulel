export const locales = ['en', 'hi', 'es'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export const LOCALE_COOKIE = 'locale';

export const localeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  es: 'Español',
};

export function isLocale(value: string | undefined | null): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}
