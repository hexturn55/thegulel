'use client';

import { useState, useEffect } from 'react';
import { Coins, Sparkles, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useCoinStore } from '@/stores/useCoinStore';
import { formatPrice } from '@/lib/utils';

interface CoinPackage {
  id: string;
  name: string;
  coins: number;
  priceUSD: number;
  priceINR: number;
  popular: boolean;
}

export default function CoinWallet() {
  const { user } = useAuthStore();
  const { packages, setPackages } = useCoinStore();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const response = await fetch('/api/coins/packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data.packages);
      }
    } catch (error) {
      console.error('Failed to fetch packages:', error);
    }
  };

  const handlePurchase = async (pkg: CoinPackage) => {
    if (!user) return;
    
    setIsPurchasing(pkg.id);

    try {
      const response = await fetch('/api/coins/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packageId: pkg.id,
          currency,
        }),
      });

      if (!response.ok) {
        throw new Error('Purchase failed');
      }

      const { url } = await response.json();
      
      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Purchase error:', error);
      alert('Purchase failed. Please try again.');
    } finally {
      setIsPurchasing(null);
    }
  };

  return (
    <div className="min-h-screen bg-black pb-20">
      {/* Balance header */}
      <div className="bg-gradient-to-br from-yellow-500 to-orange-500 p-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Coins className="w-8 h-8 text-white" />
          <span className="text-5xl font-bold text-white">
            {user?.coinBalance || 0}
          </span>
        </div>
        <p className="text-white/90 text-sm">Your Coin Balance</p>
      </div>

      {/* Currency toggle */}
      <div className="px-4 py-4 border-b border-gray-800">
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => setCurrency('USD')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              currency === 'USD'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            USD ($)
          </button>
          <button
            onClick={() => setCurrency('INR')}
            className={`px-6 py-2 rounded-full font-medium transition ${
              currency === 'INR'
                ? 'bg-red-500 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            INR (₹)
          </button>
        </div>
      </div>

      {/* Packages */}
      <div className="px-4 py-6">
        <h2 className="text-white text-xl font-bold mb-4">Coin Packages</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-gray-900 rounded-2xl p-6 border-2 transition ${
                pkg.popular
                  ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                  : 'border-gray-800 hover:border-gray-700'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Most Popular
                </div>
              )}

              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Coins className="w-6 h-6 text-yellow-500" />
                  <span className="text-3xl font-bold text-white">
                    {pkg.coins.toLocaleString()}
                  </span>
                </div>
                <p className="text-gray-400 text-sm">{pkg.name}</p>
              </div>

              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-white">
                  {formatPrice(
                    currency === 'USD' ? pkg.priceUSD : pkg.priceINR,
                    currency
                  )}
                </div>
                <p className="text-gray-500 text-xs mt-1">
                  {(
                    (currency === 'USD' ? pkg.priceUSD : pkg.priceINR) /
                    pkg.coins
                  ).toFixed(3)}{' '}
                  {currency === 'USD' ? '$' : '₹'} per coin
                </p>
              </div>

              <button
                onClick={() => handlePurchase(pkg)}
                disabled={isPurchasing === pkg.id}
                className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition ${
                  pkg.popular
                    ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                    : 'bg-red-500 hover:bg-red-600 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <CreditCard className="w-4 h-4" />
                {isPurchasing === pkg.id ? 'Processing...' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
