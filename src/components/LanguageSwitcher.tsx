'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';
import { locales, localeNames, LOCALE_COOKIE, type Locale } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persist the chosen locale in the cookie next-intl reads server-side. */
function persistLocale(loc: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${loc};path=/;max-age=${ONE_YEAR};samesite=lax`;
}

/**
 * Language selector. Persists the choice in the `locale` cookie (read
 * server-side by next-intl) and refreshes so the new messages render.
 */
export default function LanguageSwitcher() {
  const router = useRouter();
  const active = useLocale();
  const [isPending, startTransition] = useTransition();

  const select = (loc: Locale) => {
    persistLocale(loc);
    startTransition(() => router.refresh());
  };

  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-800">
      {locales.map((code) => (
        <button
          key={code}
          onClick={() => select(code)}
          disabled={isPending}
          className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition disabled:opacity-60"
        >
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-gray-400" />
            <span className="text-white text-sm">{localeNames[code]}</span>
          </div>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
              active === code ? 'border-red-500 bg-red-500' : 'border-gray-600'
            }`}
          >
            {active === code && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </button>
      ))}
    </div>
  );
}
