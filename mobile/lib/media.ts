import { config } from './config';

/**
 * Resolve a possibly-relative media path (e.g. "/thumbnails/x.png") returned by
 * the API into an absolute URL against the API origin. React Native's <Image>
 * and the video player need absolute URLs; the web app resolves these relative
 * to its own domain, but the native app must do it explicitly.
 */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  const base = config.apiUrl.replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
}
