import 'server-only';

import { getResult, getStatus, PikaError, submit } from './client';
import type {
  GeneratePosterInput,
  GeneratePromoInput,
  PikaEnqueueResult,
  PikaJobSnapshot,
  PikaJobStatus,
  ReframeToVerticalInput,
  ScoreViralityInput,
} from './types';

/**
 * High-level Pika service. Each `generate*` / `reframe*` / `score*` function
 * **enqueues** a job on fal and returns a {@link PikaEnqueueResult} (request id
 * + poll URLs). Callers persist that handle, then call {@link getJob} to poll
 * until the media URL is available. This keeps the service free of any DB or
 * storage concerns (those live in the Server Action layer).
 *
 * Model ids are env-overridable so the deployment can pin a specific Pika
 * version without code changes.
 */

const MODELS = {
  /** Text-to-video (used when no source image is supplied). */
  promoText: process.env.PIKA_MODEL_PROMO ?? 'fal-ai/pika/v2.2/text-to-video',
  /** Image-to-video (used for promos with a key frame, and for reframing). */
  promoImage: process.env.PIKA_MODEL_PROMO_IMAGE ?? 'fal-ai/pika/v2.2/image-to-video',
  /**
   * Poster / thumbnail still image. Pika on fal is video-only, so posters use a
   * fal text-to-image model. Override with PIKA_MODEL_POSTER to swap models.
   */
  poster: process.env.PIKA_MODEL_POSTER ?? 'fal-ai/flux/schnell',
  /** Vertical 9:16 reframe — Pika image-to-video forced to a 9:16 aspect ratio. */
  reframe: process.env.PIKA_MODEL_REFRAME ?? 'fal-ai/pika/v2.2/image-to-video',
  /**
   * Virality predictor. fal does not (currently) host a Pika virality model, so
   * this is opt-in: set PIKA_MODEL_VIRALITY to a queue-compatible model to
   * enable it. Without it, {@link scoreVirality} throws an `unsupported` error
   * rather than silently fabricating a result.
   */
  virality: process.env.PIKA_MODEL_VIRALITY ?? '',
} as const;

function toEnqueueResult(
  model: string,
  res: Awaited<ReturnType<typeof submit>>
): PikaEnqueueResult {
  return {
    requestId: res.request_id,
    statusUrl: res.status_url,
    responseUrl: res.response_url,
    cancelUrl: res.cancel_url,
    model,
  };
}

/** Generate a promo / trailer clip from a prompt (optionally seeded by an image). */
export async function generatePromo(input: GeneratePromoInput): Promise<PikaEnqueueResult> {
  const { prompt, imageUrl, aspectRatio = '16:9', resolution = '1080p', duration = 5, negativePrompt, seed } = input;
  if (!prompt?.trim()) throw new PikaError('http', 'generatePromo requires a non-empty prompt');

  const model = imageUrl ? MODELS.promoImage : MODELS.promoText;
  const payload: Record<string, unknown> = {
    prompt,
    aspect_ratio: aspectRatio,
    resolution,
    duration,
  };
  if (imageUrl) payload.image_url = imageUrl;
  if (negativePrompt) payload.negative_prompt = negativePrompt;
  if (typeof seed === 'number') payload.seed = seed;

  return toEnqueueResult(model, await submit(model, payload));
}

/** Generate a poster / thumbnail still image from a prompt. */
export async function generatePoster(input: GeneratePosterInput): Promise<PikaEnqueueResult> {
  const { prompt, aspectRatio = '2:3', negativePrompt, seed } = input;
  if (!prompt?.trim()) throw new PikaError('http', 'generatePoster requires a non-empty prompt');

  const model = MODELS.poster;
  const payload: Record<string, unknown> = {
    prompt,
    // fal image models accept either `aspect_ratio` or `image_size`; pass the
    // aspect ratio which the flux family understands.
    aspect_ratio: aspectRatio,
  };
  if (negativePrompt) payload.negative_prompt = negativePrompt;
  if (typeof seed === 'number') payload.seed = seed;

  return toEnqueueResult(model, await submit(model, payload));
}

