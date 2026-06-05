'use client';

import { useState } from 'react';
import { ChevronRight, Bell, Moon, Info, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const APP_VERSION = '1.0.0';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-800">
        <h1 className="text-white text-2xl font-bold">{t('title')}</h1>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Language */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            {t('language')}
          </h2>
          <LanguageSwitcher />
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            {t('notifications')}
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">{t('pushNotifications')}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t('pushDesc')}</p>
                </div>
              </div>
              {/* Toggle */}
              <button
                onClick={() => setNotifications((v) => !v)}
                className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
                  notifications ? 'bg-red-500' : 'bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${
                    notifications ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            {t('appearance')}
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">{t('darkMode')}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{t('darkDesc')}</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">{t('on')}</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            {t('about')}
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-800">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-400" />
                <span className="text-white text-sm">{t('version')}</span>
              </div>
              <span className="text-gray-500 text-sm">{APP_VERSION}</span>
            </div>

            <a href="/privacy" className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition">
              <span className="text-white text-sm">{t('privacy')}</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </a>

            <a href="/terms" className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition">
              <span className="text-white text-sm">{t('terms')}</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </a>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            {t('dangerZone')}
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <a href="/profile" className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800 transition">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">{t('deleteAccount')}</span>
            </a>
          </div>
        </section>

      </div>
    </div>
  );
}
