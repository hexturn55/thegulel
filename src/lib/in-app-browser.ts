/**
 * Social apps open links in their own WebView ("in-app browser"). Google
 * OAuth refuses to run there (403 disallowed_useragent), so sign-in leads with
 * phone OTP instead. Covers Facebook/Messenger (FBAN/FBAV/FB_IAB), Instagram,
 * Threads (whose iOS UA says "Barcelona"), LINE, and generic Android WebViews
 * ("; wv)").
 */
const IN_APP_UA = /FBAN|FBAV|FB_IAB|FBIOS|FB4A|Instagram|Threads|Barcelona|\bLine\/|; wv\)/i;

export function isInAppBrowser(userAgent: string | null | undefined): boolean {
  return !!userAgent && IN_APP_UA.test(userAgent);
}
