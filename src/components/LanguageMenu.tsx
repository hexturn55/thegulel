'use client';

import { useEffect, useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Globe, Check } from 'lucide-react';
import { locales, localeNames, LOCALE_COOKIE, type Locale } from '@/i18n/config';

const ONE_YEAR = 60 * 60 * 24 * 365;

/** Persist the chosen locale in the cookie next-intl reads server-side. */
function persistLocale(loc: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${loc};path=/;max-age=${ONE_YEAR};samesite=lax`;
}

/**
 * Compact language switcher for the header — a globe button with a dropdown.
 * Visible to everyone (including logged-out users) so the UI language can be
 * changed from anywhere, not just the Settings page.
 */
export default function LanguageMenu() {
  const router = useRouter();
  const active = useLocale() as Locale;
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const select = (loc: Locale) => {
    setOpen(false);
    if (loc === active) return;
    persistLocale(loc);
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex items-center gap-1.5 p-2 rounded-full text-gray-300 hover:text-white hover:bg-gray-800 transition focus:outline-none disabled:opacity-60"
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="text-xs font-semibold uppercase">{active}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-44 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden z-30">
          {locales.map((code) => (
            <button
              key={code}
              onClick={() => select(code)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition"
            >
              <span>{localeNames[code]}</span>
              {active === code && <Check className="w-4 h-4 text-red-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
