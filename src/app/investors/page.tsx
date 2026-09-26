import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Clapperboard,
  Coins,
  Crown,
  Flame,
  IndianRupee,
  Megaphone,
  PlayCircle,
  Rocket,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { resolvePlayableUrl } from '@/lib/cloudflare';
import DemoPhone, { type DemoEpisode, type DemoLocked } from './DemoPhone';

// Signed stream URLs expire, and the catalog is live — render per request.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Investors',
  description:
    "Gulel — India's vertical entertainment revolution. Market, model, economics and the ₹40 Cr Series A.",
  robots: { index: false, follow: false },
};

async function getDemo(): Promise<{ episodes: DemoEpisode[]; locked: DemoLocked | null }> {
  try {
    const free = await prisma.episode.findMany({
      where: { isFree: true, series: { status: 'PUBLISHED' } },
      orderBy: [{ series: { createdAt: 'desc' } }, { episodeNumber: 'asc' }],
      include: { series: { select: { title: true, genre: true } } },
      take: 5,
    });
    const episodes = await Promise.all(
      free.map(async (e) => ({
        id: e.id,
        seriesId: e.seriesId,
        seriesTitle: e.series.title,
        genre: e.series.genre,
        episodeNumber: e.episodeNumber,
        title: e.title,
        src: await resolvePlayableUrl(e),
      }))
    );
    const last = free[free.length - 1];
    const next = last
      ? await prisma.episode.findFirst({
          where: { seriesId: last.seriesId, isFree: false },
          orderBy: { episodeNumber: 'asc' },
          include: { series: { select: { title: true, thumbnail: true } } },
        })
      : null;
    return {
      episodes: episodes.filter((e) => e.src),
      locked: next
        ? {
            seriesTitle: next.series.title,
            episodeNumber: next.episodeNumber,
            title: next.title,
            poster: next.series.thumbnail,
          }
        : null,
    };
  } catch (err) {
    console.error('[investors] demo load failed:', err);
    return { episodes: [], locked: null };
  }
}

async function getCatalog() {
  try {
    return await prisma.series.findMany({
      where: { status: 'PUBLISHED' },
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, title: true, thumbnail: true, genre: true, totalEpisodes: true },
    });
  } catch {
    return [];
  }
}

/* ── Deck data (Gulel Investor Deck v2, 2026) ─────────────────────────── */

const INDIA_MARKET = [
  { year: '2024', v: 0.3 },
  { year: '2025', v: 0.6 },
  { year: '2026', v: 1.1 },
  { year: '2027', v: 1.8 },
  { year: '2028', v: 2.7 },
  { year: '2029', v: 3.6 },
  { year: '2030', v: 4.5 },
];

const CAPITAL = [
  { year: 'Year 1', content: 25, marketing: 15, total: 40, note: 'Aggressive content + market entry' },
  { year: 'Year 2', content: 20, marketing: 10, total: 30, note: 'Scaling, marketing optimized to ₹10 Cr' },
  { year: 'Year 3', content: 17, marketing: 8, total: 25, note: 'Pipeline optimized; spend reduced' },
];

const RECOVERY = [
  {
    year: 'Year 1',
    pct: 30,
    title: 'Market penetration & foundation',
    body: 'A ₹40 Cr initial outlay drives aggressive content creation and market entry. Goal: capture market share. ~30% capital recovery as the library builds, the core audience forms, and early monetization loops are tested.',
  },
  {
    year: 'Year 2',
    pct: 55,
    title: 'Scaling & aggressive recovery',
    body: 'As the library matures and marketing optimizes down to ₹10 Cr, organic growth accelerates. Greater efficiency drives a projected 50–60% cost recovery — pushing the platform close to breakeven.',
  },
  {
    year: 'Year 3',
    pct: 105,
    title: 'Optimization & net profitability',
    body: 'With the content pipeline highly optimized (spend ₹25 Cr) and compounded retention peaking, the platform crosses breakeven — transitioning from investment phase into full net profitability.',
  },
];

const PACKS = [
  { name: 'Starter', coins: '100', inr: '₹149', usd: '$1.99', per: '≈ ₹1.49 / coin', eps: '~10 episodes' },
  { name: 'Popular', coins: '500', inr: '₹599', usd: '$7.99', per: '≈ ₹1.20 / coin', eps: '~50 episodes', tag: 'Most popular' },
  { name: 'Super', coins: '1,200', inr: '₹1,099', usd: '$14.99', per: '≈ ₹0.92 / coin', eps: '~120 episodes' },
  { name: 'Mega', coins: '3,000', inr: '₹2,499', usd: '$29.99', per: '≈ ₹0.83 / coin', eps: '~300 episodes', tag: 'Best value' },
];

