import type { Metadata } from 'next';
import Image from 'next/image';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { Coins, Crown, Info, Play } from 'lucide-react';
import { ATTRIBUTION_KEYS } from '@/lib/attribution';
import { isInAppBrowser } from '@/lib/in-app-browser';
import { FLAGSHIP_SLUG, publishedSeries, seriesSlug } from '@/lib/short-links';
import { SOCIAL_LINKS } from '@/lib/social-links';

// Live catalog, and every link echoes the visitor's UTMs — render per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Watch Gulel Originals',
  description: 'Hindi vertical micro-dramas. Episode 1 of every series is free.',
  robots: { index: false, follow: false },
};

const FLAGSHIP = {
  title: 'Pishachini: The Healer',
  poster: '/thumbnails/pishachini-the-healer.png',
};
const FALLBACK_POSTER = '/thumbnails/_fallback.png';

async function getCatalog() {
  try {
    return await publishedSeries();
  } catch (err) {
    console.error('[go] catalog load failed:', err);
    return [];
  }
}

/**
 * Link-in-bio page (thegulel.com/go) for social profiles. Built for the
 * Instagram/Facebook in-app browser: one column, plain links, no hover-only UI.
 * Series links go through /go/{slug}, which drops the viewer into Episode 1.
 */
export default async function GoPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [query, catalog, requestHeaders, t, tg] = await Promise.all([
    searchParams,
    getCatalog(),
    headers(),
    getTranslations('auth'),
    getTranslations('genres'),
  ]);
  const inApp = isInAppBrowser(requestHeaders.get('user-agent'));
  const socials = SOCIAL_LINKS.filter((l) => l.href);

  // Carry the visitor's campaign params onto every internal link.
  const carry = new URLSearchParams();
  for (const key of ATTRIBUTION_KEYS) {
    const value = query[key];
    const first = Array.isArray(value) ? value[0] : value;
    if (first) carry.set(key, first);
  }
  const qs = carry.toString();
  const href = (path: string) => (qs ? `${path}?${qs}` : path);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      <main
        className="mx-auto w-full max-w-md px-4 pb-10"
        style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top))' }}
      >
        <header className="mb-5 text-center">
          <Image
            src="/logo.png"
            alt="Gulel"
            width={180}
            height={44}
            priority
            className="mx-auto h-9 w-auto"
          />
          <p className="mt-2 text-sm text-zinc-400">Hindi micro-dramas · Episode 1 free</p>
        </header>

        {inApp && (
          <p className="mb-4 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2.5 text-xs text-amber-200">
            <Info className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
            <span>{t('inAppGoogleHint')}</span>
          </p>
        )}

        {/* Flagship */}
        <a
          href={href(`/go/${FLAGSHIP_SLUG}`)}
          className="mb-7 block overflow-hidden rounded-3xl border border-zinc-800 transition active:scale-[0.99]"
        >
          <div className="relative aspect-[4/5]">
            {/* Top-anchored crop keeps the poster's own title art out from under ours */}
            <Image
              src={FLAGSHIP.poster}
              alt={FLAGSHIP.title}
              fill
              priority
              sizes="(max-width: 448px) 100vw, 448px"
              className="object-cover object-top"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <span className="mb-2 inline-block rounded-full border border-amber-400/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
                Gulel Original
              </span>
              <h1 className="text-2xl font-extrabold leading-tight text-white">{FLAGSHIP.title}</h1>
              <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-rose-500 px-5 py-2.5 text-sm font-bold text-white">
                <Play className="h-4 w-4 fill-white" aria-hidden="true" /> Watch Episode 1 free
              </span>
            </div>
          </div>
        </a>

        {/* Every published series */}
        {catalog.length > 0 && (
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
              All series
            </h2>
            <ul className="grid grid-cols-3 gap-3">
              {catalog.map((s) => (
                <li key={s.id}>
                  <a href={href(`/go/${seriesSlug(s.title)}`)} className="block transition active:opacity-80">
                    <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-zinc-900">
                      <Image
                        src={s.thumbnail || FALLBACK_POSTER}
                        alt={s.title}
                        fill
                        sizes="(max-width: 448px) 30vw, 140px"
                        className="object-cover"
                      />
                    </div>
                    <p className="mt-1.5 line-clamp-2 text-xs font-semibold leading-tight text-white">
                      {s.title}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {tg.has(s.genre) ? tg(s.genre) : s.genre}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Coins / VIP */}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <a
            href={href('/wallet')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 py-3 text-sm font-semibold transition active:bg-zinc-800"
          >
            <Coins className="h-4 w-4 text-amber-400" aria-hidden="true" /> Get coins
          </a>
          <a
            href={href('/vip')}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 py-3 text-sm font-semibold text-amber-300 transition active:bg-amber-500/20"
          >
            <Crown className="h-4 w-4" aria-hidden="true" /> Go VIP
          </a>
        </div>

        {/* Socials (hidden until at least one profile URL is filled in) */}
        {socials.length > 0 && (
        <nav aria-label="Gulel on social media" className="mt-8 flex flex-wrap justify-center gap-2">
          {socials.map((l) => (
            <a
              key={l.label}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition active:bg-zinc-900"
            >
              {l.label}
            </a>
          ))}
        </nav>
        )}

        <p className="mt-8 text-center text-xs text-zinc-500">Gulel Originals are made with AI.</p>
      </main>
    </div>
  );
}
