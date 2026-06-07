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

**Backend work to do (server side):**
1. Configure products in App Store Connect + Play Console (coin packs, VIP plans).
2. Map them in RevenueCat; set the public SDK keys as
   `EXPO_PUBLIC_RC_IOS_KEY` / `EXPO_PUBLIC_RC_ANDROID_KEY`.
3. Add a **RevenueCat webhook** endpoint to the Next.js API (e.g.
   `src/app/api/webhooks/revenuecat/route.ts`) that credits coins / grants VIP
   using the same **idempotent `CoinTransaction.providerRef`** pattern the
   existing Stripe/Razorpay webhooks use (`revenuecat:<event_id>`).

---

## Auth — one server change needed

The web API authenticates via Supabase **cookies** (`createServerSupabaseClient`
reads cookies). Mobile sends the Supabase **access token as a Bearer header**
(the shared API client already does this via `getToken`). Update the server's
auth helper to also accept `Authorization: Bearer <token>` and validate it with
`supabase.auth.getUser(token)`, so the same routes serve both web and mobile.

---

## Video & DRM

- Playback uses **`expo-video`** (`mobile/app/watch/[episodeId].tsx`) against the
  Cloudflare Stream HLS URLs already used by the web player.
- For paid content, issue **signed/tokenized playback URLs** server-side after
  verifying entitlement (don't ship raw URLs to locked episodes).
- If you need hardened DRM later: FairPlay (iOS) + Widevine (Android) via
  Cloudflare Stream signed tokens.

---

## Suggested next steps

1. `eas build:configure` and run a first **internal/TestFlight** build.
2. Implement the **RevenueCat webhook** + **Bearer auth** server changes above.
3. Add **auth screens** (Supabase phone/OAuth) and a **coins/paywall** screen
   wired to RevenueCat offerings.
4. Add **push notifications** (`expo-notifications`) for new episodes.
5. Optional polish: vertical swipe feed, offline downloads, Chromecast/AirPlay.
