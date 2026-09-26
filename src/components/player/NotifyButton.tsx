'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { analytics } from '@/lib/analytics';

interface NotifyButtonProps {
  seriesId: string;
  seriesTitle: string;
  episodeId: string;
  /** The last available episode, which the viewer just finished. */
  episodeNumber: number;
  /** Back from signing in after tapping the button: finish the opt-in. */
  autoSubscribe?: boolean;
}

type State = 'loading' | 'hidden' | 'off' | 'on' | 'saving';

/**
 * "Notify me when Episode N+1 drops", shown on the end card of the last
 * available episode. Opt-ins are the pilot tournament's season-demand signal
 * (marketing/04-paid-media.md §4). Signed-out viewers go through login and
 * come back to /watch/{id}?notify=1, which completes the opt-in.
 */
export default function NotifyButton({
  seriesId,
  seriesTitle,
  episodeId,
  episodeNumber,
  autoSubscribe = false,
}: NotifyButtonProps) {
  const t = useTranslations('player');
  const router = useRouter();
  const [state, setState] = useState<State>('loading');
  const [signedIn, setSignedIn] = useState(false);
  const [failed, setFailed] = useState(false);
  const next = episodeNumber + 1;

  const save = useCallback(
    async (subscribe: boolean) => {
      setState('saving');
      setFailed(false);
      try {
        const res = await fetch(`/api/series/${seriesId}/notify`, {
          method: subscribe ? 'POST' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: subscribe ? JSON.stringify({ afterEpisode: episodeNumber }) : undefined,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setState(subscribe ? 'on' : 'off');
        analytics.notifyMe({ seriesId, seriesTitle, episodeNumber }, subscribe);
      } catch {
        setFailed(true);
        setState(subscribe ? 'off' : 'on');
      }
    },
    [seriesId, seriesTitle, episodeNumber]
  );

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/series/${seriesId}/notify`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { available?: boolean; signedIn?: boolean; subscribed?: boolean } | null) => {
        if (cancelled) return;
        if (!data?.available) return setState('hidden');
        setSignedIn(!!data.signedIn);
        if (data.subscribed) return setState('on');
        if (data.signedIn && autoSubscribe) return void save(true);
        setState('off');
      })
      .catch(() => {
        if (!cancelled) setState('hidden');
      });
    return () => {
      cancelled = true;
    };
  }, [seriesId, autoSubscribe, save]);

  if (state === 'hidden') return null;

  const onClick = () => {
    if (state === 'on') return void save(false);
    if (!signedIn) {
      router.push(`/auth/login?redirectTo=${encodeURIComponent(`/watch/${episodeId}?notify=1`)}`);
      return;
    }
    void save(true);
  };

  const busy = state === 'loading' || state === 'saving';
  return (
    <div className="mb-6 flex w-full max-w-xs flex-col items-center gap-2">
      <button
        onClick={onClick}
        disabled={busy}
        aria-pressed={state === 'on'}
        className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition disabled:opacity-70 ${
          state === 'on'
            ? 'border border-emerald-400/50 bg-emerald-500/15 text-emerald-200'
            : 'bg-amber-400 text-black hover:bg-amber-300'
        }`}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : state === 'on' ? (
          <BellRing className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Bell className="h-4 w-4" aria-hidden="true" />
        )}
        {state === 'on' ? t('notifyOn', { number: next }) : t('notifyCta', { number: next })}
      </button>
      {state === 'on' && (
        <button onClick={onClick} className="text-xs text-gray-400 underline underline-offset-2 hover:text-white">
          {t('notifyUndo')}
        </button>
      )}
      {failed && <p className="text-xs text-rose-300">{t('notifyError')}</p>}
    </div>
  );
}
