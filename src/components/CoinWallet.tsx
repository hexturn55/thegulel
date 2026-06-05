'use client';

import { useState, useEffect } from 'react';
import { Coins, Sparkles, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
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

interface RazorpayInstance {
  open: () => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/** Lazily injects the Razorpay Checkout script; resolves once it's ready. */
function loadRazorpayScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${RAZORPAY_SCRIPT}"]`
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(true));
      existing.addEventListener('error', () => resolve(false));
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CoinWallet() {
  const { user } = useAuthStore();
  const { packages, setPackages } = useCoinStore();
  const [isPurchasing, setIsPurchasing] = useState<string | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const t = useTranslations('wallet');

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
      // India payments go through Razorpay when it's configured; everything
      // else (and the fallback) goes through Stripe Checkout.
      const useRazorpay =
        currency === 'INR' && !!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (useRazorpay) {
        const handled = await payWithRazorpay(pkg);
        if (handled) return;
        // Razorpay unavailable (e.g. not configured server-side) — fall back.
      }

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

  /**
   * Opens Razorpay Checkout for an INR purchase.
   * Returns `true` if the flow was launched, `false` to fall back to Stripe.
   */
  const payWithRazorpay = async (pkg: CoinPackage): Promise<boolean> => {
    const orderRes = await fetch('/api/coins/razorpay/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ packageId: pkg.id }),
    });

    if (orderRes.status === 503) return false; // not configured → fall back
    if (!orderRes.ok) throw new Error('Failed to create Razorpay order');

    const order = await orderRes.json();
    const loaded = await loadRazorpayScript();
    if (!loaded || !window.Razorpay) return false;

    return new Promise<boolean>((resolve) => {
      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        name: 'Gulel',
        description: `${order.coins} Coins — ${order.name}`,
        order_id: order.orderId,
        prefill: {
          name: user?.name ?? undefined,
          email: user?.email ?? undefined,
          contact: user?.phone ?? undefined,
        },
        theme: { color: '#ef4444' },
        handler: () => {
          // Coins are credited by the server webhook (payment.captured).
          window.location.href = '/wallet?success=true';
          resolve(true);
        },
        modal: {
          ondismiss: () => resolve(true), // user closed — handled, no fallback
        },
      });
      rzp.open();
    });
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
        <p className="text-white/90 text-sm">{t('balance')}</p>
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
        <h2 className="text-white text-xl font-bold mb-4">{t('packages')}</h2>
        
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
                  {t('perCoin', {
                    price: `${(
                      (currency === 'USD' ? pkg.priceUSD : pkg.priceINR) /
                      pkg.coins
                    ).toFixed(3)} ${currency === 'USD' ? '$' : '₹'}`,
                  })}
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
                {isPurchasing === pkg.id ? t('processing') : t('buyNow')}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
