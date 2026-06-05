'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Crown, Check, Sparkles, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/useAuthStore';
import { VIP_PLANS, type VipPlanId } from '@/lib/vip-plans';
import { formatPrice, formatDate } from '@/lib/utils';

const INTERVAL_KEY: Record<string, 'perWeek' | 'perMonth' | 'perYear'> = {
  week: 'perWeek',
  month: 'perMonth',
  year: 'perYear',
};

interface ActiveSub {
  plan: string;
  status: string;
  endDate: string;
}

export default function VipPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const t = useTranslations('vip');
  const PERKS = [t('perk1'), t('perk2'), t('perk3'), t('perk4')];

  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');
  const [subscribing, setSubscribing] = useState<VipPlanId | null>(null);
  const [sub, setSub] = useState<ActiveSub | null>(null);
  const [loadingSub, setLoadingSub] = useState(true);

  const success = searchParams.get('success');
  const canceled = searchParams.get('canceled');

  useEffect(() => {
    fetch('/api/subscriptions')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setSub(d?.subscription ?? null))
      .catch(() => {})
      .finally(() => setLoadingSub(false));
  }, []);

  const handleSubscribe = async (planId: VipPlanId) => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login?redirectTo=/vip');
      return;
    }

    setSubscribing(planId);
    try {
      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, currency }),
      });
      if (!res.ok) throw new Error('Checkout failed');
      const { url } = await res.json();
      window.location.href = url;
    } catch (err) {
      console.error('VIP subscribe error:', err);
      alert('Could not start checkout. Please try again.');
      setSubscribing(null);
    }
  };

  const isVip = !!sub;

  return (
    <div className="min-h-screen bg-black pb-24">
      {/* Hero */}
      <div className="bg-gradient-to-br from-yellow-500 via-amber-500 to-orange-500 px-6 pt-10 pb-12 text-center">
        <div className="w-16 h-16 rounded-full bg-black/20 flex items-center justify-center mx-auto mb-4">
          <Crown className="w-9 h-9 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">{t('title')}</h1>
        <p className="text-white/90 text-sm max-w-sm mx-auto">
          {t('subtitle')}
        </p>
      </div>

      <div className="px-4 -mt-6">
        {/* Status / banners */}
        {success && (
          <div className="mb-4 p-4 rounded-xl bg-green-500/15 border border-green-500/30 text-green-300 text-sm text-center">
            {t('success')}
          </div>
        )}
        {canceled && !success && (
          <div className="mb-4 p-4 rounded-xl bg-gray-800 border border-gray-700 text-gray-300 text-sm text-center">
            {t('canceled')}
          </div>
        )}

        {!loadingSub && isVip && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-yellow-500/15 to-orange-500/10 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-300 font-bold">
                {t('activeTitle', { plan: sub!.plan })}
              </span>
            </div>
            <p className="text-gray-300 text-sm">
              {t('activeDesc', { date: formatDate(sub!.endDate) })}
            </p>
          </div>
        )}

        {/* Perks */}
        <div className="mb-6 rounded-2xl bg-gray-900 border border-gray-800 p-5">
          <ul className="space-y-3">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                  <Check className="w-3 h-3 text-yellow-400" />
                </span>
                <span className="text-gray-200 text-sm">{perk}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Currency toggle */}
        <div className="flex gap-2 justify-center mb-5">
          {(['USD', 'INR'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setCurrency(c)}
              className={`px-6 py-2 rounded-full font-medium transition ${
                currency === c
                  ? 'bg-yellow-500 text-black'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {c === 'USD' ? 'USD ($)' : 'INR (₹)'}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {VIP_PLANS.map((plan) => {
            const price = currency === 'USD' ? plan.priceUSD : plan.priceINR;
            return (
              <div
                key={plan.id}
                className={`relative bg-gray-900 rounded-2xl p-6 border-2 transition ${
                  plan.popular
                    ? 'border-yellow-500 shadow-lg shadow-yellow-500/20'
                    : 'border-gray-800 hover:border-gray-700'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black px-4 py-1 rounded-full text-xs font-bold flex items-center gap-1 whitespace-nowrap">
                    <Sparkles className="w-3 h-3" />
                    {t('mostPopular')}
                  </div>
                )}

                <div className="text-center mb-4">
                  <p className="text-gray-400 text-sm mb-2">{plan.name}</p>
                  <div className="flex items-end justify-center gap-1">
                    <span className="text-3xl font-bold text-white">
                      {formatPrice(price, currency)}
                    </span>
                    <span className="text-gray-500 text-sm mb-1">
                      {t(INTERVAL_KEY[plan.interval])}
                    </span>
                  </div>
                  {plan.blurb && (
                    <p className="text-gray-500 text-xs mt-2">{plan.blurb}</p>
                  )}
                </div>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={subscribing !== null || isVip}
                  className={`w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed ${
                    plan.popular
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-black'
                      : 'bg-gray-800 hover:bg-gray-700 text-white'
                  }`}
                >
                  {subscribing === plan.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : isVip ? (
                    t('alreadyVip')
                  ) : (
                    t('goVip')
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <p className="text-gray-600 text-xs text-center mt-6 leading-relaxed">
          {t('footnote')}
        </p>
      </div>
    </div>
  );
}
