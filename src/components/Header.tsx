'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { Coins, LogOut, User as UserIcon, Wallet } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import LanguageMenu from '@/components/LanguageMenu';

export default function Header() {
  const { user, isAuthenticated, logout, checkSession } = useAuthStore();
  const t = useTranslations('header');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync auth state on mount
  useEffect(() => {
    checkSession();
  }, []);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
  };

  return (
    <header
      className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm border-b border-gray-800"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="The Gulel"
            width={140}
            height={38}
            className="h-9 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center gap-2">
          {/* Language switcher — always available, even when logged out */}
          <LanguageMenu />

          {isAuthenticated && user ? (
            <>
              {/* Coin balance badge */}
              <Link
                href="/wallet"
                className="flex items-center gap-1.5 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 px-3 py-1.5 rounded-full transition"
              >
                <Coins className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-semibold text-sm">
                  {user.coinBalance.toLocaleString()}
                </span>
              </Link>

              {/* Avatar / user menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-800 transition focus:outline-none"
                  aria-label="User menu"
                >
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name ?? 'User'}
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-700"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center ring-2 ring-gray-700">
                      <span className="text-white text-sm font-bold">
                        {(user.name?.[0] ?? user.email?.[0] ?? user.phone?.[0] ?? 'U').toUpperCase()}
                      </span>
                    </div>
                  )}
                </button>

                {/* Dropdown */}
                {menuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-gray-800">
                      <p className="text-white text-sm font-semibold truncate">
                        {user.name ?? user.email ?? user.phone ?? 'User'}
                      </p>
                      <p className="text-gray-500 text-xs truncate">
                        {user.email ?? user.phone ?? ''}
                      </p>
                    </div>

                    {/* Menu items */}
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
                    >
                      <UserIcon className="w-4 h-4" />
                      {t('myProfile')}
                    </Link>
                    <Link
                      href="/wallet"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-gray-800 transition text-sm"
                    >
                      <Wallet className="w-4 h-4" />
                      {t('wallet', { count: user.coinBalance.toLocaleString() })}
                    </Link>

                    <div className="border-t border-gray-800" />

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-gray-800 transition text-sm"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('signOut')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <Link
              href="/auth/login"
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white text-sm font-semibold px-4 py-2 rounded-full transition"
            >
              {t('signIn')}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
