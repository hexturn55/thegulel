'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { captureAttribution } from '@/lib/attribution';
import { flushAuthEvent } from '@/lib/analytics';

/**
 * Mounted once in the root layout. On every page load and route change it
 * records campaign attribution from the URL (first/last-touch cookies) and
 * reports a pending sign_up/login left by the auth callback.
 */
export function FunnelTracker() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttribution();
    flushAuthEvent();
  }, [pathname]);

  return null;
}
