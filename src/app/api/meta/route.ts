import { NextResponse } from 'next/server';
import { GENRES, SUPPORTED_LOCALES } from '@gulel/shared';

/**
 * GET /api/meta
 * Lightweight, dependency-free endpoint exposing shared catalog metadata.
 * Also serves as the integration point proving the web app consumes the
 * cross-platform `@gulel/shared` workspace package.
 */
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json({
    genres: GENRES,
    locales: SUPPORTED_LOCALES,
  });
}
