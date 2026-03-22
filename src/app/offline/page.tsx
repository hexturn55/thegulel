'use client';

import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mb-6">
        <WifiOff className="w-10 h-10 text-white" />
      </div>

      <h1 className="text-white text-2xl font-bold mb-3">You're offline</h1>
      <p className="text-gray-400 text-base mb-8 max-w-xs">
        Check your connection and try again.
      </p>

      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full transition"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </div>
  );
}
