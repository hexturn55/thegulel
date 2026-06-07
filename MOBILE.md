# Gulel — Mobile (iOS + Android)

The mobile apps are built with **Expo (React Native)** and live in [`mobile/`](./mobile).
They share domain types and the API client with the web app through the
[`@gulel/shared`](./packages/shared) workspace package.

```
thegulel/
├── src/                  # Next.js web app (root package)
├── packages/shared/      # @gulel/shared — types + API client (web AND mobile)
└── mobile/               # @gulel/mobile — Expo app (iOS / Android / web preview)
```

## Why this layout

- **Web is never disturbed.** `mobile/` keeps its own `node_modules`, so React
  Native is never hoisted into the web app's dependency tree (they'd fight over
  React versions otherwise). Only `packages/*` are npm workspaces.
- **One source of truth.** `@gulel/shared` holds the domain types (mirroring the
  Prisma schema) and a typed API client. The mobile app binds it to a Supabase
  bearer token; the web app uses same-origin cookies. Add an endpoint once, both
  platforms get it.

---

## Running the mobile app locally

```bash
cd mobile
cp .env.example .env        # fill in API URL + Supabase + RevenueCat keys
npm install                 # first time only
npm run start               # Expo dev server (scan QR with Expo Go)
# or target a platform:
npm run ios                 # needs macOS + Xcode
npm run android             # needs Android Studio + an emulator/device
npm run web                 # react-native-web preview in the browser
```

`EXPO_PUBLIC_API_URL` must point at the running Gulel API (the Next.js app),
e.g. `http://<your-LAN-ip>:3000` for local testing or the deployed URL.

---

## What you still need to install / set up

You do **not** need anything extra to write and preview the app. You need the
following only when you build real store binaries:

### 1. EAS (Expo Application Services) — cloud builds & submission
This is the recommended path: it builds signed `.ipa`/`.apk`/`.aab` in the
cloud, so you don't need a Mac for iOS.

```bash
npm install -g eas-cli
eas login
cd mobile
eas build:configure              # creates eas.json
eas build --platform ios         # → .ipa (App Store)
eas build --platform android     # → .aab (Play Store)
eas submit --platform ios        # upload to App Store Connect
eas submit --platform android    # upload to Play Console
```

> Note: in this cloud dev environment, `eas build` runs remotely on Expo's
> servers — it is not affected by the local network allowlist, but you must run
> `eas login` with your Expo account.

### 2. Developer accounts (required to publish)
- **Apple Developer Program** — $99/year. Create the app in App Store Connect,
  bundle id `com.gulel.app`.
- **Google Play Developer** — $25 one-time. Create the app in Play Console,
  package `com.gulel.app`.

### 3. Local toolchains (only if you build locally instead of EAS)
- iOS: macOS + Xcode + CocoaPods.
- Android: Android Studio + JDK 17 + Android SDK.
With EAS you can skip both.

---

## In-app purchases — the part that changes your backend

**Apple and Google require their native IAP for digital goods** (your coins and
VIP subscriptions). Stripe/Razorpay are **not allowed** for in-app digital
purchases on iOS, and Google requires Play Billing for the same. The web app
keeps Stripe/Razorpay; the mobile apps must use StoreKit / Play Billing.

We wrap this with **RevenueCat** (`react-native-purchases`, already installed):

- `mobile/lib/purchases.ts` — native implementation (StoreKit/Billing).
- `mobile/lib/purchases.web.ts` — no-op stub so the web preview still builds.

**The webhook is already implemented** at `src/app/api/webhooks/revenuecat/route.ts`
(idempotent coin credit + VIP grant/expire, mirroring the Stripe pattern), with
the product→grant mapping in `src/lib/revenuecat.ts`. Remaining setup is store/
dashboard configuration:
1. Configure products in App Store Connect + Play Console (coin packs, VIP plans)
   using the identifiers in `src/lib/revenuecat.ts` (e.g. `com.gulel.coins.500`).
2. Map them in RevenueCat; set the public SDK keys as
   `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY` (mobile) and point the
   RevenueCat webhook at `/api/webhooks/revenuecat` with `REVENUECAT_WEBHOOK_SECRET`.

---

## Auth — unified (done)

The server now authenticates from **either** the Supabase session cookie (web)
**or** an `Authorization: Bearer <token>` header (mobile), via
`getSupabaseUser()` in `src/lib/supabase-server.ts`. Every authenticated route
(`auth/me`, `user/*`, `episodes/unlock`, `watch/progress`, `coins/*`,
`subscriptions`, `search`) goes through it, so the same API serves both
platforms with no per-route changes.

The mobile app drives this in `mobile/lib/auth.tsx` (`AuthProvider`/`useAuth`):
phone-OTP sign-in via Supabase, then the access token is sent as a bearer token
by the shared API client.

---

## Video & DRM

- Playback uses **`expo-video`** (`mobile/app/watch/[episodeId].tsx`) against the
  Cloudflare Stream HLS URLs already used by the web player.
- For paid content, issue **signed/tokenized playback URLs** server-side after
  verifying entitlement (don't ship raw URLs to locked episodes).
- If you need hardened DRM later: FairPlay (iOS) + Widevine (Android) via
  Cloudflare Stream signed tokens.

---

## What's implemented in the app

- **Screens** (`mobile/app/`): catalog (`index`), series episodes (`series/[id]`),
  fullscreen player (`watch/[episodeId]`), phone-OTP sign-in (`auth`),
  coins paywall (`coins`), account (`account`).
- **Unlock loop**: tapping a locked episode confirms, spends coins via
  `episodes/unlock` (VIP/balance enforced server-side), and falls through to the
  paywall when the balance is short.
- **`eas.json`** with development / preview (iOS simulator) / production profiles.

## Suggested next steps

1. Configure RevenueCat + store products, then `eas build --profile development`
   for a first device/TestFlight build.
2. Add **OAuth sign-in** (Google/Apple) alongside phone OTP.
3. Add **push notifications** (`expo-notifications`) for new episodes.
4. Polish: vertical swipe feed, resume-from-history, offline downloads,
   Chromecast/AirPlay.
