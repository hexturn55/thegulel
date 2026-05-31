import 'server-only';

import type {
  FalStatusResponse,
  FalSubmitResponse,
} from './types';

/**
 * Server-only HTTP client for the Pika generative-media API (hosted on fal.ai).
 *
 * fal exposes every model behind an async **queue**:
 *   1. POST `${PIKA_BASE_URL}/${model}`   -> enqueue, returns request_id + URLs
 *   2. GET  `${status_url}`               -> poll until status === COMPLETED
 *   3. GET  `${response_url}`             -> fetch the model output
 *
 * Auth is a single API key sent as `Authorization: Key <PIKA_API_KEY>`
 * (this is fal's scheme; the key is your fal key). We deliberately use the
 * `status_url` / `response_url` returned by the submit call rather than
 * reconstructing paths, which is the fal-recommended approach and avoids
 * brittle assumptions about namespaced model ids.
 *
 * Env (server-side only — never `NEXT_PUBLIC_*`):
 *   PIKA_API_KEY   required — fal API key.
 *   PIKA_BASE_URL  optional — defaults to https://queue.fal.run
 */

const DEFAULT_BASE_URL = 'https://queue.fal.run';

export type PikaErrorCode =
  | 'config'
  | 'auth'
  | 'rate_limit'
  | 'http'
  | 'network'
  | 'timeout'
  | 'unsupported'
  | 'parse';

/** Typed error thrown by the Pika client and service layer. */
export class PikaError extends Error {
  readonly code: PikaErrorCode;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    code: PikaErrorCode,
    message: string,
    options?: { status?: number; details?: unknown; cause?: unknown }
  ) {
    super(message, options?.cause ? { cause: options.cause } : undefined);
    this.name = 'PikaError';
    this.code = code;
    this.status = options?.status;
    this.details = options?.details;
  }
}

function getApiKey(): string {
  const key = process.env.PIKA_API_KEY;
  if (!key) {
    throw new PikaError(
      'config',
      'PIKA_API_KEY is not set. Add it to your server environment (never NEXT_PUBLIC_*).'
    );
  }
  return key;
}

function getBaseUrl(): string {
  return (process.env.PIKA_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    Authorization: `Key ${getApiKey()}`,
    Accept: 'application/json',
    ...extra,
  };
}

const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

interface RetryOptions {
  /** Max attempts including the first. Default 4. */
  maxAttempts?: number;
  /** Base backoff in ms (doubles each retry). Default 500. */
  baseDelayMs?: number;
  /** Per-request timeout in ms. Default 30_000. */
  timeoutMs?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * fetch wrapper with timeout + exponential backoff on transient failures
 * (network errors and retryable HTTP statuses). Non-retryable HTTP errors are
 * surfaced immediately as a {@link PikaError}.
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  { maxAttempts = 4, baseDelayMs = 500, timeoutMs = 30_000 }: RetryOptions = {}
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);

      if (res.ok) return res;

      if (res.status === 401 || res.status === 403) {
        throw new PikaError('auth', `Pika auth failed (HTTP ${res.status}). Check PIKA_API_KEY.`, {
          status: res.status,
          details: await safeBody(res),
        });
      }

      if (RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
        const retryAfter = Number(res.headers.get('retry-after')) * 1000;
        await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : backoff(baseDelayMs, attempt));
        continue;
      }

      const code: PikaErrorCode = res.status === 429 ? 'rate_limit' : 'http';
      throw new PikaError(code, `Pika request failed (HTTP ${res.status}) for ${url}`, {
        status: res.status,
        details: await safeBody(res),
      });
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof PikaError) throw err;

      // AbortError (timeout) or network failure — retry if attempts remain.
      lastError = err;
      const isTimeout = err instanceof Error && err.name === 'AbortError';
      if (attempt < maxAttempts) {
        await sleep(backoff(baseDelayMs, attempt));
        continue;
      }
      throw new PikaError(
        isTimeout ? 'timeout' : 'network',
        `Pika request ${isTimeout ? 'timed out' : 'failed'} after ${maxAttempts} attempts for ${url}`,
        { cause: err }
      );
    }
  }

  // Unreachable, but keeps the type checker happy.
  throw new PikaError('network', 'Pika request failed', { cause: lastError });
}

function backoff(base: number, attempt: number): number {
  // 500, 1000, 2000, ... with light jitter.
  return base * 2 ** (attempt - 1) + Math.floor(Math.random() * 100);
}

async function safeBody(res: Response): Promise<unknown> {
  try {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return undefined;
  }
}

async function parseJson<T>(res: Response): Promise<T> {
  try {
    return (await res.json()) as T;
  } catch (err) {
    throw new PikaError('parse', 'Failed to parse Pika response as JSON', { cause: err });
  }
}

/**
 * Enqueue a generation request for the given fal model id.
 * Returns the request id and the absolute status/response URLs to poll.
 */
export async function submit(model: string, input: Record<string, unknown>): Promise<FalSubmitResponse> {
  const url = `${getBaseUrl()}/${model.replace(/^\/+/, '')}`;
  const res = await fetchWithRetry(url, {
    method: 'POST',
    headers: authHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(input),
  });
  const data = await parseJson<FalSubmitResponse>(res);
  if (!data.request_id || !data.status_url || !data.response_url) {
    throw new PikaError('parse', 'Pika submit response missing request_id/status_url/response_url', {
      details: data,
    });
  }
  return data;
}

/** Poll the queue status for a previously submitted request. */
export async function getStatus(statusUrl: string): Promise<FalStatusResponse> {
  const res = await fetchWithRetry(statusUrl, { method: 'GET', headers: authHeaders() });
  return parseJson<FalStatusResponse>(res);
}

/** Fetch the final model output once a request has COMPLETED. */
export async function getResult<T = unknown>(responseUrl: string): Promise<T> {
  const res = await fetchWithRetry(responseUrl, { method: 'GET', headers: authHeaders() });
  return parseJson<T>(res);
}
