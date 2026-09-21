import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CF_API = 'https://api.cloudflare.com/client/v4';

// Only these hosts may be given to Cloudflare as an ingest source. They are
// the CDNs of the generation services we actually use, so a leaked token
// can't be used to pull arbitrary content into the library.
const INGEST_HOST_ALLOWLIST = [
  /(^|\.)higgsfield\.ai$/,
  /(^|\.)openart\.ai$/,
  /(^|\.)flora\.ai$/,
  /(^|\.)cloudflarestream\.com$/,
  /(^|\.)videodelivery\.net$/,
  /(^|\.)fal\.media$/,
  /(^|\.)fal\.ai$/,
];

function tokenOk(request: NextRequest, url: URL): boolean {
  const expected = process.env.OPS_TOKEN;
  if (!expected) return false; // unset -> endpoint disabled
  const got =
    url.searchParams.get('token') ??
    request.headers.get('authorization')?.replace(/^Bearer /, '') ??
    '';
  const a = Buffer.from(got);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * GET /api/admin/ops — operator maintenance, callable without a browser
 * session (the admin UI needs one; remote operators don't). Every action is a
 * FIXED, idempotent operation — no caller-supplied SQL, commands, or code.
 *
 * Gated by OPS_TOKEN (unset = endpoint disabled, all requests 401).
 *
 * Actions:
 *  - dbcheck        read-only: has the billing/ads migration been applied?
 *  - migrate        apply the additive billing/ads migration (IF NOT EXISTS)
 *  - cleanup-demo   delete the hidden duplicate "demo-series" catalog entry
 *  - ingest         have Cloudflare Stream copy a video from an allowlisted
 *                   host and upsert it as an episode: &seriesId=&url=&title=&num=&duration=
 *  - ingest-status  report Cloudflare processing state for &uid=
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  if (!tokenOk(request, url)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const action = url.searchParams.get('action');

  try {
    switch (action) {
      case 'dbcheck': {
        const checks: Record<string, boolean> = {};
        try {
          await prisma.$queryRaw`SELECT "providerRef" FROM "CoinTransaction" LIMIT 1`;
          checks.coinTransaction_providerRef = true;
        } catch {
          checks.coinTransaction_providerRef = false;
        }
        try {
          await prisma.$queryRaw`SELECT "providerCustomerId" FROM "Subscription" LIMIT 1`;
          checks.subscription_providerCustomerId = true;
        } catch {
          checks.subscription_providerCustomerId = false;
        }
        try {
          await prisma.$queryRaw`SELECT "userId" FROM "AdCooldown" LIMIT 1`;
          checks.adCooldown_table = true;
        } catch {
          checks.adCooldown_table = false;
        }
        return NextResponse.json({
          ok: Object.values(checks).every(Boolean),
          checks,
        });
      }

      case 'migrate': {
        // The one pending migration, as fixed additive statements. Nothing
        // here is caller-controlled; IF NOT EXISTS makes re-runs no-ops.
        await prisma.$executeRaw`ALTER TABLE "CoinTransaction" ADD COLUMN IF NOT EXISTS "providerRef" TEXT`;
        await prisma.$executeRaw`CREATE UNIQUE INDEX IF NOT EXISTS "CoinTransaction_providerRef_key" ON "CoinTransaction"("providerRef")`;
        await prisma.$executeRaw`ALTER TABLE "Subscription" ADD COLUMN IF NOT EXISTS "providerCustomerId" TEXT`;
        await prisma.$executeRaw`CREATE TABLE IF NOT EXISTS "AdCooldown" ("userId" TEXT PRIMARY KEY, "lastAdAt" TIMESTAMP(3) NOT NULL)`;
        return NextResponse.json({ ok: true, applied: 4 });
      }

      case 'ssv-keys': {
        // Read-only self-test for the rewarded-ads SSV pipeline: confirm this
        // deployment can reach Google's public reward verifier keys, which
        // signature verification in /api/ads/ssv depends on.
        const res = await fetch(
          'https://www.gstatic.com/admob/reward/verifier-keys.json',
          { cache: 'no-store' }
        );
        if (!res.ok) {
          return NextResponse.json(
            { ok: false, status: res.status },
            { status: 502 }
          );
        }
        const data = (await res.json()) as { keys?: Array<{ keyId: number }> };
        return NextResponse.json({
          ok: (data.keys?.length ?? 0) > 0,
          keyCount: data.keys?.length ?? 0,
          keyIds: (data.keys ?? []).map((k) => k.keyId),
        });
      }

      case 'cleanup-demo': {
        const deleted = await prisma.series.deleteMany({
          where: { id: 'demo-series' },
        });
        return NextResponse.json({ ok: true, deletedSeries: deleted.count });
      }

      case 'cleanup-fake-episodes': {
        // Seeded placeholder episodes carry made-up video IDs; real Cloudflare
        // Stream UIDs are exactly 32 hex chars. Deleting the fakes removes
        // every dead play button the deep audit flagged.
        const deleted = await prisma.$executeRaw`DELETE FROM "Episode" WHERE "videoId" !~ '^[0-9a-f]{32}$'`;
        return NextResponse.json({ ok: true, deletedEpisodes: deleted });
      }

      case 'fix-counts': {
        // Make every series' advertised totalEpisodes match its actual rows,
        // so the catalog stops promising episodes that don't exist.
        const updated = await prisma.$executeRaw`UPDATE "Series" s SET "totalEpisodes" = (SELECT COUNT(*) FROM "Episode" e WHERE e."seriesId" = s."id")`;
        return NextResponse.json({ ok: true, updatedSeries: updated });
      }

      case 'ingest': {
        const seriesId = url.searchParams.get('seriesId');
        const sourceUrl = url.searchParams.get('url');
        const title = url.searchParams.get('title') ?? 'Episode 1';
        const num = Number(url.searchParams.get('num') ?? '1');
        const duration = Number(url.searchParams.get('duration') ?? '15');
        if (!seriesId || !sourceUrl) {
          return NextResponse.json(
            { error: 'seriesId and url are required' },
            { status: 400 }
          );
        }
        let sourceHost: string;
        try {
          const parsed = new URL(sourceUrl);
          if (parsed.protocol !== 'https:') throw new Error('not https');
          sourceHost = parsed.hostname;
        } catch {
          return NextResponse.json({ error: 'invalid url' }, { status: 400 });
        }
        if (!INGEST_HOST_ALLOWLIST.some((re) => re.test(sourceHost))) {
          return NextResponse.json(
            { error: 'source host not allowlisted' },
            { status: 400 }
          );
        }
        const series = await prisma.series.findUnique({ where: { id: seriesId } });
        if (!series) {
          return NextResponse.json({ error: 'unknown series' }, { status: 404 });
        }

        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const cfToken = process.env.CLOUDFLARE_API_TOKEN;
        const subdomain = process.env.NEXT_PUBLIC_CLOUDFLARE_CUSTOMER_SUBDOMAIN;
        if (!accountId || !cfToken || !subdomain) {
          return NextResponse.json(
            { error: 'Cloudflare not configured' },
            { status: 500 }
          );
        }

        // Server-side copy: Cloudflare pulls the source itself, so the video
        // never passes through this function.
        const cfRes = await fetch(`${CF_API}/accounts/${accountId}/stream/copy`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${cfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: sourceUrl,
            meta: { name: `${series.title} — ${title}` },
            requireSignedURLs: false,
          }),
        });
        if (!cfRes.ok) {
          const detail = await cfRes.text();
          return NextResponse.json(
            { error: 'Cloudflare copy failed', detail },
            { status: 502 }
          );
        }
        const cfData = await cfRes.json();
        const uid: string = cfData.result.uid;

        const episode = await prisma.episode.upsert({
          where: { seriesId_episodeNumber: { seriesId, episodeNumber: num } },
          update: {
            title,
            videoId: uid,
            videoUrl: `https://${subdomain}/${uid}/manifest/video.m3u8`,
            thumbnail: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
            duration,
            isFree: true,
          },
          create: {
            seriesId,
            episodeNumber: num,
            title,
            videoId: uid,
            videoUrl: `https://${subdomain}/${uid}/manifest/video.m3u8`,
            thumbnail: `https://videodelivery.net/${uid}/thumbnails/thumbnail.jpg`,
            duration,
            isFree: true,
          },
        });
        return NextResponse.json({ ok: true, uid, episodeId: episode.id });
      }

      case 'ingest-status': {
        const uid = url.searchParams.get('uid');
        if (!uid || !/^[a-f0-9]{32}$/.test(uid)) {
          return NextResponse.json({ error: 'valid uid required' }, { status: 400 });
        }
        const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
        const cfToken = process.env.CLOUDFLARE_API_TOKEN;
        const res = await fetch(`${CF_API}/accounts/${accountId}/stream/${uid}`, {
          headers: { Authorization: `Bearer ${cfToken}` },
        });
        const data = await res.json();
        const r = data.result ?? {};
        return NextResponse.json({
          ok: !!r.readyToStream,
          state: r.status?.state,
          pctComplete: r.status?.pctComplete,
          duration: r.duration,
        });
      }

      default:
        return NextResponse.json({ error: 'unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('[ops] failed:', err);
    return NextResponse.json(
      { error: 'ops action failed', detail: String(err) },
      { status: 500 }
    );
  }
}