/** Reframe a key frame into a vertical 9:16 clip suitable for mobile / shorts. */
export async function reframeToVertical(input: ReframeToVerticalInput): Promise<PikaEnqueueResult> {
  const { imageUrl, prompt, resolution = '1080p', duration = 5, seed } = input;
  if (!imageUrl?.trim()) throw new PikaError('http', 'reframeToVertical requires a source imageUrl');

  const model = MODELS.reframe;
  const payload: Record<string, unknown> = {
    image_url: imageUrl,
    aspect_ratio: '9:16',
    resolution,
    duration,
  };
  if (prompt) payload.prompt = prompt;
  if (typeof seed === 'number') payload.seed = seed;

  return toEnqueueResult(model, await submit(model, payload));
}

/** Predict virality / engagement for a generated or uploaded video. */
export async function scoreVirality(input: ScoreViralityInput): Promise<PikaEnqueueResult> {
  if (!MODELS.virality) {
    throw new PikaError(
      'unsupported',
      'Virality prediction is not configured. Set PIKA_MODEL_VIRALITY to a queue-compatible fal model id to enable it.'
    );
  }
  const { videoUrl, prompt } = input;
  if (!videoUrl?.trim()) throw new PikaError('http', 'scoreVirality requires a videoUrl');

  const payload: Record<string, unknown> = { video_url: videoUrl };
  if (prompt) payload.prompt = prompt;

  return toEnqueueResult(MODELS.virality, await submit(MODELS.virality, payload));
}

/**
 * Poll a previously enqueued job once and return a normalized snapshot. When the
 * job has COMPLETED, the fal media URL (and virality score, if present) is
 * extracted from the model output.
 */
export async function getJob(handle: {
  statusUrl: string;
  responseUrl: string;
}): Promise<PikaJobSnapshot> {
  const status = await getStatus(handle.statusUrl);

  const normalized = normalizeStatus(status.status);
  if (normalized !== 'COMPLETED') {
    return { status: normalized };
  }

  const output = await getResult<Record<string, unknown>>(handle.responseUrl);
  return {
    status: 'COMPLETED',
    mediaUrl: extractMediaUrl(output),
    score: extractScore(output),
    raw: output,
  };
}

function normalizeStatus(state: string | undefined): PikaJobStatus {
  switch (state) {
    case 'IN_QUEUE':
      return 'PENDING';
    case 'IN_PROGRESS':
      return 'PROCESSING';
    case 'COMPLETED':
      return 'COMPLETED';
    default:
      return 'PROCESSING';
  }
}

/** Pull the first usable media URL out of a fal model output. */
export function extractMediaUrl(output: Record<string, unknown> | undefined): string | undefined {
  if (!output) return undefined;
  const o = output as Record<string, unknown>;

  const video = o.video as { url?: string } | undefined;
  if (video?.url) return video.url;

  const image = o.image as { url?: string } | undefined;
  if (image?.url) return image.url;

  const images = o.images as Array<{ url?: string }> | undefined;
  if (Array.isArray(images) && images[0]?.url) return images[0].url;

  const videos = o.videos as Array<{ url?: string }> | undefined;
  if (Array.isArray(videos) && videos[0]?.url) return videos[0].url;

  if (typeof o.url === 'string') return o.url;
  return undefined;
}

/** Pull a virality score (normalized to [0,1] when expressed as a percentage). */
function extractScore(output: Record<string, unknown> | undefined): number | undefined {
  if (!output) return undefined;
  const candidate =
    (output.score as number | undefined) ??
    (output.virality_score as number | undefined) ??
    (output.virality as number | undefined);
  if (typeof candidate !== 'number') return undefined;
  return candidate > 1 ? candidate / 100 : candidate;
}
