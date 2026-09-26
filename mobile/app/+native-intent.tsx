/**
 * Rewrites incoming system deep links before Expo Router resolves them.
 *
 * The OAuth redirect (gulel://auth-callback?...) is consumed by
 * WebBrowser.openAuthSessionAsync in lib/auth; on Android it is also delivered
 * to the router, which has no `auth-callback` route.
 *
 * - Cold start (`initial`): the app was launched by the redirect itself, so
 *   there is no stack to preserve — send it home instead of showing
 *   "Unmatched route".
 * - Warm link (`!initial`): the sign-in flow is still in progress on top of
 *   the current stack (auth modal over series/watch). Return '' so the router
 *   ignores the URL (expo-router only navigates `if (href)`); navigating to '/'
 *   here would pop the stack back to Home mid-sign-in and unmount the auth
 *   screen.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }) {
  try {
    if (path.includes('auth-callback')) return initial ? '/' : '';
  } catch {
    // Never throw from here: it can crash the app on launch.
  }
  return path;
}
