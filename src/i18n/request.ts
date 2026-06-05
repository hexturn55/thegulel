import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isLocale, LOCALE_COOKIE } from './config';

/**
 * Locale is selected per-request from the `locale` cookie (no URL routing),
 * defaulting to English. The language switcher sets that cookie.
 */
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const candidate = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(candidate) ? candidate : defaultLocale;

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
