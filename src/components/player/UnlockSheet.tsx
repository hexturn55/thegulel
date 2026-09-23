'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Coins, Crown, Loader2, Lock, PlayCircle, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { playRewardedAd, rewardedAdMode } from '@/lib/ima';

const AD_COINS = 5;

interface UnlockSheetProps {
  episodeId: string;
  episodeNumber: number;
  seriesTitle: string;
  coinPrice: number;
  onUnlocked: () => void;
}

/**
 * The coin-monetization moment: shown in the player whenever the viewer reaches
 * a locked episode (by design, right after each pilot). Earning coins by
 * watching an ad is the headline action; unlocking, buying coins and VIP sit
 * underneath it.
 */
export default function UnlockSheet({
  episodeId,
  episodeNumber,
  seriesTitle,
  coinPrice,
  onUnlocked,
}: UnlockSheetProps) {
  const t = useTranslations('paywall');
  const router = useRouter();
  const { user, updateCoinBalance } = useAuthStore();
  const [balance, setBalance] = useState(user?.coinBalance ?? 0);
  const [busy, setBusy] = useState<'ad' | 'unlock' | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<number | null>(null);

  // The persisted store can be stale; refresh the balance from the server.
  useEffect(() => {
    if (!user) return;
    fetch('/api/auth/me')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (d && typeof d.coinBalance === 'number') {
          setBalance(d.coinBalance);
          updateCoinBalance(d.coinBalance);
        }
      })
      .catch(() => undefined);
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (toast === null) return;
    const id = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(id);
  }, [toast]);

  const signIn = () => {
    router.push(`/auth/login?redirectTo=${encodeURIComponent(window.location.pathname)}`);
  };

  const credit = (newBalance: number) => {
    const gained = newBalance - balance;
    setBalance(newBalance);
    updateCoinBalance(newBalance);
    if (gained > 0) setToast(gained);
  };

  const waitForSsvReward = async (before: number): Promise<number | null> => {
    for (let i = 0; i < 8; i++) {
      await new Promise((r) => setTimeout(r, 1500));
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const d = await res.json();
          if (typeof d.coinBalance === 'number' && d.coinBalance > before) return d.coinBalance;
        }
      } catch {
        /* keep polling */
      }
    }
    return null;
  };

  const watchAd = async () => {
    if (!user) return signIn();
    setBusy('ad');
    setNotice(null);
    try {
      if (rewardedAdMode() === 'live') {
        const { played, rewarded } = await playRewardedAd(user.id);
        if (!played) return setNotice(t('adUnavailable'));
        if (!rewarded) return setNotice(t('watchFull'));
        const newBalance = await waitForSsvReward(balance);
        if (newBalance !== null) credit(newBalance);
        else setNotice(t('rewardOnWay'));
        return;
      }

      const start = await fetch('/api/ads/demo/start', { method: 'POST' });
      if (start.status === 401) return signIn();
      if (!start.ok) return setNotice(t('adUnavailable'));
      const { token } = await start.json();

      const { played, rewarded } = await playRewardedAd();
      if (!played) return setNotice(t('adUnavailable'));
      if (!rewarded) return setNotice(t('watchFull'));

      const res = await fetch('/api/ads/demo/reward', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return credit(data.newBalance);
      if (data.error === 'daily_cap') return setNotice(t('dailyLimit'));
      if (data.error === 'cooldown') {
        return setNotice(t('cooldown', { seconds: data.retryAfter ?? 60 }));
      }
      setNotice(t('adFailed'));
    } catch {
      setNotice(t('adFailed'));
    } finally {
      setBusy(null);
    }
  };

  const unlock = async () => {
    if (!user) return signIn();
    setBusy('unlock');
    setNotice(null);
    try {
      const res = await fetch('/api/episodes/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ episodeId }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        if (typeof data.newBalance === 'number') updateCoinBalance(data.newBalance);
        onUnlocked();
        return;
      }
      if (typeof data.balance === 'number') setBalance(data.balance);
      setNotice(t('unlockFailed'));
    } catch {
      setNotice(t('unlockFailed'));
    } finally {
      setBusy(null);
    }
  };

  const canUnlock = balance >= coinPrice;
  const adsNeeded = Math.max(0, Math.ceil((coinPrice - balance) / AD_COINS));
  const pct = Math.min(100, Math.round((balance / coinPrice) * 100));

  return (
    <div
      className="absolute inset-x-0 bottom-0 z-40 rounded-t-3xl border-t border-white/10 bg-zinc-950/95 px-5 pt-5 text-white backdrop-blur-xl"
      style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      onClick={(e) => e.stopPropagation()}
    >
      {toast !== null && (
        <div className="absolute -top-14 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-sm font-bold text-black shadow-lg animate-bounce">
          <Coins className="h-4 w-4" /> {t('earnedToast', { coins: toast })}
        </div>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-pink-500">
          <Lock className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <p className="text-lg font-bold leading-tight">{t('lockedTitle', { number: episodeNumber })}</p>
          <p className="truncate text-sm text-zinc-400">
            {seriesTitle} · {t('teaser')}
          </p>
        </div>
      </div>

      {/* Balance progress toward the unlock price */}
      {user && (
        <div className="mb-4">
          <div className="mb-1.5 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 font-semibold text-amber-400">
              <Coins className="h-4 w-4" /> {t('balanceLabel', { balance, price: coinPrice })}
            </span>
            {!canUnlock && <span className="text-zinc-400">{t('adsNeeded', { count: adsNeeded })}</span>}
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-2.5">
        {canUnlock && user ? (
          <button
            onClick={unlock}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 py-4 text-base font-bold text-black shadow-lg shadow-orange-500/20 transition hover:brightness-110 disabled:opacity-60 animate-pulse"
          >
            {busy === 'unlock' ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
            {t('unlockNow', { price: coinPrice })}
          </button>
        ) : (
          <button
            onClick={watchAd}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 text-base font-bold shadow-lg shadow-rose-500/25 transition hover:brightness-110 disabled:opacity-60"
          >
            {busy === 'ad' ? <Loader2 className="h-5 w-5 animate-spin" /> : <PlayCircle className="h-5 w-5" />}
            {user ? t('watchAdCta', { coins: AD_COINS }) : t('signInToEarn')}
          </button>
        )}

        {canUnlock && user && (
          <button
            onClick={watchAd}
            disabled={busy !== null}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold transition hover:border-zinc-500 disabled:opacity-60"
          >
            <PlayCircle className="h-4 w-4" /> {t('watchAdCta', { coins: AD_COINS })}
          </button>
        )}

        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => router.push('/wallet')}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold transition hover:border-zinc-500"
          >
            <Coins className="h-4 w-4 text-amber-400" /> {t('buyCoins')}
          </button>
          <button
            onClick={() => router.push('/vip')}
            className="flex items-center justify-center gap-1.5 rounded-2xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            <Crown className="h-4 w-4" /> {t('vipShort')}
          </button>
        </div>
      </div>

      {notice && <p className="mt-3 text-center text-sm text-rose-300">{notice}</p>}
    </div>
  );
}
