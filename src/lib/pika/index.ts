/**
 * Pika generative-media integration (hosted on fal.ai).
 *
 * Public entry point. Import the service functions and types from here:
 *
 *   import { generatePromo, getJob, PikaError } from '@/lib/pika';
 *
 * Note: the service/client modules are `server-only`. Importing this index from
 * a Client Component will only work for the type re-exports below.
 */

export {
  generatePromo,
  generatePoster,
  reframeToVertical,
  scoreVirality,
  getJob,
  extractMediaUrl,
} from './service';

export { PikaError } from './client';
export type { PikaErrorCode } from './client';

export type {
  PikaAspectRatio,
  PikaResolution,
  PikaJobKind,
  PikaJobStatus,
  PikaEnqueueResult,
  PikaJobSnapshot,
  GeneratePromoInput,
  GeneratePosterInput,
  ReframeToVerticalInput,
  ScoreViralityInput,
} from './types';
