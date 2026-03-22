'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform configuration and admin settings.</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 flex flex-col items-center gap-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center">
          <Settings size={28} className="text-gray-500" />
        </div>
        <div>
          <p className="text-gray-300 font-medium">Settings Coming Soon</p>
          <p className="text-gray-600 text-sm mt-1">
            Platform settings, notification preferences, and configuration options will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
