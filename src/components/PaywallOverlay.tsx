'use client';

import { useState } from 'react';
import { Lock, Coins, Play } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRouter } from 'next/navigation';

interface PaywallOverlayProps {
  episodeId: string;
  coinPrice?: number;
}

export default function PaywallOverlay({ episodeId, coinPrice = 10 }: PaywallOverlayProps) {
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const { user, updateCoinBalance } = useAuthStore();
  const router = useRouter();

  const handleUnlockWithCoins = async () => {
    if (!user) {
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/auth/login?redirectTo=${returnUrl}`);
      return;
    }

    if (user.coinBalance < coinPrice) {
      router.push('/wallet');
      return;
    }

    setIsUnlocking(true);
    
    try {
      const response = await fetch('/api/episodes/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });

      if (!response.ok) {
        throw new Error('Failed to unlock episode');
      }

      const data = await response.json();
      updateCoinBalance(data.newBalance);
      
      // Reload to show unlocked video
      router.refresh();
    } catch (error) {
      console.error('Unlock failed:', error);
      alert('Failed to unlock episode. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleWatchAd = async () => {
    setIsWatchingAd(true);
    
    // In production, integrate with ad network (Google AdMob, Unity Ads, etc.)
    // For now, simulate ad watching
    setTimeout(async () => {
      try {
        const response = await fetch('/api/coins/ad-reward', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const data = await response.json();
          updateCoinBalance(data.newBalance);
          alert(`You earned ${data.coinsEarned} coins!`);
        }
      } catch (error) {
        console.error('Ad reward failed:', error);
      } finally {
        setIsWatchingAd(false);
      }
    }, 3000);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-b from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="max-w-sm w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Episode Locked
          </h2>
          <p className="text-gray-400 text-sm">
            Unlock this episode to continue watching
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={handleUnlockWithCoins}
            disabled={isUnlocking}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all transform hover:scale-105"
          >
            <Coins className="w-5 h-5" />
            <span>
              {isUnlocking ? 'Unlocking...' : `Unlock with ${coinPrice} Coins`}
            </span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-2 bg-black text-gray-500">OR</span>
            </div>
          </div>

          <button
            onClick={handleWatchAd}
            disabled={isWatchingAd}
            className="w-full bg-gray-800 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center gap-3 transition-all border border-gray-700"
          >
            <Play className="w-5 h-5" />
            <span>
              {isWatchingAd ? 'Loading Ad...' : 'Watch Ad to Earn Coins'}
            </span>
          </button>
        </div>

        <div className="text-center">
          <p className="text-gray-500 text-xs mb-2">Your Balance</p>
          <div className="flex items-center justify-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            <span className="text-2xl font-bold text-white">
              {user?.coinBalance || 0}
            </span>
          </div>
          
          <button
            onClick={() => router.push('/wallet')}
            className="mt-4 text-red-500 hover:text-red-400 text-sm font-medium"
          >
            Buy More Coins →
          </button>
        </div>
      </div>
    </div>
  );
}