const GTM = [
  {
    phase: '01 · Pre-launch',
    month: 'Month 1',
    title: 'Build the hype',
    items: [
      ['Teaser & trailer campaigns', 'Short vertical teasers and suspense-driven sneak peeks on social.'],
      ['Social media setup', 'Build Instagram, YouTube Shorts & Facebook presence.'],
      ['Influencer outreach', 'Collaborate with creators and meme pages to generate buzz.'],
      ['Audience engagement', 'Polls, countdowns and interactive story campaigns pre-launch.'],
      ['Performance marketing setup', 'Prepare Meta Ads and Google Ads campaigns for launch traffic.'],
    ],
  },
  {
    phase: '02 · Launch',
    month: 'Month 2',
    title: 'Go live, loud',
    items: [
      ['Official platform launch', 'Launch Gulel with promotional campaigns and creator collabs.'],
      ['Social media advertising', 'Scale Instagram Reels, YouTube Shorts & Meta ad campaigns.'],
      ['Content release strategy', 'Begin consistent, binge-worthy vertical drama episode drops.'],
      ['Influencer collaborations', 'Partner with regional creators for reach and engagement.'],
      ['Google & Meta ads', 'Conversion-focused campaigns for installs and audience growth.'],
    ],
  },
  {
    phase: '03 · Post-launch',
    month: 'Month 3',
    title: 'Retain & scale',
    items: [
      ['Retention marketing', 'Push notifications, episode reminders & re-engagement.'],
      ['YouTube & Shorts', 'Continue high-frequency short-form promotional content.'],
      ['Community building', 'Fan pages, comment engagement and interactive communities.'],
      ['Brand collaborations', 'Partner with brands for sponsored entertainment campaigns.'],
      ['Analytics & scaling', 'Analyze behavior and retention; optimize content performance.'],
    ],
  },
];

const STATES = [
  'Maharashtra', 'Delhi', 'Rajasthan', 'Uttar Pradesh', 'Gujarat', 'Karnataka', 'Bihar',
  'Jharkhand', 'Assam', 'West Bengal', 'J&K', 'Odisha', 'Punjab', 'Uttarakhand', 'Himachal',
];

const GENRES = [
  'Family Drama', 'Romance', 'Crime & Noir', 'Horror', 'Thriller', 'Comedy', 'Suspense',
  'Crime', 'Emotional Drama', 'Mystery', 'Action Drama',
];

/* ── Building blocks ──────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">{children}</p>
  );
}

function Title({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 border-l-4 border-rose-500 pl-4 text-3xl font-bold leading-tight text-white md:text-4xl">
      {children}
    </h2>
  );
}

function Section({
  id,
  children,
  className = '',
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`mx-auto max-w-6xl scroll-mt-20 px-5 py-16 md:py-24 ${className}`}>
      {children}
    </section>
  );
}

function Card({ children, accent }: { children: React.ReactNode; accent?: string }) {
  return (
    <div
      className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6"
      style={accent ? { borderTop: `3px solid ${accent}` } : undefined}
    >
      {children}
    </div>
  );
}

function Stat({ value, label, color = 'text-rose-500' }: { value: string; label: string; color?: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
      <p className={`text-3xl font-extrabold md:text-4xl ${color}`}>{value}</p>
      <p className="mt-1 text-sm text-zinc-400">{label}</p>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────── */

