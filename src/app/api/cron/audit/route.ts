import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { resolveVideoUrl } from '@/lib/cloudflare';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type Severity = 'error' | 'warn';
interface Issue {
  severity: Severity;
  type: string;
  entity: string;
  detail: string;
}

function isHls(url: string | null): boolean {
  return !!url && /\.m3u8(\?|$)/.test(url);
}

/**
 * GET /api/cron/audit
 *
 * Site health audit, run on a schedule (see vercel.json) so content problems
 * are caught before users — or investors — hit them. Checks:
 *  - PUBLISHED series with zero real episodes (catalog shells)
 *  - series whose totalEpisodes count doesn't match actual episode rows
 *  - duplicate series titles
 *  - episodes with no resolvable video, or a non-HLS source the player can't play
 *
 * Secured with CRON_SECRET (Vercel Cron sends it as a Bearer token). When
 * AUDIT_WEBHOOK_URL is set, a summary is POSTed there on failure (Slack/Discord).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const issues: Issue[] = [];

  // ── Series integrity ────────────────────────────────────────────────────────
  const series = await prisma.series.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      id: true,
      title: true,
      totalEpisodes: true,
      _count: { select: { episodes: true } },
    },
  });

  for (const s of series) {
    const actual = s._count.episodes;
    if (actual === 0) {
      // A poster-only series that advertises 0 episodes is an intentional
      // "coming soon" placeholder — worth listing, but not a failure. One
      // that advertises episodes it doesn't have is lying to users.
      issues.push({
        severity: s.totalEpisodes > 0 ? 'error' : 'warn',
        type: s.totalEpisodes > 0 ? 'series_no_episodes' : 'series_coming_soon',
        entity: `${s.title} (${s.id})`,
        detail: `Published series has 0 episodes but advertises ${s.totalEpisodes}.`,
      });
    } else if (s.totalEpisodes !== actual) {
      issues.push({
        severity: 'warn',
        type: 'episode_count_mismatch',
        entity: `${s.title} (${s.id})`,
        detail: `Lists ${s.totalEpisodes} episodes but has ${actual} rows.`,
      });
    }
  }

  // Duplicate titles
  const byTitle = new Map<string, string[]>();
  for (const s of series) {
    byTitle.set(s.title, [...(byTitle.get(s.title) ?? []), s.id]);
  }
  for (const [title, ids] of byTitle) {
    if (ids.length > 1) {
      issues.push({
        severity: 'warn',
        type: 'duplicate_series_title',
        entity: title,
        detail: `${ids.length} series share this title: ${ids.join(', ')}`,
      });
    }
  }

  // ── Episode playability ─────────────────────────────────────────────────────
  const episodes = await prisma.episode.findMany({
    select: {
      id: true,
      title: true,
      isFree: true,
      videoUrl: true,
      videoId: true,
    },
  });

  for (const e of episodes) {
    const url = resolveVideoUrl(e);
    if (!url) {
      issues.push({
        severity: 'error',
        type: 'episode_no_video',
        entity: `${e.title} (${e.id})`,
        detail: 'No resolvable video URL.',
      });
    } else if (!isHls(url)) {
      issues.push({
        severity: 'error',
        type: 'episode_not_hls',
        entity: `${e.title} (${e.id})`,
        detail: `Source is not HLS, the player cannot play it: ${url}`,
      });
    }
  }

  // ── Deep link check (?deep=1) ───────────────────────────────────────────────
  // Actually fetch every episode's HLS manifest and every series thumbnail, so
  // a deleted Cloudflare video or a missing poster file is caught as a broken
  // link, not just a data-shape problem. Off by default to keep the scheduled
  // run cheap.
  if (new URL(request.url).searchParams.get('deep') === '1') {
    const base =
      process.env.NEXT_PUBLIC_APP_URL ?? 'https://thegulel.com';
    const checkUrl = async (
      url: string,
      type: string,
      entity: string
    ): Promise<Issue | null> => {
      try {
        const res = await fetch(url, {
          method: 'GET',
          signal: AbortSignal.timeout(7000),
          cache: 'no-store',
        });
        if (!res.ok) {
          return {
            severity: 'error',
            type,
            entity,
            detail: `HTTP ${res.status} for ${url}`,
          };
        }
        return null;
      } catch {
        return { severity: 'error', type, entity, detail: `Unreachable: ${url}` };
      }
    };

    const targets: Array<() => Promise<Issue | null>> = [];
    for (const e of episodes) {
      const url = resolveVideoUrl(e);
      if (url && isHls(url)) {
        targets.push(() => checkUrl(url, 'video_link_broken', `${e.title} (${e.id})`));
      }
    }
    const seriesThumbs = await prisma.series.findMany({
      where: { status: 'PUBLISHED' },
      select: { id: true, title: true, thumbnail: true },
    });
    for (const s of seriesThumbs) {
      if (!s.thumbnail) continue;
      const url = s.thumbnail.startsWith('http')
        ? s.thumbnail
        : `${base}${s.thumbnail}`;
      targets.push(() =>
        checkUrl(url, 'thumbnail_link_broken', `${s.title} (${s.id})`)
      );
    }

    // Bounded concurrency so ~200 checks stay inside the function timeout.
    const CONCURRENCY = 15;
    let cursor = 0;
    await Promise.all(
      Array.from({ length: CONCURRENCY }, async () => {
        while (cursor < targets.length) {
          const job = targets[cursor++];
          const issue = await job();
          if (issue) issues.push(issue);
        }
      })
    );
  }

  const errors = issues.filter((i) => i.severity === 'error').length;
  const warnings = issues.filter((i) => i.severity === 'warn').length;
  const summary = {
    checkedAt: new Date().toISOString(),
    seriesChecked: series.length,
    episodesChecked: episodes.length,
    errors,
    warnings,
  };
  const ok = errors === 0;

  if (!ok) {
    console.error('[audit] FAIL', JSON.stringify(summary), JSON.stringify(issues));
  }

  const hook = process.env.AUDIT_WEBHOOK_URL;
  if (hook && !ok) {
    try {
      await fetch(hook, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: `🔴 Gulel site audit: ${errors} error(s), ${warnings} warning(s) across ${series.length} series / ${episodes.length} episodes.`,
          summary,
          issues: issues.slice(0, 50),
        }),
      });
    } catch (err) {
      console.error('[audit] webhook post failed', err);
    }
  }

  return NextResponse.json({ ok, summary, issues }, { status: ok ? 200 : 503 });
}
