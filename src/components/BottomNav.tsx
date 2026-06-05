'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, Search, Wallet, User, Crown } from 'lucide-react';

const NAV_ITEMS = [
  { icon: Home, key: 'home', href: '/' },
  { icon: Search, key: 'search', href: '/search' },
  { icon: Crown, key: 'vip', href: '/vip' },
  { icon: Wallet, key: 'wallet', href: '/wallet' },
  { icon: User, key: 'profile', href: '/profile' },
] as const;

export default function BottomNav() {
  const pathname = usePathname();
  const t = useTranslations('nav');

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-black/95 backdrop-blur-sm border-t border-gray-800">
      <div
        className="flex items-center justify-around px-2 pt-2"
        style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
      >
        {NAV_ITEMS.map(({ icon: Icon, key, href }) => {
          const isActive = pathname === href;

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition ${
                isActive
                  ? 'text-red-500'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-red-500/20' : ''}`} />
              <span className="text-xs font-medium">{t(key)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
