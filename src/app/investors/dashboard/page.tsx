import type { Metadata } from 'next';
import Link from 'next/link';
import { cookies } from 'next/headers';
import {
  ArrowLeft,
  Clapperboard,
  Coins,
  Crown,
  Eye,
  Lock,
  LogOut,
  Megaphone,
  PlayCircle,
  Timer,
  TrendingUp,
  Users,
} from 'lucide-react';
import prisma from '@/lib/prisma';
import { episodeThumbnailPath, resolvePlayableUrl } from '@/lib/cloudflare';
import {
  BRAND_SHOWCASE_SERIES_ID,
  INVESTOR_COOKIE,
  checkInvestorCookie,
  getInvestorMetrics,
  investorDashboardEnabled,
  type DailyPoint,
  type InvestorMetrics,
} from '@/lib/investor-metrics';
import ShowcasePlayer from './ShowcasePlayer';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Investor dashboard',
  description: 'Live Gulel platform metrics — viewership, engagement and revenue by series.',
  robots: { index: false, follow: false },
};

/* Production cost per 90s Hindi episode, from Production Budget v3 (FX ₹95.98/$). */
const COST_PER_EPISODE = [
  { label: 'Seedance 2.5 on Higgsfield Ultra credits', inr: 3380 },
  { label: 'Seedance 2.5 Unlimited pass + ElevenLabs Hindi voice', inr: 709 },
];

/* ── Formatting ─────────────────────────────────────────────────────── */

const n = (v: number) => v.toLocaleString('en-IN');
const inr = (v: number) => `₹${Math.round(v).toLocaleString('en-IN')}`;
const pct = (v: number | null) => (v == null ? '—' : `${(v * 100).toFixed(v < 0.1 ? 1 : 0)}%`);
const hours = (v: number) => (v >= 10 ? n(Math.round(v)) : v.toFixed(1));

/* ── Building blocks ────────────────────────────────────────────────── */

function Kpi({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof Users;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-zinc-400">
        <Icon className="h-4 w-4 text-rose-400" />
        {label}
      </div>
      <p className="text-2xl font-extrabold text-white md:text-3xl">{value}</p>
      {sub && <p className="mt-1 text-xs text-zinc-500">{sub}</p>}
    </div>
  );
}

