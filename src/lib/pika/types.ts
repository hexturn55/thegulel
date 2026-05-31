/**
 * Shared types for the Pika (fal.ai-hosted) generative-media integration.
 *
 * Backend: Pika's official self-serve API is hosted on fal.ai, which exposes
 * the Pika models behind fal's async **queue** API. See:
 *   - https://docs.fal.ai/model-apis/model-endpoints/queue
 *   - https://fal.ai/models/fal-ai/pika/v2.2/text-to-video/api
 *
 * These are runtime types only — no `server-only` import here so the types can
 * be shared with client components that render job results.
 */

/** Aspect ratios supported by Pika v2.2 on fal.ai. */
export type PikaAspectRatio =
  | '16:9'
  | '9:16'
  | '1:1'
  | '4:5'
  | '5:4'
  | '3:2'
  | '2:3';

/** Output resolutions supported by Pika v2.2 on fal.ai. */
export type PikaResolution = '720p' | '1080p';

/** High-level feature each job maps to. Mirrors the Prisma `PikaJobKind` enum. */
export type PikaJobKind = 'PROMO' | 'POSTER' | 'REFRAME' | 'VIRALITY';

/**
 * Normalized job status. Mirrors the Prisma `PikaJobStatus` enum and is derived
 * from fal's queue states (IN_QUEUE / IN_PROGRESS / COMPLETED) plus failures.
 */
export type PikaJobStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/** fal queue lifecycle states returned by the status endpoint. */
export type FalQueueState = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED';

/** A file descriptor as returned in fal model outputs. */
export interface FalFile {
  url: string;
  content_type?: string;
  file_name?: string;
  file_size?: number;
}

/** Shape returned by fal when a request is enqueued. */
export interface FalSubmitResponse {
  request_id: string;
  status?: FalQueueState;
  /** Absolute URL to poll for status. */
  status_url: string;
  /** Absolute URL to fetch the final response/output. */
  response_url: string;
  /** Absolute URL to cancel the request. */
  cancel_url?: string;
}

/** Shape returned by fal's status endpoint. */
export interface FalStatusResponse {
  status: FalQueueState;
  request_id?: string;
  queue_position?: number;
  response_url?: string;
  logs?: Array<{ message: string; level?: string; timestamp?: string }> | null;
}

/** Handle returned when we enqueue a job; persisted on the `PikaJob` row. */
export interface PikaEnqueueResult {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  cancelUrl?: string;
  /** fal model id used (e.g. `fal-ai/pika/v2.2/text-to-video`). */
  model: string;
}

/** Result of polling a job once. */
export interface PikaJobSnapshot {
  status: PikaJobStatus;
  /** Direct media URL from the model output once COMPLETED (fal CDN). */
  mediaUrl?: string;
  /** Virality score in [0, 1] when the job is a VIRALITY prediction. */
  score?: number;
  /** Raw model output, useful for debugging / metadata persistence. */
  raw?: unknown;
  /** Error message when status is FAILED. */
  error?: string;
}

/** Input for {@link generatePromo}. */
export interface GeneratePromoInput {
  prompt: string;
  /** Optional source image — switches to Pika image-to-video. */
  imageUrl?: string;
  aspectRatio?: PikaAspectRatio;
  resolution?: PikaResolution;
  /** Clip length in seconds (Pika v2.2 supports up to 10). */
  duration?: number;
  negativePrompt?: string;
  seed?: number;
}

/** Input for {@link generatePoster}. */
export interface GeneratePosterInput {
  prompt: string;
  aspectRatio?: PikaAspectRatio;
  negativePrompt?: string;
  seed?: number;
}

/** Input for {@link reframeToVertical}. */
export interface ReframeToVerticalInput {
  /** Source image (key frame) the vertical clip is built from. */
  imageUrl: string;
  prompt?: string;
  resolution?: PikaResolution;
  duration?: number;
  seed?: number;
}

/** Input for {@link scoreVirality}. */
export interface ScoreViralityInput {
  /** Public URL of the video to analyze. */
  videoUrl: string;
  prompt?: string;
}
