'use client';

import { useState } from 'react';
import { ChevronRight, Globe, Bell, Moon, Info, Trash2 } from 'lucide-react';

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'Hindi' },
  { code: 'zh', label: 'Chinese' },
];

const APP_VERSION = '1.0.0';

export default function SettingsPage() {
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Header */}
      <div className="px-4 py-6 border-b border-gray-800">
        <h1 className="text-white text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-4 py-4 space-y-6">

        {/* Language */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Language
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-800">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => setLanguage(code)}
                className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-gray-400" />
                  <span className="text-white text-sm">{label}</span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                    language === code
                      ? 'border-red-500 bg-red-500'
                      : 'border-gray-600'
                  }`}
                >
                  {language === code && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Notifications */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Notifications
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">Push Notifications</p>
                  <p className="text-gray-500 text-xs mt-0.5">New episodes and updates</p>
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
            Appearance
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Moon className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-white text-sm">Dark Mode</p>
                  <p className="text-gray-500 text-xs mt-0.5">Always on for the best experience</p>
                </div>
              </div>
              <span className="text-gray-500 text-sm">On</span>
            </div>
          </div>
        </section>

        {/* About */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            About
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden divide-y divide-gray-800">
            <div className="flex items-center justify-between px-4 py-4">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-400" />
                <span className="text-white text-sm">Version</span>
              </div>
              <span className="text-gray-500 text-sm">{APP_VERSION}</span>
            </div>

            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition">
              <span className="text-white text-sm">Privacy Policy</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>

            <button className="w-full flex items-center justify-between px-4 py-4 hover:bg-gray-800 transition">
              <span className="text-white text-sm">Terms of Service</span>
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </section>

        {/* Danger zone */}
        <section>
          <h2 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3 px-1">
            Danger Zone
          </h2>
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <button className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-800 transition">
              <Trash2 className="w-5 h-5 text-red-400" />
              <span className="text-red-400 text-sm">Delete Account</span>
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}