function Panel({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5">
      <h2 className="text-lg font-bold text-white">{title}</h2>
      {note && <p className="mt-0.5 text-xs text-zinc-500">{note}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function Bars({ data, pick, color }: { data: DailyPoint[]; pick: (d: DailyPoint) => number; color: string }) {
  const values = data.map(pick);
  const max = Math.max(1, ...values);
  const total = values.reduce((s, v) => s + v, 0);
  const w = 300;
  const h = 70;
  const bw = w / values.length;
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full" preserveAspectRatio="none" role="img">
        {values.map((v, i) => {
          const bh = v === 0 ? 1 : Math.max(2, (v / max) * (h - 4));
          return (
            <rect key={i} x={i * bw + 1} y={h - bh} width={bw - 2} height={bh} rx={1.5} fill={v === 0 ? '#27272a' : color}>
              <title>{`${data[i].day}: ${v}`}</title>
            </rect>
          );
        })}
      </svg>
      <div className="mt-1 flex justify-between text-[10px] text-zinc-500">
        <span>{data[0]?.day.slice(5)}</span>
        <span>30-day total {n(total)}</span>
        <span>{data[data.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(1, steps[0]?.value ?? 1);
  return (
    <div className="space-y-2.5">
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : null;
        return (
          <div key={s.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-zinc-300">{s.label}</span>
              <span className="text-zinc-400">
                {n(s.value)}
                {prev != null && prev > 0 && <span className="ml-2 text-zinc-500">({pct(s.value / prev)} of prev)</span>}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-zinc-800">
              <div
                className="h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-amber-400"
                style={{ width: `${Math.max(s.value > 0 ? 2 : 0, (s.value / top) * 100)}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Gate ───────────────────────────────────────────────────────────── */

function Gate({ error, disabled }: { error: boolean; disabled: boolean }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-5 text-zinc-100">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 text-center">
        <Lock className="mx-auto mb-3 h-8 w-8 text-rose-400" />
        <h1 className="text-xl font-bold text-white">Investor dashboard</h1>
        {disabled ? (
          <p className="mt-2 text-sm text-zinc-400">The dashboard is not enabled yet. Contact hello@thegulel.com.</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-zinc-400">Live platform metrics. Enter the password to continue.</p>
            <form action="/api/investors/access" method="post" className="mt-5 space-y-3">
              <input
                name="code"
                type="password"
                autoComplete="off"
                required
                placeholder="Password"
                className="w-full rounded-xl border border-zinc-700 bg-black px-4 py-3 text-white outline-none focus:border-rose-500"
              />
              {error && <p className="text-sm text-rose-400">Wrong password — please try again.</p>}
              <button className="w-full rounded-xl bg-rose-500 py-3 font-semibold text-white hover:bg-rose-600">
                View dashboard
              </button>
            </form>
          </>
        )}
        <Link href="/investors" className="mt-5 inline-block text-sm text-zinc-400 hover:text-white">
          ← Back to the investor overview
        </Link>
      </div>
    </div>
  );
}

/* ── Brand showcase ─────────────────────────────────────────────────── */

async function getShowcase() {
  try {
    const eps = await prisma.episode.findMany({
      where: { seriesId: BRAND_SHOWCASE_SERIES_ID },
      orderBy: { episodeNumber: 'asc' },
    });
    const out = await Promise.all(
      eps.map(async (e) => ({
        id: e.id,
        title: e.title,
        duration: e.duration,
        src: await resolvePlayableUrl(e),
        poster: episodeThumbnailPath(e.id),
      }))
    );
    return out.filter((e): e is typeof e & { src: string } => !!e.src);
  } catch {
    return [];
  }
}

/* ── Page ───────────────────────────────────────────────────────────── */

export default async function InvestorDashboard({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const { e } = await searchParams;
  if (!investorDashboardEnabled()) return <Gate error={false} disabled />;
  const jar = await cookies();
  if (!checkInvestorCookie(jar.get(INVESTOR_COOKIE)?.value)) return <Gate error={e === '1'} disabled={false} />;

  let m: InvestorMetrics;
  try {
    m = await getInvestorMetrics();
  } catch (err) {
    console.error('[investor-dashboard] metrics failed:', err);
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f] px-5 text-center text-zinc-300">
        Metrics are temporarily unavailable. Please refresh in a minute.
      </div>
    );
  }
  const showcase = await getShowcase();
  const mo = m.monetisation;
  const pilotViewers = m.series.reduce((s, x) => s + x.pilotViewers, 0);
  const continued = m.series.reduce((s, x) => s + x.continuedViewers, 0);
  const buyers = m.series.reduce((s, x) => s + x.buyers, 0);
  const avgCoinPrice =
    m.series.length > 0 ? m.series.reduce((s, x) => s + x.coinPrice, 0) / m.series.length : 10;
  const revenuePerUnlock = mo.inrPerCoin != null ? avgCoinPrice * mo.inrPerCoin : null;
  const updated = new Date(m.generatedAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="min-h-screen bg-[#0a0a0f] pb-20 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-[#0a0a0f]/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/investors" className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> Investor overview
          </Link>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" /> Live data
            </span>
            <form action="/api/investors/access" method="post">
              <input type="hidden" name="action" value="logout" />
              <button className="text-zinc-500 hover:text-white" aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-5 pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Gulel · Platform metrics</p>
          <h1 className="mt-2 text-3xl font-bold text-white md:text-4xl">How each series performs</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Every figure below is read live from the production database at {updated} IST. Nothing is projected or
            seeded. Rupee revenue is derived from coin purchases at coin-pack prices, as noted.
          </p>
        </div>

        {/* Headline KPIs */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <Kpi icon={Users} label="Registered users" value={n(m.users.total)} sub={`+${n(m.users.new30d)} in 30 days · +${n(m.users.new7d)} in 7`} />
          <Kpi icon={Eye} label="Monthly viewers" value={n(m.viewers.mau)} sub={`WAU ${n(m.viewers.wau)} · DAU ${n(m.viewers.dau)}`} />
          <Kpi icon={PlayCircle} label="Episode starts" value={n(m.engagement.starts)} sub={`${pct(m.engagement.completionRate)} watched to the end`} />
          <Kpi icon={Timer} label="Watch hours" value={hours(m.engagement.watchHours)} sub={`${m.engagement.episodesPerViewer?.toFixed(1) ?? '—'} episodes per viewer`} />
          <Kpi icon={TrendingUp} label="Pilot → episode 2" value={pct(m.engagement.pilotContinuation)} sub="Pilot viewers who kept watching" />
          <Kpi icon={Coins} label="Coin revenue" value={inr(mo.revenueINR)} sub={`${inr(mo.revenueINR30d)} in 30 days · ${n(mo.coinPurchases)} purchases`} />
          <Kpi icon={Crown} label="VIP MRR" value={inr(mo.vipMrrINR)} sub={`${n(mo.vipActive)} active subscribers`} />
          <Kpi icon={Users} label="Paying users" value={n(mo.payingUsers)} sub={`${pct(mo.conversion)} of registered · ARPPU ${mo.arppuINR != null ? inr(mo.arppuINR) : '—'}`} />
        </div>

        {/* Trends */}
        <div className="grid gap-4 md:grid-cols-3">
          <Panel title="New sign-ups" note="Per day, last 30 days">
            <Bars data={m.daily} pick={(d) => d.signups} color="#f43f5e" />
          </Panel>
          <Panel title="Episode starts" note="First plays of an episode per day">
            <Bars data={m.daily} pick={(d) => d.starts} color="#f59e0b" />
          </Panel>
          <Panel title="Active viewers" note="Distinct viewers by day of latest activity">
            <Bars data={m.daily} pick={(d) => d.activeViewers} color="#10b981" />
          </Panel>
          <Panel title="Episodes unlocked" note="Paid unlocks per day">
            <Bars data={m.daily} pick={(d) => d.unlocks} color="#a855f7" />
          </Panel>
          <Panel title="Coins purchased" note="Coins bought per day">
            <Bars data={m.daily} pick={(d) => d.coinsBought} color="#eab308" />
          </Panel>
          <Panel title="Rewarded ad views" note="Completed ads that earned coins">
            <Bars data={m.daily} pick={(d) => d.adViews} color="#38bdf8" />
          </Panel>
        </div>

        {/* Funnel + monetisation mix */}
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Viewer → payer funnel" note="Across all published series">
            <Funnel
              steps={[
                { label: 'Watched a free pilot', value: pilotViewers },
                { label: 'Continued to episode 2+', value: continued },
                { label: 'Unlocked a paid episode', value: buyers },
              ]}
            />
          </Panel>
          <Panel title="Monetisation mix" note="Three revenue lines: coins, VIP subscriptions and rewarded ads">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <dt className="text-zinc-400">Coins purchased</dt>
              <dd className="text-right font-semibold text-white">{n(mo.coinsPurchased)}</dd>
              <dt className="text-zinc-400">Coins spent on unlocks</dt>
              <dd className="text-right font-semibold text-white">{n(mo.coinsSpent)} · {n(mo.unlocks)} unlocks</dd>
              <dt className="text-zinc-400">Blended price per coin</dt>
              <dd className="text-right font-semibold text-white">{mo.inrPerCoin != null ? `₹${mo.inrPerCoin.toFixed(2)}` : '—'}</dd>
              <dt className="text-zinc-400">VIP by plan</dt>
              <dd className="text-right font-semibold text-white">
                {n(mo.vipByPlan.WEEKLY ?? 0)} wk · {n(mo.vipByPlan.MONTHLY ?? 0)} mo · {n(mo.vipByPlan.YEARLY ?? 0)} yr
              </dd>
              <dt className="text-zinc-400">Rewarded ad views</dt>
              <dd className="text-right font-semibold text-white">{n(mo.adViews)} · {n(mo.adViews30d)} in 30d</dd>
              <dt className="text-zinc-400">Coins granted by ads</dt>
              <dd className="text-right font-semibold text-white">{n(mo.adCoins)}</dd>
            </dl>
            <p className="mt-4 text-xs text-zinc-500">
              Ad views are currently served from Google&apos;s test inventory, so they earn no ad revenue yet. Live
              AdMob inventory switches on with the production ad unit.
            </p>
          </Panel>
        </div>

        {/* Per-series table */}
        <Panel title="Series leaderboard" note="Viewership, retention and revenue per published series">
          <div className="-mx-5 overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-zinc-800 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-2 font-medium">Series</th>
                  <th className="px-3 py-2 text-right font-medium">Eps</th>
                  <th className="px-3 py-2 text-right font-medium">Viewers</th>
                  <th className="px-3 py-2 text-right font-medium">Starts</th>
                  <th className="px-3 py-2 text-right font-medium">Completion</th>
                  <th className="px-3 py-2 text-right font-medium">Watch h</th>
                  <th className="px-3 py-2 text-right font-medium">Pilot → Ep2</th>
                  <th className="px-3 py-2 text-right font-medium" title="Notify-me opt-ins for the next episode, and their share of viewers who reached episode 2+">
                    Notify me
                  </th>
                  <th className="px-3 py-2 text-right font-medium">Unlocks</th>
                  <th className="px-3 py-2 text-right font-medium">Coins</th>
                  <th className="px-5 py-2 text-right font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {m.series.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-800/30">
                    <td className="px-5 py-2.5">
                      <Link href={`/series/${s.id}`} className="font-semibold text-white hover:text-rose-400">
                        {s.title}
                      </Link>
                      <span className="ml-2 text-xs text-zinc-500">{s.genre}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{s.episodes}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{n(s.viewers)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{n(s.starts)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{pct(s.completionRate)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{hours(s.watchHours)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{s.episodes > 1 ? pct(s.continuation) : '—'}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">
                      {n(s.notifyOptIns)}
                      {s.notifyRate != null && <span className="ml-1 text-xs text-zinc-500">{pct(s.notifyRate)}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{n(s.unlocks)}</td>
                    <td className="px-3 py-2.5 text-right text-zinc-300">{n(s.coinsSpent)}</td>
                    <td className="px-5 py-2.5 text-right font-semibold text-white">{inr(s.revenueINR)}</td>
                  </tr>
                ))}
                {m.series.length === 0 && (
                  <tr>
                    <td colSpan={11} className="px-5 py-6 text-center text-zinc-500">
                      No published series with episodes yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-zinc-500">
            Series revenue = coins spent unlocking that series × blended coin price. Completion = episode plays watched
            to the end. Pilot → Ep2 = share of a series&apos; pilot viewers who went on to watch episode 2 or later.
          </p>
        </Panel>

        {/* Unit economics */}
        <Panel
          title="Unit economics per episode"
          note="Model inputs from the Gulel Production Budget v3 (Hindi) combined with live coin pricing"
        >
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-zinc-800 bg-black/30 p-4">
              <p className="text-xs uppercase tracking-wider text-zinc-500">Revenue per paid unlock</p>
              <p className="mt-1 text-2xl font-bold text-white">
                {revenuePerUnlock != null ? `₹${revenuePerUnlock.toFixed(2)}` : '—'}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{avgCoinPrice.toFixed(0)} coins per episode × blended coin price</p>
            </div>
            {COST_PER_EPISODE.map((c) => (
              <div key={c.label} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <p className="text-xs uppercase tracking-wider text-zinc-500">Break-even unlocks · {inr(c.inr)} / episode</p>
                <p className="mt-1 text-2xl font-bold text-white">
                  {revenuePerUnlock ? n(Math.ceil(c.inr / revenuePerUnlock)) : '—'}
                </p>
                <p className="mt-1 text-xs text-zinc-500">{c.label}</p>
              </div>
            ))}
          </div>
        </Panel>

        {/* Catalog */}
        <div className="grid grid-cols-3 gap-3">
          <Kpi icon={Clapperboard} label="Live series" value={n(m.catalog.series)} />
          <Kpi icon={PlayCircle} label="Episodes" value={n(m.catalog.episodes)} />
          <Kpi icon={Timer} label="Runtime" value={`${n(Math.round(m.catalog.runtimeMinutes))} min`} />
        </div>

        {/* Brand integrations */}
        <Panel
          title="Brand integration showcase"
          note="How in-story product placement looks in a 90-second vertical episode"
        >
          <p className="mb-4 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-200">
            Spec — not affiliated with the brands. Produced by Gulel as pitch samples only; not published in the
            catalog or promoted to viewers.
          </p>
          {showcase.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {showcase.map((ep) => (
                <div key={ep.id}>
                  <ShowcasePlayer src={ep.src} poster={ep.poster} label={ep.title} />
                  <p className="mt-2 text-sm font-semibold text-white">{ep.title}</p>
                  <p className="text-xs text-zinc-500">{Math.round(ep.duration)}s · spec</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-zinc-500">Showcase episodes are rendering and will appear here shortly.</p>
          )}
          <div className="mt-4 flex items-start gap-2 text-xs text-zinc-500">
            <Megaphone className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
            <p>
              Integrations are written into the story as props and settings, not interruptions: the product is on
              screen in every shot of the scene and at the emotional beat, with no pre-roll to skip.
            </p>
          </div>
        </Panel>

        <p className="pt-2 text-center text-xs text-zinc-600">
          Confidential — for prospective investors only. Metrics refresh on every page load.
        </p>
      </main>
    </div>
  );
}
