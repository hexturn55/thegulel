'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/lib/admin-auth';
import prisma from '@/lib/prisma';
import {
  generatePoster,
  generatePromo,
  getJob,
  PikaError,
  reframeToVertical,
  scoreVirality,
} from '@/lib/pika';
import type { PikaEnqueueResult } from '@/lib/pika';
import { mediaPathFor, uploadRemoteMediaToStorage } from '@/lib/supabase-storage';
import { PikaJobKind } from '@/generated/prisma';

/**
 * Server Actions for the four Pika features. Every action is gated by the app's
 * admin guard (`requireAdmin`) — Server Actions are reachable via direct POST,
 * so authorization is enforced here, not just in the UI.
 *
 * Flow: enqueue on fal -> persist a PikaJob row -> client polls `pollPikaJob`
 * -> on completion we download the fal media and re-host it in Supabase Storage.
 */

/** Plain, serializable job shape returned to Client Components. */
export interface PikaJobDTO {
  id: string;
  seriesId: string;
  kind: PikaJobKind;
  status: string;
  model: string;
  prompt: string | null;
  mediaUrl: string | null;
  sourceUrl: string | null;
  score: number | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
}

function toDTO(job: {
  id: string;
  seriesId: string;
  kind: PikaJobKind;
  status: string;
  model: string;
  prompt: string | null;
  mediaUrl: string | null;
  sourceUrl: string | null;
  score: number | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PikaJobDTO {
  return {
    id: job.id,
    seriesId: job.seriesId,
    kind: job.kind,
    status: job.status,
    model: job.model,
    prompt: job.prompt,
    mediaUrl: job.mediaUrl,
    sourceUrl: job.sourceUrl,
    score: job.score,
    error: job.error,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString(),
  };
}

async function assertAdmin() {
  const admin = await requireAdmin();
  if (!admin) throw new Error('Unauthorized');
  return admin;
}

async function assertSeries(seriesId: string) {
  const series = await prisma.series.findUnique({ where: { id: seriesId } });
  if (!series) throw new Error('Series not found');
  return series;
}

async function persistEnqueued(
  seriesId: string,
  kind: PikaJobKind,
  prompt: string | null,
  handle: PikaEnqueueResult
): Promise<PikaJobDTO> {
  const job = await prisma.pikaJob.create({
    data: {
      seriesId,
      kind,
      status: 'PENDING',
      model: handle.model,
      prompt,
      requestId: handle.requestId,
      statusUrl: handle.statusUrl,
      responseUrl: handle.responseUrl,
    },
  });
  revalidatePath(`/admin/series/${seriesId}`);
  return toDTO(job);
}

function toErrorMessage(err: unknown): string {
  if (err instanceof PikaError) return `${err.code}: ${err.message}`;
  return err instanceof Error ? err.message : 'Unknown error';
}

// --- Feature 1: promo / trailer -------------------------------------------

export async function enqueuePikaPromo(
  seriesId: string,
  input: { prompt: string; imageUrl?: string; durationSeconds?: number }
): Promise<PikaJobDTO> {
  await assertAdmin();
  await assertSeries(seriesId);
  const handle = await generatePromo({
    prompt: input.prompt,
    imageUrl: input.imageUrl,
    aspectRatio: '16:9',
    duration: input.durationSeconds ?? 5,
  });
  return persistEnqueued(seriesId, PikaJobKind.PROMO, input.prompt, handle);
}

// --- Feature 2: poster / thumbnail ----------------------------------------

export async function enqueuePikaPoster(
  seriesId: string,
  input: { prompt: string }
): Promise<PikaJobDTO> {
  await assertAdmin();
  await assertSeries(seriesId);
  const handle = await generatePoster({ prompt: input.prompt, aspectRatio: '2:3' });
  return persistEnqueued(seriesId, PikaJobKind.POSTER, input.prompt, handle);
}

// --- Feature 3: vertical 9:16 reframe -------------------------------------

export async function enqueuePikaReframe(
  seriesId: string,
  input: { imageUrl: string; prompt?: string }
): Promise<PikaJobDTO> {
  await assertAdmin();
  await assertSeries(seriesId);
  const handle = await reframeToVertical({ imageUrl: input.imageUrl, prompt: input.prompt });
  return persistEnqueued(seriesId, PikaJobKind.REFRAME, input.prompt ?? null, handle);
}

// --- Feature 4: virality scoring ------------------------------------------

export async function enqueuePikaVirality(
  seriesId: string,
  input: { videoUrl: string }
): Promise<PikaJobDTO> {
  await assertAdmin();
  await assertSeries(seriesId);
  const handle = await scoreVirality({ videoUrl: input.videoUrl });
  return persistEnqueued(seriesId, PikaJobKind.VIRALITY, null, handle);
}

// --- Polling + persistence ------------------------------------------------

/**
 * Poll a job once. On completion, download the fal media and re-host it in
 * Supabase Storage (videos/images); virality jobs just persist the score.
 */
export async function pollPikaJob(jobId: string): Promise<PikaJobDTO> {
  await assertAdmin();

  const job = await prisma.pikaJob.findUnique({ where: { id: jobId } });
  if (!job) throw new Error('Job not found');

  // Terminal states need no further work.
  if (job.status === 'COMPLETED' || job.status === 'FAILED') return toDTO(job);
  if (!job.statusUrl || !job.responseUrl) {
    const failed = await prisma.pikaJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: 'Missing fal poll URLs' },
    });
    return toDTO(failed);
  }

  try {
    const snapshot = await getJob({ statusUrl: job.statusUrl, responseUrl: job.responseUrl });

    if (snapshot.status !== 'COMPLETED') {
      const updated = await prisma.pikaJob.update({
        where: { id: jobId },
        data: { status: snapshot.status },
      });
      return toDTO(updated);
    }

    // Virality jobs have a score but typically no media to re-host.
    if (job.kind === PikaJobKind.VIRALITY) {
      const updated = await prisma.pikaJob.update({
        where: { id: jobId },
        data: { status: 'COMPLETED', score: snapshot.score ?? null },
      });
      revalidatePath(`/admin/series/${job.seriesId}`);
      return toDTO(updated);
    }

    if (!snapshot.mediaUrl) {
      const failed = await prisma.pikaJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', error: 'Completed job returned no media URL' },
      });
      return toDTO(failed);
    }

    const stored = await uploadRemoteMediaToStorage(
      snapshot.mediaUrl,
      mediaPathFor(job.seriesId, job.id, snapshot.mediaUrl)
    );

    const updated = await prisma.pikaJob.update({
      where: { id: jobId },
      data: {
        status: 'COMPLETED',
        sourceUrl: snapshot.mediaUrl,
        mediaUrl: stored.publicUrl,
      },
    });
    revalidatePath(`/admin/series/${job.seriesId}`);
    return toDTO(updated);
  } catch (err) {
    const failed = await prisma.pikaJob.update({
      where: { id: jobId },
      data: { status: 'FAILED', error: toErrorMessage(err) },
    });
    return toDTO(failed);
  }
}

/** List Pika jobs for a series (newest first). */
export async function listPikaJobs(seriesId: string): Promise<PikaJobDTO[]> {
  await assertAdmin();
  const jobs = await prisma.pikaJob.findMany({
    where: { seriesId },
    orderBy: { createdAt: 'desc' },
  });
  return jobs.map(toDTO);
}
