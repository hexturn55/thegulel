// Dynamic Expo config: wraps app.json (passed in as `config`) unchanged, and
// adds a release check.
//
// A production build without the RevenueCat public SDK keys ships a binary in
// which every coin / VIP purchase shows "temporarily unavailable" (see
// lib/purchases.ts isPurchasesConfigurable). That is fine for a first upload
// (Google Play only lets you create in-app products after a build has been
// uploaded, and TestFlight builds don't need IAP), but App Review rejects a
// store submission whose purchases don't work (Guideline 2.1). So for the
// `production` EAS profile we print a loud warning in the build log when the
// key for the platform being built is missing. Set GULEL_REQUIRE_IAP_KEYS=1 to
// turn the warning into a hard failure once the keys are configured, so a
// store build can never silently ship without them.
//
// Keys may come from any of the sources lib/config.ts reads:
//   * EXPO_PUBLIC_RC_IOS_KEY / EXPO_PUBLIC_RC_ANDROID_KEY (eas.json profile env,
//     or EAS environment variables: `eas env:create --environment production`)
//   * app.json extra.revenueCatIosKey / extra.revenueCatAndroidKey
// They are public SDK keys (appl_... / goog_...), safe to commit.
//
// Local dev, `expo start`, and the development / preview profiles are not
// affected.
module.exports = ({ config }) => {
  if (process.env.EAS_BUILD_PROFILE === 'production') {
    const extra = config.extra || {};
    const keys = {
      ios: process.env.EXPO_PUBLIC_RC_IOS_KEY || extra.revenueCatIosKey || '',
      android: process.env.EXPO_PUBLIC_RC_ANDROID_KEY || extra.revenueCatAndroidKey || '',
    };
    const platform = process.env.EAS_BUILD_PLATFORM; // 'ios' | 'android' | unset
    const required = platform === 'ios' || platform === 'android' ? [platform] : ['ios', 'android'];
    const missing = required.filter((p) => !keys[p]);
    if (missing.length > 0) {
      const vars = missing
        .map((p) => (p === 'ios' ? 'EXPO_PUBLIC_RC_IOS_KEY' : 'EXPO_PUBLIC_RC_ANDROID_KEY'))
        .join(', ');
      const message =
        `RevenueCat SDK key missing for the production build (${missing.join(', ')}): ` +
        `in-app purchases will show as unavailable in this binary. Set ${vars} in ` +
        `eas.json build.production.env, as an EAS environment variable for the ` +
        `production environment, or in app.json extra before submitting for review.`;
      if (process.env.GULEL_REQUIRE_IAP_KEYS === '1') throw new Error(message);
      console.warn(`\n⚠️  ${message}\n`);
    }
  }
  return config;
};
