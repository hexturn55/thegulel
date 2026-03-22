// Custom event tracking for GA4 + FB Pixel
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  // GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }
  // FB Pixel
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, params);
  }
}

// Pre-defined events
export const analytics = {
  episodeView: (seriesId: string, episodeId: string, episodeNumber: number) =>
    trackEvent('episode_view', { series_id: seriesId, episode_id: episodeId, episode_number: episodeNumber }),

  episodeUnlock: (episodeId: string, coinsSpent: number) =>
    trackEvent('episode_unlock', { episode_id: episodeId, coins_spent: coinsSpent }),

  coinPurchase: (packageName: string, amount: number, currency: string) =>
    trackEvent('coin_purchase', { package_name: packageName, value: amount, currency }),

  adWatch: () =>
    trackEvent('ad_watch'),

  signUp: (provider: string) =>
    trackEvent('sign_up', { method: provider }),

  seriesView: (seriesId: string, title: string) =>
    trackEvent('series_view', { series_id: seriesId, series_title: title }),

  search: (query: string, resultsCount: number) =>
    trackEvent('search', { search_term: query, results_count: resultsCount }),

  share: (platform: string, seriesId: string) =>
    trackEvent('share', { method: platform, content_id: seriesId }),
};