export default async function InvestorsPage() {
  const [demo, catalog] = await Promise.all([getDemo(), getCatalog()]);
  const maxIndia = Math.max(...INDIA_MARKET.map((d) => d.v));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-zinc-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0f]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <Link href="/" className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Gulel" className="h-7 w-auto" />
            <span className="hidden text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-400 sm:inline">
              Investor Deck · 2026
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a href="#demo" className="hidden rounded-full px-3 py-1.5 text-zinc-300 hover:text-white md:inline">
              Live demo
            </a>
            <a href="#market" className="hidden rounded-full px-3 py-1.5 text-zinc-300 hover:text-white md:inline">
              Market
            </a>
            <a href="#model" className="hidden rounded-full px-3 py-1.5 text-zinc-300 hover:text-white md:inline">
              Model
            </a>
            <Link
              href="/investors/dashboard"
              className="rounded-full border border-emerald-500/50 px-3 py-1.5 font-semibold text-emerald-300 hover:border-emerald-300 hover:text-white"
            >
              Live metrics
            </Link>
            <a href="#ask" className="rounded-full bg-rose-500 px-4 py-1.5 font-semibold text-white hover:bg-rose-600">
              The Ask
            </a>
          </nav>
        </div>
      </header>

      {/* 01 · Hero */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/investors/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0f] via-[#0a0a0f]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5 py-24 md:py-36">
          <p className="mb-6 text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            H&amp;S · Powered by Vidya Entertainment
          </p>
          <div className="border-l-4 border-rose-500 pl-5">
            <h1 className="text-4xl font-extrabold leading-tight text-white md:text-6xl">
              India&apos;s Vertical Entertainment
              <span className="block text-rose-500">Revolution</span>
            </h1>
          </div>
          <p className="mt-6 max-w-xl text-lg text-zinc-300">
            Mobile-first cinematic micro-drama, built 100% for how 877M Indians actually hold their phones.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Vertical', '2–3 min episodes', 'Daily drops', 'Tier 1 · 2 · 3'].map((t) => (
              <span
                key={t}
                className="rounded-full border border-amber-500/50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-300"
              >
                {t}
              </span>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
            >
              <PlayCircle className="h-5 w-5" /> Watch the live demo
            </a>
            <a
              href="#ask"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-6 py-3 font-semibold text-white hover:border-white"
            >
              Raising ₹40 Cr · Series A <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/investors/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-6 py-3 font-semibold text-emerald-300 hover:border-emerald-300 hover:text-white"
            >
              <TrendingUp className="h-5 w-5" /> Live metrics dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Live product demo */}
      <Section id="demo">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto]">
          <div>
            <Eyebrow>The product · live</Eyebrow>
            <Title>Don&apos;t imagine it. Swipe it.</Title>
            <p className="mb-6 max-w-xl text-zinc-300">
              This phone is running the real Gulel experience — the same streams, the same free episodes and the
              same cliffhanger paywall our viewers see on thegulel.com. Tap to unmute, swipe (or use the arrows) to
              binge the next episode, and keep going until the story locks.
            </p>
            <ol className="mb-8 space-y-3 text-sm text-zinc-300">
              <li className="flex gap-3">
                <span className="font-bold text-rose-500">01</span>
                Instant vertical playback — the hook lands inside the first seconds.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-amber-400">02</span>
                Swipe for the next episode, exactly like a reel.
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-teal-400">03</span>
                Free episodes run out on a cliffhanger → unlock with coins, an ad, or VIP.
              </li>
            </ol>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-5 py-2.5 text-sm font-semibold text-white hover:border-rose-500"
            >
              Open the full app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="flex justify-center">
            {demo.episodes.length > 0 ? (
              <DemoPhone episodes={demo.episodes} locked={demo.locked} />
            ) : (
              <div className="flex aspect-[9/19.5] w-[280px] items-center justify-center rounded-[2.6rem] border border-zinc-800 bg-zinc-950 p-6 text-center text-sm text-zinc-400">
                The live demo is warming up — open the app to watch now.
              </div>
            )}
          </div>
        </div>

        {catalog.length > 0 && (
          <div className="mt-16">
            <p className="mb-4 text-sm font-semibold text-zinc-400">
              The live slate — {catalog.length} original series on the platform today
            </p>
            <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-3">
              {catalog.map((s) => (
                <Link
                  key={s.id}
                  href={`/series/${s.id}`}
                  className="group relative aspect-[9/16] w-32 shrink-0 overflow-hidden rounded-xl bg-zinc-900 md:w-40"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={s.thumbnail}
                    alt={s.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black to-transparent p-2">
                    <p className="text-xs font-semibold leading-tight text-white">{s.title}</p>
                    <p className="text-[10px] text-zinc-400">
                      {s.genre} · {s.totalEpisodes > 0 ? `${s.totalEpisodes} eps` : 'Coming soon'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </Section>

      {/* Live metrics dashboard */}
      <Section id="metrics" className="py-8! md:py-12!">
        <div className="flex flex-col items-start gap-6 rounded-2xl border border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-zinc-900/70 to-zinc-900/70 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-2xl">
            <Eyebrow>For review · live data</Eyebrow>
            <h2 className="text-2xl font-bold text-white md:text-3xl">Review the live metrics dashboard</h2>
            <p className="mt-3 text-sm text-zinc-300 md:text-base">
              Viewership, completion, pilot-to-paid conversion and revenue for every series, read straight from the
              production database — plus spec brand-integration episodes showing in-story product placement.
              Password required; request it at{' '}
              <a href="mailto:hello@thegulel.com?subject=Gulel%20dashboard%20access" className="text-emerald-300 underline">
                hello@thegulel.com
              </a>
              .
            </p>
          </div>
          <Link
            href="/investors/dashboard"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-emerald-500 px-6 py-3 font-semibold text-black hover:bg-emerald-400"
          >
            <TrendingUp className="h-5 w-5" /> Open dashboard <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Section>

      {/* 02 · Vision & Mission */}
      <Section>
        <Eyebrow>Who we are</Eyebrow>
        <Title>Vision &amp; Mission</Title>
        <p className="mb-10 max-w-3xl text-zinc-300">
          Gulel is India&apos;s most dedicated vertical entertainment platform — built 100% mobile-first. Powered by
          Vidya Entertainment, we deliver cinematic short-form drama that hooks viewers instantly and keeps them
          coming back every single day.
        </p>
        <div className="grid gap-5 md:grid-cols-[1fr_1fr_auto]">
          <Card accent="#f43f5e">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-rose-500">Our vision</p>
            <p className="mb-3 text-lg text-white">
              To become India&apos;s most-watched vertical entertainment ecosystem — delivering cinematic short-form
              stories to every mobile screen in Bharat.
            </p>
            <p className="text-sm font-semibold text-zinc-400">Short Format. Massive Impact.</p>
          </Card>
          <Card accent="#fbbf24">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400">Our mission</p>
            <p className="mb-3 text-lg text-white">
              To produce fast-paced, emotion-driven vertical content that entertains, connects, and hooks 100 million
              Indian viewers by 2027.
            </p>
            <p className="text-sm font-semibold text-zinc-400">Built for the scroll generation.</p>
          </Card>
          <div className="hidden gap-3 md:flex">
            {['still-1', 'still-2', 'still-3'].map((s) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={s} src={`/investors/${s}.jpg`} alt="" className="h-full w-24 rounded-xl object-cover" />
            ))}
          </div>
        </div>
      </Section>

      {/* 03 · The Problem */}
      <Section>
        <Eyebrow>The problem</Eyebrow>
        <Title>Entertainment hasn&apos;t caught up to the audience</Title>
        <div className="grid gap-5 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl bg-gradient-to-br from-rose-600 to-rose-900 p-8">
            <p className="text-6xl font-extrabold text-white">+186%</p>
            <p className="mt-3 text-rose-100">
              Vertical short-drama download growth, while traditional OTT downloads fell 7% in Q4 2025.
            </p>
            <p className="mt-6 font-semibold text-white">The audience changed. Entertainment has not.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ['80% mobile, 90% horizontal', '80% of Indians consume on phones, yet 90% of content is built horizontal — for TV screens, not how people hold their phones.'],
              ['Sub-8-second attention', 'Gen Z attention has dropped under 8 seconds, yet no platform lands its story hook inside that window.'],
              ['500M priced out', 'Traditional OTT demands paid subscriptions inaccessible to 500 million Indians.'],
              ['Tier 2 & 3 ignored', "Regional Tier 2 and Tier 3 audiences are completely underserved by today's platforms."],
            ].map(([h, b]) => (
              <Card key={h}>
                <p className="mb-2 font-bold text-white">{h}</p>
                <p className="text-sm text-zinc-400">{b}</p>
              </Card>
            ))}
          </div>
        </div>
      </Section>

      {/* 04–05 · USP + content slate */}
      <section className="relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/investors/drama.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0f] via-[#0a0a0f]/70 to-[#0a0a0f]" />
        <div className="relative mx-auto max-w-6xl px-5 py-20 md:py-28">
          <Eyebrow>The USP</Eyebrow>
          <Title>India&apos;s first dedicated vertical entertainment channel</Title>
          <p className="mb-8 max-w-2xl text-lg text-zinc-300">
            100% mobile-first vertical storytelling. Bite-sized, addictive episodes of 2–3 minutes each — fast-paced
            cinematic drama built for the scroll generation.
          </p>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-zinc-400">
            A genre slate built to binge
          </p>
          <div className="flex flex-wrap gap-2">
            {GENRES.map((g) => (
              <span key={g} className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-sm text-white">
                {g}
              </span>
            ))}
          </div>
          <p className="mt-8 text-xl font-bold text-rose-500">India&apos;s next vertical OTT revolution.</p>
        </div>
      </section>

      {/* 06–09 · Market */}
      <Section id="market">
        <Eyebrow>Market momentum</Eyebrow>
        <Title>The rise of vertical entertainment</Title>
        <p className="mb-8 max-w-2xl text-zinc-300">
          Assessing global market volume and growth momentum — the format is no longer emerging. It is exploding.
        </p>
        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="$1.4B → $9.5B" label="Global vertical-drama market, 2024 → 2030" />
          <Stat value="28%" label="CAGR of the vertical-drama segment" color="text-amber-400" />
          <Stat value="+278%" label="Surge in short-drama downloads in 2025" color="text-teal-400" />
          <Stat value="+115%" label="Growth in global in-app revenue" color="text-violet-400" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat value="$19.3B → $46.4B" label="India digital-video market, by 2033" color="text-white" />
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="text-3xl font-extrabold text-amber-400 md:text-4xl">$300M</p>
            <p className="mt-1 text-sm text-zinc-400">
              India&apos;s vertical-drama market crossed $300M in Year 1 with 450M downloads and 100M monthly active
              users — more than most OTT platforms reach in their first three years.
            </p>
          </div>
        </div>

        <blockquote className="my-16 border-l-4 border-amber-400 pl-6 text-xl leading-relaxed text-zinc-200 md:text-2xl">
          India&apos;s micro-drama market is undergoing an unprecedented surge — projected to skyrocket from near-zero
          to a <span className="font-bold text-white">$4.5 billion</span>{' '}industry by 2030. As the nation&apos;s
          fastest-growing entertainment segment, it is rapidly closing the gap to challenge traditional OTT
          benchmarks.
          <footer className="mt-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            Industry outlook · India micro-drama 2030
          </footer>
        </blockquote>

        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-amber-400">The trajectory</p>
            <p className="mb-6 text-xl font-bold text-white">Near-zero to $4.5B in six years</p>
            <div className="flex h-64 items-end gap-2 sm:gap-4" role="img" aria-label="India micro-drama market, 2024 to 2030, in billions of dollars">
              {INDIA_MARKET.map((d) => (
                <div key={d.year} className="flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-xs font-semibold text-white">${d.v}B</span>
                  <div
                    className="w-full rounded-t-md bg-gradient-to-t from-rose-700 to-rose-500"
                    style={{ height: `${(d.v / maxIndia) * 85}%` }}
                  />
                  <span className="mt-2 text-xs text-zinc-500">{d.year}</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500">India micro-drama market ($B)</p>
          </div>
          <div className="flex flex-col gap-4">
            <Stat value="$300M" label="Captured in Year 1 alone — already proving Indian demand for vertical drama." color="text-amber-400" />
            <Stat value="15×" label="Market expansion projected between 2024 and 2030." color="text-teal-400" />
            <p className="px-1 font-semibold text-white">Gulel is positioned to ride the steepest part of this curve.</p>
          </div>
        </div>
      </Section>

      {/* 10 · Unit economics */}
      <Section>
        <div className="grid items-center gap-8 rounded-3xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-[#0a0a0f] p-8 md:grid-cols-[auto_1fr] md:p-12">
          <div>
            <p className="text-8xl font-extrabold text-rose-500">10×</p>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Lower cost per minute</p>
          </div>
          <div>
            <Eyebrow>Unit economics</Eyebrow>
            <p className="mb-3 text-2xl font-bold text-white">Asymmetric returns on content</p>
            <p className="text-zinc-300">
              Micro-dramas radically lower overhead — operating at a cost structure 10× cheaper per minute than
              traditional TV, without compromising user retention or engagement. Same retention, fraction of the
              spend.
            </p>
          </div>
        </div>
      </Section>

      {/* 11–12 · Competition */}
      <Section>
        <Eyebrow>Competitive landscape</Eyebrow>
        <Title>Ecosystem plays vs. media majors</Title>
        <p className="mb-8 max-w-3xl text-zinc-300">
          The Indian micro-drama space splits into two distinct plays — and neither has cracked cinematic vertical
          drama.
        </p>
        <div className="mb-12 grid gap-5 md:grid-cols-2">
          {[
            {
              kind: 'Dedicated platforms',
              who: 'Kuku TV · QuickTV',
              points: ['Lead early adoption via audio and social cross-promotion.', 'Face real demographic and content bottlenecks.', 'Limited cinematic, drama-grade storytelling.'],
              gap: 'No cinematic vertical drama',
            },
            {
              kind: 'Media majors',
              who: 'MX Fatafat · ZEE5 Bullet',
              points: ['Massive distribution loops — 280M+ users.', 'Still optimizing core short-form drama strategy.', 'Short-form is a feature, not the franchise.'],
              gap: 'Drama is a feature, not the focus',
            },
          ].map((c) => (
            <Card key={c.kind}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{c.kind}</p>
              <p className="mb-4 text-xl font-bold text-white">{c.who}</p>
              <ul className="mb-5 space-y-2 text-sm text-zinc-300">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-2">
                    <span className="text-zinc-600">•</span>
                    {p}
                  </li>
                ))}
              </ul>
              <p className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm">
                <span className="font-bold text-rose-400">The gap</span>{' '}
                <span className="text-zinc-200">{c.gap}</span>
              </p>
            </Card>
          ))}
        </div>

        <Eyebrow>Why we win</Eyebrow>
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3">
            {[
              ['Zee Bullet', 'Clips only — no drama storytelling'],
              ['MX Fatafat', 'News only — zero entertainment series'],
              ['Kuku FM', 'Audio only — no visual content'],
              ['Pocket FM', 'Audio only — no video storytelling'],
            ].map(([n, d]) => (
              <div key={n} className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
                <span className="font-semibold text-white">{n}</span>
                <span className="text-sm text-zinc-400">{d}</span>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-rose-400">
              The only platform combining
            </p>
            <div className="space-y-3">
              {['Vertical format', 'Cinematic drama', 'Emotional storytelling', 'Regional reach', 'Daily content drops'].map((f) => (
                <p key={f} className="flex items-center gap-3 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-amber-400" /> {f}
                </p>
              ))}
            </div>
          </div>
        </div>
      </Section>

      {/* 13–15 · Opportunity, audience, highlights */}
      <Section>
        <Eyebrow>Market opportunity</Eyebrow>
        <Title>A mobile-first nation, ready now</Title>
        <div className="mb-14 grid gap-5 lg:grid-cols-[300px_1fr]">
          <div className="rounded-2xl bg-gradient-to-br from-amber-500 to-orange-700 p-8">
            <p className="text-6xl font-extrabold text-white">60%</p>
            <p className="mt-3 text-amber-50">of Indians aged 16–40 consume short video every single day.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['877M', 'smartphone users in India'],
              ['4.7 hrs', 'average daily mobile time per Indian'],
              ['80%', 'of mobile video consumed is vertical'],
              ['70%', 'of OTT consumption is drama & regional'],
              ['65%', 'of all new internet users are Tier 2 & 3'],
            ].map(([v, l]) => (
              <div key={l} className="flex items-baseline gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
                <span className="whitespace-nowrap text-2xl font-extrabold text-amber-400">{v}</span>
                <span className="text-sm text-zinc-300">{l}</span>
              </div>
            ))}
          </div>
        </div>

        <Eyebrow>Who we reach</Eyebrow>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          {[
            [Users, 'Age 16–40', 'Mobile-first entertainment consumers'],
            [Smartphone, 'Reels-native', 'Short-video–addicted, regional-content lovers'],
            [IndianRupee, 'Pan-India mass', 'Tier 1, 2 & 3 audiences with regional cultural connect'],
          ].map(([Icon, h, b]) => {
            const I = Icon as typeof Users;
            return (
              <Card key={h as string}>
                <I className="mb-3 h-6 w-6 text-rose-500" />
                <p className="font-bold text-white">{h as string}</p>
                <p className="text-sm text-zinc-400">{b as string}</p>
              </Card>
            );
          })}
        </div>
        <div className="mb-14 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
            Geographic footprint · 15 states · Tier 1 · Tier 2 · Tier 3 city audiences
          </p>
          <div className="flex flex-wrap gap-2">
            {STATES.map((s) => (
              <span key={s} className="rounded-full bg-zinc-800 px-3 py-1.5 text-sm text-zinc-200">
                {s}
              </span>
            ))}
          </div>
        </div>

        <Eyebrow>At a glance</Eyebrow>
        <p className="mb-6 text-2xl font-bold text-white">Highlights of Gulel</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['Mobile-first platform', 'Vertical storytelling for smartphone screens.'],
            ['Family drama core', 'Emotional, relatable Indian stories at the center.'],
            ['Horror & thriller', 'Suspense-driven, binge-worthy series.'],
            ['Comedy', 'Short-format, instantly engaging humor.'],
            ['52-episode seasons', 'Season 1: 52 episodes of 2–3 minutes each.'],
            ['High retention', 'Cliffhanger-based episodic content that hooks.'],
          ].map(([h, b]) => (
            <Card key={h}>
              <p className="mb-1 font-bold text-white">{h}</p>
              <p className="text-sm text-zinc-400">{b}</p>
            </Card>
          ))}
        </div>
      </Section>

      {/* 16–19 · Go to market */}
      <Section>
        <Eyebrow>Go to market</Eyebrow>
        <Title>A 3-month launch playbook</Title>
        <p className="mb-8 max-w-2xl text-zinc-300">
          Pre-launch hype, a high-velocity launch, and retention-led scaling — engineered for the Indian short-video
          ecosystem.
        </p>
        <div className="grid gap-5 lg:grid-cols-3">
          {GTM.map((g, i) => {
            const accent = ['#f43f5e', '#fbbf24', '#2dd4bf'][i];
            const Icon = [Megaphone, Rocket, TrendingUp][i];
            return (
              <Card key={g.phase} accent={accent}>
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: accent }}>
                    {g.phase}
                  </p>
                  <Icon className="h-5 w-5" style={{ color: accent }} />
                </div>
                <p className="text-sm text-zinc-500">{g.month}</p>
                <p className="mb-4 text-xl font-bold text-white">{g.title}</p>
                <ul className="space-y-3">
                  {g.items.map(([h, b]) => (
                    <li key={h}>
                      <p className="text-sm font-semibold text-white">{h}</p>
                      <p className="text-xs text-zinc-400">{b}</p>
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      </Section>

      {/* 20–22 · Monetization */}
      <Section id="model">
        <Eyebrow>Monetization</Eyebrow>
        <Title>The monetization engine</Title>
        <p className="mb-8 max-w-2xl text-zinc-300">
          A coin-led microtransaction model — the proven short-drama playbook, tuned for Bharat&apos;s price
          sensitivity.
        </p>
        <div className="mb-6 grid gap-5 md:grid-cols-3">
          {[
            ['Primary engine', 'Coins', 'Pay-per-episode', 'First 5 episodes free, then ~10 coins (≈₹8–12) unlocks each new episode.', Coins, '#fbbf24'],
            ['VIP all-access', 'Subscription passes', 'Weekly · monthly · yearly', 'Passes unlock the entire catalogue — zero coins needed.', Crown, '#8b5cf6'],
            ['Rewarded ads', 'Earn + ad revenue', 'Watch an ad, earn 5 coins', 'Free users still monetise through ad revenue.', PlayCircle, '#2dd4bf'],
          ].map(([k, t, s, b, Icon, c]) => {
            const I = Icon as typeof Coins;
            return (
              <Card key={k as string} accent={c as string}>
                <I className="mb-3 h-7 w-7" style={{ color: c as string }} />
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{k as string}</p>
                <p className="text-xl font-bold text-white">{t as string}</p>
                <p className="mb-2 text-sm font-semibold" style={{ color: c as string }}>
                  {s as string}
                </p>
                <p className="text-sm text-zinc-400">{b as string}</p>
              </Card>
            );
          })}
        </div>
        <p className="mb-16 text-sm text-zinc-400">
          <span className="font-semibold text-zinc-200">Amplified by</span>{' '}brand collaborations · OTT partnerships ·
          regional &amp; language expansion · social distribution
        </p>

        <Eyebrow>The flywheel</Eyebrow>
        <p className="mb-6 text-2xl font-bold text-white">How the coin economy works</p>
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['01', 'Hook', 'First 5 episodes are free — viewers get hooked fast.', '#f43f5e', PlayCircle],
            ['02', 'Cliffhanger', 'Episode 6+ locks. Unlock the next for ~10 coins.', '#fbbf24', Flame],
            ['03', 'Top up', 'Out of coins? Watch an ad (+5) or buy a coin pack.', '#2dd4bf', Coins],
            ['04', 'Convert', 'Heavy bingers upgrade to VIP all-access.', '#8b5cf6', Crown],
          ].map(([n, h, b, c, Icon]) => {
            const I = Icon as typeof Coins;
            return (
              <Card key={n as string} accent={c as string}>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-4xl font-extrabold" style={{ color: c as string }}>
                    {n as string}
                  </span>
                  <I className="h-6 w-6" style={{ color: c as string }} />
                </div>
                <p className="mb-1 font-bold uppercase tracking-wider text-white">{h as string}</p>
                <p className="text-sm text-zinc-400">{b as string}</p>
              </Card>
            );
          })}
        </div>
        <div className="mb-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat value="5" label="free episodes" />
          <Stat value="10" label="coins / unlock" color="text-amber-400" />
          <Stat value="+5" label="coins / ad watched" color="text-teal-400" />
          <Stat value="₹8–12" label="effective per episode" color="text-violet-400" />
        </div>

        <Eyebrow>Pricing</Eyebrow>
        <p className="mb-2 text-2xl font-bold text-white">Coin packs for every wallet</p>
        <p className="mb-6 text-zinc-400">
          Dual-currency, mass-market entry at ₹149 — better per-coin value as packs scale up.
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PACKS.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-2xl border p-6 ${
                p.tag === 'Most popular' ? 'border-rose-500 bg-rose-500/5' : 'border-zinc-800 bg-zinc-900/70'
              }`}
            >
              {p.tag && (
                <span className="absolute -top-3 left-6 rounded-full bg-rose-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  {p.tag}
                </span>
              )}
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">{p.name}</p>
              <p className="mt-2 text-3xl font-extrabold text-white">
                {p.coins} <span className="text-base font-semibold text-amber-400">coins</span>
              </p>
              <p className="mt-2 text-xl font-bold text-white">
                {p.inr} <span className="text-sm font-normal text-zinc-500">{p.usd}</span>
              </p>
              <p className="mt-3 text-sm text-zinc-400">{p.per}</p>
              <p className="text-sm text-zinc-400">{p.eps}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-zinc-500">
          10 coins unlocks one episode · Pay with Stripe or Razorpay · ₹ and $ supported
        </p>
      </Section>

      {/* 23 · Cost structure */}
      <Section>
        <Eyebrow>Cost structure</Eyebrow>
        <Title>AI-native production economics</Title>
        <p className="mb-8 max-w-3xl text-zinc-300">
          Our Seedance · Kling · Nano Banana · ElevenLabs pipeline produces a 90-second cinematic episode for the
          price of a coffee.
        </p>
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <Stat value="$6–9" label="≈ ₹500–750 per 90-second episode" color="text-teal-400" />
          <Stat value="$350–470" label="≈ ₹30–40k per 52-episode season" color="text-amber-400" />
          <Stat value="10×+" label="cheaper per finished minute vs traditional TV" />
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">
              Per-episode pipeline cost
            </p>
            <div className="divide-y divide-zinc-800">
              {[
                ['Kling 2.5 animation', '~$0.35 / 5s shot'],
                ['Nano Banana stills', '~$0.04 each'],
                ['ElevenLabs voice', '~$0.04 / line'],
                ['Sync lip-sync', '~$0.50 / shot'],
              ].map(([a, b]) => (
                <div key={a} className="flex justify-between py-3 text-sm">
                  <span className="flex items-center gap-2 text-zinc-200">
                    <Clapperboard className="h-4 w-4 text-zinc-500" /> {a}
                  </span>
                  <span className="font-semibold text-white">{b}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-400">The cost advantage</p>
            <div className="space-y-5">
              <div>
                <p className="text-3xl font-extrabold text-zinc-500 line-through decoration-rose-500/70">₹10–25 lakh</p>
                <p className="text-sm text-zinc-400">per traditional TV episode</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-teal-400">&lt; ₹40,000</p>
                <p className="text-sm text-zinc-400">for a full 52-episode Gulel season</p>
              </div>
            </div>
            <p className="mt-6 text-xs text-zinc-500">AI generation cost; excludes script, licensing &amp; overhead.</p>
          </Card>
        </div>
      </Section>

      {/* 24–25 · Capital plan + path to profit */}
      <Section id="ask">
        <Eyebrow>Capital plan</Eyebrow>
        <Title>Budget &amp; spending</Title>
        <p className="mb-8 max-w-3xl text-zinc-300">
          Front-loaded into content and market entry, then optimized aggressively as the library compounds (₹ Crore).
        </p>
        <div className="mb-16 grid gap-5 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
            <div className="mb-4 flex gap-5 text-xs text-zinc-400">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-rose-500" /> Content creation
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-sm bg-amber-400" /> Marketing spend
              </span>
            </div>
            <div className="flex h-64 items-end gap-6" role="img" aria-label="Annual spend by category, crore rupees">
              {CAPITAL.map((c) => (
                <div key={c.year} className="flex h-full flex-1 flex-col items-center justify-end">
                  <span className="mb-1 text-sm font-bold text-white">₹{c.total} Cr</span>
                  <div className="flex w-full flex-col overflow-hidden rounded-t-md" style={{ height: `${(c.total / 40) * 85}%` }}>
                    <div className="flex items-center justify-center bg-amber-400 text-xs font-bold text-black" style={{ flex: c.marketing }}>
                      {c.marketing}
                    </div>
                    <div className="flex items-center justify-center bg-rose-500 text-xs font-bold text-white" style={{ flex: c.content }}>
                      {c.content}
                    </div>
                  </div>
                  <span className="mt-2 text-xs text-zinc-500">{c.year}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            {CAPITAL.map((c) => (
              <div key={c.year} className="rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{c.year}</p>
                <p className="text-2xl font-extrabold text-white">₹{c.total} Cr</p>
                <p className="text-sm text-zinc-400">{c.note}</p>
              </div>
            ))}
          </div>
        </div>

        <Eyebrow>The path to profit</Eyebrow>
        <p className="mb-6 text-2xl font-bold text-white">Revenue roadmap &amp; cost-recovery timeline</p>
        <div className="mb-12 grid gap-5 lg:grid-cols-3">
          {RECOVERY.map((r, i) => (
            <Card key={r.year} accent={['#f43f5e', '#fbbf24', '#2dd4bf'][i]}>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{r.year}</p>
              <p className="mb-3 text-lg font-bold text-white">{r.title}</p>
              <div className="mb-1 h-3 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${Math.min(r.pct, 100)}%`, background: ['#f43f5e', '#fbbf24', '#2dd4bf'][i] }}
                />
              </div>
              <p className="mb-3 text-sm font-bold" style={{ color: ['#f43f5e', '#fbbf24', '#2dd4bf'][i] }}>
                {r.pct}% projected cost recovery
              </p>
              <p className="text-sm text-zinc-400">{r.body}</p>
            </Card>
          ))}
        </div>

        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-rose-600 via-rose-700 to-[#3b0a17] p-10 text-center md:p-16">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">The ask</p>
          <p className="mt-3 text-5xl font-extrabold text-white md:text-7xl">₹40 Cr</p>
          <p className="mt-1 text-xl text-rose-100">(~$5M) · Series A</p>
          <p className="mx-auto mt-5 max-w-xl text-rose-50">
            To fund the Year-1 content slate and launch — the steepest, highest-leverage point on the curve.
          </p>
        </div>
      </Section>

      {/* 26 · Close */}
      <section className="border-t border-zinc-800">
        <div className="mx-auto max-w-4xl px-5 py-20 text-center">
          <p className="text-3xl font-bold text-white md:text-4xl">
            Let&apos;s build India&apos;s vertical entertainment revolution — <span className="text-rose-500">together.</span>
          </p>
          <p className="mt-4 text-zinc-400">Raising ₹40 Cr (~$5M) · Series A</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:hello@thegulel.com?subject=Gulel%20Series%20A"
              className="inline-flex items-center gap-2 rounded-full bg-rose-500 px-6 py-3 font-semibold text-white hover:bg-rose-600"
            >
              Talk to the founders <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="/investors/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-emerald-500/60 px-6 py-3 font-semibold text-emerald-300 hover:border-emerald-300 hover:text-white"
            >
              <TrendingUp className="h-4 w-4" /> Review live metrics
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-600 px-6 py-3 font-semibold text-white hover:border-white"
            >
              Explore the app
            </Link>
          </div>
          <p className="mt-12 text-xs uppercase tracking-[0.3em] text-zinc-600">
            H&amp;S · Powered by Vidya Entertainment · Thank you
          </p>
        </div>
      </section>
    </div>
  );
}
