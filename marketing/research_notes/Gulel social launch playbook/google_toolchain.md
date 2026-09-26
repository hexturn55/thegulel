# Google Marketing Toolchain for Gulel (Ads, YouTube, Analytics, Firebase, Play) — 2026 Setup & Campaign Playbook

> Research date: 26 Sep 2026. Primary market: India. Client: Gulel (thegulel.com), a Hindi-first, AI-produced vertical micro-drama OTT. Web: Next.js on Vercel. Apps: Expo/React Native on iOS and Android, with RevenueCat IAP and rewarded ads through AdMob/IMA with SSV.
>
> **Method caveat:** In this session, WebFetch was blocked by the egress proxy for every domain I tried: support.google.com, developers.google.com, firebase.google.com, blog.google, searchengineland.com, adapty.io and almcorp.com. The web-search budget also ran out partway through. Every claim below therefore comes from search-result summaries of the linked pages, not full-page reads. Anything I could not confirm in a search result is under **Gaps**. Where a Gap gives a "believed" value, that value comes from pre-2026 documentation and must be checked in the Google Ads, GA4 or Play UI before anyone relies on it.
>
> **Local code audit.** Two files in this repo were read directly: `/home/user/thegulel/src/lib/analytics.ts` and `/home/user/thegulel/src/components/Analytics.tsx`. They are cited below as [analytics.ts] and [Analytics.tsx].

---

## 1. GA4 setup for the Gulel funnel (events, key events, custom dimensions, cross-domain, Consent Mode v2, Measurement Protocol, BigQuery, product linking)

### Takeaway
Set up one GA4 property with three data streams: Web, Android and iOS. The Android and iOS streams come through Firebase. Rename the funnel events to GA4 recommended names: `purchase` with `transaction_id`/`value`/`currency`/`items`, `earn_virtual_currency`, `spend_virtual_currency`, `sign_up` and `begin_checkout`. Only send `purchase` once the server has confirmed payment, using the Measurement Protocol on web and the Firebase SDK in the apps, and never from both sides for the same order. Mark `purchase`, `sign_up`, and in the app `first_open` and `ad_impression`, as key events. Consent Mode v2 is only contractually required by Google for EEA/UK traffic. India's DPDP Rules still set hard dates (Consent Manager framework 13 Nov 2026, full compliance 13 May 2027), so build consent plumbing now.

### Cited Findings

**Current state of the Gulel codebase (read directly)**
- The web app currently fires custom events through `gtag('event', …)`: `episode_view` {series_id, episode_id, episode_number}, `episode_unlock` {episode_id, coins_spent}, `coin_purchase` {package_name, value, currency}, `ad_watch` (no params), `sign_up` {method}, `series_view` {series_id, series_title}, `search` {search_term, results_count} and `share` {method, content_id}. It mirrors each one to Meta Pixel as `fbq('trackCustom', …)`. `coin_purchase` has no `transaction_id` and no `items` array. — [analytics.ts](/home/user/thegulel/src/lib/analytics.ts)
- `Analytics.tsx` loads gtag.js directly for `NEXT_PUBLIC_GA_ID`, and also loads a GTM container for `NEXT_PUBLIC_GTM_ID`. The gtag config runs once with `{page_path: window.location.pathname}`. There is no `gtag('consent','default',…)` call and no route-change page_view handling. — [Analytics.tsx](/home/user/thegulel/src/components/Analytics.tsx)

**GA4 recommended events and parameters**
- `earn_virtual_currency` takes `virtual_currency_name` and `value`. `spend_virtual_currency` takes `item_name`, `virtual_currency_name` and `value`. Google advises logging both so the virtual economy can be analysed. — [Google for Developers: Recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events); [MeasureU](https://measureu.com/ga4-recommended-events/); [Analytics Mania](https://www.analyticsmania.com/post/recommended-events-in-google-analytics-4/)
- `purchase` parameters: `affiliation`, `coupon`, `currency`, `items`, `transaction_id`, `shipping`, `tax`, `value`. — [Google for Developers: Recommended events](https://developers.google.com/analytics/devguides/collection/ga4/reference/events)
- Enhanced-measurement video events are `video_start`, `video_progress` (at 10/25/50/75%) and `video_complete`. They carry `video_title`, `video_url`, `video_percent`, `video_current_time` and `visible`. They fire **only for embedded YouTube iframes with the JS API enabled**, not for a custom HTML5 or HLS player. — [Analytify](https://analytify.io/ga4-video-tracking/); [Analytics Mania](https://www.analyticsmania.com/post/track-videos-with-google-analytics-4-and-google-tag-manager/); [Loves Data](https://www.lovesdata.com/blog/enhanced-measurement/)

**Custom dimension limits**
- A standard property allows 50 event-scoped, 25 user-scoped and 10 item-scoped custom dimensions. GA4 360 allows 125, 100 and 25. The limits apply per property, not per stream. Deleting a dimension frees its slot but its historical values are not restored. — [Swetrix](https://swetrix.com/blog/ga4-custom-dimensions); [WebAnalyticsSetup](https://webanalyticssetup.com/docs/kb/google-analytics/ga4-limits/)

**Measurement Protocol (server-side purchase events)**
- Each request needs an `api_secret`, created at GA4 Admin → Data Streams → [stream] → Measurement Protocol API secrets → Create. App streams also need `firebase_app_id` in the URL and `app_instance_id` in the body.
- Limits per request: 130 kB payload, 25 events, 25 parameters per event, 100 user properties.
- Events more than 72 hours old are dropped. Use `timestamp_micros` for events up to 72 hours old.
- — [Perfmetrix](https://perfmetrix.com/blog/ga4-measurement-protocol); [GA4 MP: sending events](https://developers.google.com/analytics/devguides/collection/protocol/ga4/sending-events); [Firebase MP codelab](https://firebase.google.com/codelabs/firebase_mp)
- If the Firebase SDK already logs an `in_app_purchase`, do not send it again through the Measurement Protocol. GA does not deduplicate `in_app_purchase` events. — [GA4 MP events reference](https://developers.google.com/analytics/devguides/collection/protocol/ga4/reference/events); [GA4 Experts](https://ga4experts.com/ga4-measurement-protocol-complete-implementation-guide/)

**BigQuery export**
- The daily export on a standard property is capped at 1M events/day. Properties that consistently exceed the cap may have daily export paused, and the overflow is lost, not queued.
- Streaming export has no event cap. It needs a billing-enabled GCP project and is not available in the BigQuery Sandbox. Cost is about US$0.05/GB.
- BigQuery's free tier includes 10 GB storage and 1 TB of queries per month.
- — [Optimize Smart](https://optimizesmart.com/blog/how-to-overcome-ga4-bigquery-export-limit/); [Digital Applied](https://www.digitalapplied.com/blog/ga4-bigquery-export-2026-marketing-analytics-reference); [Optizent](https://www.optizent.com/blog/difference-between-ga4-daily-export-and-streaming-export-to-bigquery/); [GA Help: BigQuery Export](https://support.google.com/analytics/answer/9358801?hl=en)

**Consent Mode v2 and India**
- Google has required Consent Mode v2 through a Google-certified CMP for EEA/UK traffic since 6 Mar 2024, and began enforcing it on 21 Jul 2025. Non-compliant accounts lost personalised ads, remarketing and conversion tracking for that traffic. The legal driver is the EU DMA. — [CookieHub](https://www.cookiehub.com/blog/what-is-google-consent-mode-v2); [Google Ads Help: EEA consent mode updates](https://support.google.com/google-ads/answer/13695607?hl=en); [ConsentPixel](https://consentpixel.com/regulations/google-consent-mode/)
- Google does **not** mandate Consent Mode for India-only traffic. Indian vendor blogs present it as a DPDP best practice, not a Google requirement. — [Inbriefly](https://inbriefly.in/google-consent-mode-v2-dpdp-act-india-2026-guide/); [Termly](https://termly.io/resources/articles/what-is-google-consent-mode-v2/)
- India's DPDP Rules 2025 were notified on 13 Nov 2025, starting an 18-month phased rollout:
  - The Data Protection Board has been live since 13 Nov 2025, with penalties of up to ₹250 crore per breach.
  - The Consent Manager framework (Rule 4) becomes operational on 13 Nov 2026.
  - Full substantive compliance (notice, consent, security, breach reporting, data-principal rights) is due by 13 May 2027.
  - — [ConsentOS](https://consentos.in/learn/dpdp-compliance-timeline/); [Onfra](https://onfra.io/blogs/dpdp-compliance-deadline-what-you-need-to-do-before-may-13-2027/); [TCSA](https://www.tcsa.in/resources/dpdp-rules-2025-implementation-roadmap); [Vinsys](https://www.vinsys.com/blog/dpdp-act-compliance-deadline-nov-2026-for-consent-manager)

**RevenueCat to Firebase/GA4**
- RevenueCat can send lifecycle events to Google Analytics for Firebase. This requires setting the reserved subscriber attribute `$firebaseAppInstanceId` to the Firebase App Instance ID. — [RevenueCat docs: Firebase integration](https://www.revenuecat.com/docs/integrations/third-party-integrations/firebase-integration); [RevenueCat Firebase integration page](https://www.revenuecat.com/integrations/firebase)
- Community threads report RevenueCat events such as `rc_trial_start` appearing in Firebase but showing no data once imported into Google Ads as conversions. — [RevenueCat Community](https://community.revenuecat.com/third-party-integrations-53/rc-trial-start-events-not-displaying-in-google-ads-conversions-5735); [RevenueCat Community: no events](https://community.revenuecat.com/general-questions-7/revenuecat-firebase-ga4-integration-no-events-showing-up-6933)

**AdMob ad revenue and `ad_impression`**
- Linking AdMob to Firebase sends ad revenue into GA4 as `ad_impression`. `ad_impression` is reserved for tROAS-for-ad-revenue (ARO) App campaigns and cannot be selected in other campaign types. Hybrid-monetisation tROAS optimises for users who generate both in-app-purchase and ad revenue. — [Google Ads Help: tROAS for ad revenue](https://support.google.com/google-ads/answer/13799577?hl=en); [Firebase hybrid monetisation tutorial](https://firebase.google.com/docs/tutorials/optimize-hybrid-monetization/step-3); [AdMob Help: link to Firebase](https://support.google.com/admob/answer/6383165?hl=en)

**Search Console**
- A video is eligible for video features only when the watch page itself is indexed and performing in Search. The video must be the page's main content.
- Use `VideoObject` structured data to describe only what is actually on the page.
- The Video indexing report lists why videos were not indexed.
- — [Google Search Central: Video structured data](https://developers.google.com/search/docs/appearance/structured-data/video); [Video SEO best practices](https://developers.google.com/search/docs/appearance/video); [Search Console Help: Video indexing report](https://support.google.com/webmasters/answer/9495631?hl=en)

### Inferences

**Fixes to the current code**
- Pick **one** tagging path.
  - Recommended: send all events through `dataLayer.push` into GTM and fire the GA4 tags there.
  - Alternative: keep gtag.js and make sure the GTM container has no GA4 Google tag for the same measurement ID.
  - Today, if GTM also carries a GA4 config tag for that ID, page views and events are double-counted.
  - Basis: [Analytics.tsx] loads both.
- Next.js App Router navigations are client-side. The single `gtag('config')` with a UA-era `page_path` does not record later routes. Either confirm that GA4 Enhanced Measurement → Page views → "Page changes based on browser history events" is ON (the default), or send `page_view` manually on route change. Do not do both.
- Add a Consent Mode default before any tag loads:
  - `gtag('consent','default',{ad_storage, analytics_storage, ad_user_data, ad_personalization, region:[EEA/UK/CH codes], …})`, set to `denied` for EEA/UK/CH.
  - Keep the settings Google-compliant for any diaspora traffic.
  - Plan an India DPDP notice and consent flow before 13 May 2027.

**Proposed event schema** (same names on web and app; app events through `@react-native-firebase/analytics`)

| Funnel step | Event (GA4 name) | Key params | Key event? |
|---|---|---|---|
| Landing from ad | `page_view` / `screen_view` (auto), `first_open` (app auto) | utm/gclid auto | `first_open` = yes (app) |
| Series card tap | `select_content` | `content_type:'series'`, `content_id:series_id` | no |
| Series detail | `view_item` (or keep custom `series_view`) | `items:[{item_id:series_id, item_name, item_category:genre, item_variant:language}]` | no |
| Episode play | `video_start` → `video_progress` (25/50/75) → `video_complete` | `series_id`, `episode_number`, `is_free`, `unlock_method`, `video_percent`, `video_title` | no (see proxy below) |
| Ep 2 paywall shown | `paywall_view` (custom) | `series_id`, `episode_number`, `paywall_variant` (from Remote Config) | no |
| Sign up | `sign_up` | `method:'google'|'phone_otp'|'apple'|'email'` | **yes** |
| Tap coin pack or VIP | `begin_checkout` | `currency:'INR'`, `value`, `items:[{item_id:'coins_100', item_category:'coin_pack'|'vip', price, quantity:1}]` | no |
| Payment confirmed (server) | `purchase` | `transaction_id` (Razorpay/Play/App Store/RevenueCat id), `value`, `currency:'INR'`, `items` | **yes, primary** |
| Coins credited | `earn_virtual_currency` | `virtual_currency_name:'coins'`, `value:<coins>`, custom `source:'purchase'|'rewarded_ad'|'signup_bonus'|'daily'` | no |
| Episode unlocked with coins | `spend_virtual_currency` | `virtual_currency_name:'coins'`, `value:<coins>`, `item_name:'<series_id>_ep<n>'` | no |
| Rewarded ad watched (SSV confirmed) | `ad_impression` (AdMob auto, app) + custom `rewarded_ad_reward` | `ad_unit`, `reward_type:'episode_unlock'` | `ad_impression` = yes (ARO only) |
| Share / search | `share`, `search` | `method`, `content_type`, `item_id`; `search_term` | no |

- **Engagement proxy key event.** Paid conversions will be sparse early on. Create a GA4 "Create event" rule, for example `engaged_viewer` when `video_complete` fires with `episode_number >= 3`, or a custom `episode_unlock` count ≥ 2 in the first 24 hours. Use it as an interim tCPA target for App and Demand Gen campaigns. This is inferred from the Demand Gen need for 50 conversions (Section 3).
- **Custom dimensions to register** (well inside the 50/25 caps).
  - Event-scoped: `series_id`, `series_title`, `episode_number`, `genre`, `content_language`, `unlock_method`, `is_free`, `paywall_variant`, `source`, `payment_platform`.
  - User-scoped: `user_tier` (free/vip), `signup_method`, `preferred_language`, `first_series_id`, `coin_balance_bucket`.
- **Where `purchase` is sent from.**
  - Web: send `purchase` from the payment webhook through the Measurement Protocol (`client_id` from the `_ga` cookie, plus `user_id`), with the same `transaction_id` the client uses. Suppress any client-side purchase.
  - Android: rely on the Firebase SDK's automatic `in_app_purchase` (Play-linked).
  - iOS: log `purchase` client-side after RevenueCat confirms the transaction.
  - RevenueCat's Firebase integration is useful for renewals and churn events. It is not a reliable source of Google Ads conversions (per the community reports above).
- **Linking checklist**, all into one GA4 property:
  - GA4 ↔ Google Ads, with auto-tagging and personalised advertising on.
  - Firebase ↔ GA4.
  - Firebase ↔ Google Ads.
  - AdMob ↔ Firebase.
  - GA4 ↔ Search Console (web stream).
  - GA4 ↔ BigQuery (daily export at launch; switch to streaming once above ~1M events/day).
  - Play Console ↔ Google Ads, and Play ↔ Firebase.
  - YouTube channel(s) ↔ Google Ads, so channel viewers can be used as audiences.
- **Cross-domain.** Needed only if checkout leaves `*.thegulel.com`, for example a hosted Razorpay/Cashfree page. In that case add the gateway domain to "unwanted referrals" so purchases are not credited to the gateway.
- **BigQuery.** At micro-drama scale (every episode play plus 3–4 progress events), the 1M/day daily-export cap will likely be hit early. Budget for streaming export.

### Gaps
- I could not open the GA4 event reference. The exact required/optional status of `currency` alongside `value`, and whether `items` is mandatory for `purchase`, is unconfirmed. Believed: `currency` is required whenever `value` is set, and `transaction_id` is required for `purchase`. The `share` recommended params are believed to be `method`, `content_type` and `item_id` (the code currently uses `content_id`).
- The "conversions" → "key events" rename in GA4 (believed March 2024, with Google Ads keeping the word "conversions") is not confirmed by the sources I retrieved.
- The exact GA4 UI paths for cross-domain and unwanted referrals were not retrieved. Believed: Admin → Data streams → Web → Configure tag settings → Configure your domains / List unwanted referrals.
- Play Console ↔ Google Ads and Play ↔ Firebase linking steps were not retrieved (search budget ran out).
- Whether India's amended IT Rules on synthetically generated information apply to GA and consent was not researched.

---

## 2. Google Tag Manager: web container structure, server-side GTM, enhanced conversions

### Takeaway
Keep one web GTM container, driven by `dataLayer`, as the single source of truth. Skip server-side GTM at launch: it costs about US$120/month on Cloud Run plus 10–20 hours to build, and practitioners say it pays off above roughly US$5K/month in ad spend. Instead, send purchases server-side through the GA4 Measurement Protocol, and consider Google tag gateway (the renamed "first-party mode"). Turn on the new unified Enhanced Conversions setting, available since April 2026, for sign-up and purchase.

### Cited Findings
- **Server-side GTM cost.**
  - Cloud Run at Google's three-instance guidance: about US$120/month.
  - Each Cloud Run server (1 vCPU / 0.5 GB, CPU always allocated): about US$45/month.
  - Stape: US$20–200/month depending on volume.
  - Implementation: a basic setup takes 10–20 hours (Cloud Run, first-party DNS, container, GA4 plus Meta CAPI routing).
  - Rule of thumb: above US$5K/month in Meta or Google ad spend, recovering around 10% of lost conversions pays for sGTM.
  - — [TrackingFixes](https://trackingfixes.com/server-side-tracking-cost/); [Ceaksan: sGTM 2026](https://ceaksan.com/en/gtm-server-side-tagging); [Hustle Marketers](https://hustlemarketers.com/server-side-gtm-hosting/); [Google: Cloud Run setup guide](https://developers.google.com/tag-platform/tag-manager/server-side/cloud-run-setup-guide)
- **Google tag gateway** is the renamed "first-party mode". It serves gtag.js and routes Google measurement through your own domain, set up with a single toggle on Cloudflare. It has no tagging server, no event transformation, no consent layer, and covers Google tags only. — [Ceaksan](https://ceaksan.com/en/gtm-server-side-tagging); [Trackingplan](https://www.trackingplan.com/blog/google-tag-gateway-cloudflare)
- **Enhanced conversions, unified.**
  - Since April 2026, Google Ads accepts user-provided data from website tags, Data Manager and the API, and the implementation method no longer has to be chosen.
  - Enhanced conversions for web and for leads are now one on/off setting. Existing users are migrated automatically.
  - The Google tag can collect user-provided data manually (by pointing it at page fields) or automatically ("Collect automatically detected user-provided data").
  - — [Google Ads Help: updates to EC settings](https://support.google.com/google-ads/answer/16884284?hl=en); [ALM Corp](https://almcorp.com/blog/google-unified-enhanced-conversions-settings/); [Google Ads Help: EC for web via Google tag](https://support.google.com/google-ads/answer/13258081?hl=en); [EC via GTM](https://support.google.com/google-ads/answer/13262500?hl=en)
- **Data Manager API migration.** From **15 Jun 2026**, offline conversion imports and enhanced-conversions-for-leads uploads moved to the Data Manager API and are blocked in the Google Ads API. — [ALM Corp](https://almcorp.com/blog/google-unified-enhanced-conversions-settings/); [Google Ads Help: Data Manager with ECL](https://support.google.com/google-ads/answer/15707550)

### Inferences
- **Recommended GTM web container layout**, for the reports writer:
  - **Tags**
    - Google tag `G-XXXX`, on the Initialization – All Pages trigger.
    - Consent Mode default, on the Consent Initialization trigger.
    - GA4 Event tags, one per recommended event and each fed by a dataLayer event:
      - `sign_up`
      - `begin_checkout`
      - `paywall_view`
      - `video_start`, `video_progress`, `video_complete`
      - `earn_virtual_currency`, `spend_virtual_currency`
      - `select_content`
      - `share`, `search`
    - Google Ads: Conversion Linker, plus a Google Ads conversion tag for `sign_up` with user-provided data (email/phone) for Enhanced Conversions. Alternatively, import GA4 key events into Ads. Do not both import and tag the same action as primary.
    - Google Ads remarketing.
    - Meta Pixel. Its `trackCustom` currently lives in [analytics.ts].
  - **Variables**: Data Layer Variables for `ecommerce.items`, `value`, `currency`, `transaction_id`, `series_id`, `episode_number`, `user_tier`.
  - **Triggers**: Custom Event triggers matching the dataLayer event names.
  - **Environments**: separate GTM environments for Vercel Preview and Production, so test traffic stays out of the production property.
- **Why skip sGTM for now.** Gulel on Vercel is not behind Cloudflare by default, so the "one-toggle" Google tag gateway path may not apply. It would need a Cloudflare proxy or a manual gateway setup. Server-to-server Measurement Protocol calls from the payment webhook give most of the durability benefit for purchases at near-zero cost. Revisit sGTM once combined Meta and Google spend passes about ₹4–5 lakh/month (≈US$5K). The rupee figure is my own conversion of the practitioner threshold.
- **Enhanced Conversions for Gulel.** Most Indian sign-ups will be Google-account or phone-OTP. Hash the phone number in E.164 format (+91…), and the email where available, into `user_data` on `sign_up` and `purchase`.

### Gaps
- I found no source on how Google tag gateway works on Vercel without Cloudflare.
- I found no source quantifying conversion recovery from sGTM specifically in India, where Android and Chrome dominate and ad-blocker and ITP losses are lower than in the US or EU.

---

## 3. Google Ads campaign types for app and web (App campaigns ACi/ACe/pre-registration, tCPA/tROAS, web-to-app, Demand Gen, Performance Max, Video reach/views and Shorts, Search), budgets, learning periods, asset specs

### Takeaway
- **Core engine:** App campaigns for installs.
  - Start on Maximize conversions or tCPA on an early in-app event.
  - Move to tROAS once there are enough purchases. Use hybrid-monetisation tROAS, because Gulel earns from both IAP coins/VIP and AdMob rewarded ads.
  - Budget at 50–100× target CPI per day.
  - Assets: 5 headlines (30 chars), 5 descriptions (90 chars), up to 20 images and 20 videos in portrait, square and landscape.
- **Layer on:** Demand Gen with a Shorts-only ad group, for vertical trailers aimed at both web and app.
  - Budget at 15× tCPA per day.
  - It needs 50 conversions and 4–6 weeks to learn.
  - Headlines up to 40 chars, with at least one of 30 chars or fewer; descriptions 90 chars; videos 9:16/1:1/16:9 and at least 10 seconds.
- **Also run:** a brand plus category Search campaign in Hindi and English with AI Max brand controls.
- **Hold back:** App campaigns for engagement (ACe) until the app has 50,000 installs.
- **Android pre-launch:** App campaigns for pre-registration.

### Cited Findings

**App campaigns (ACi / ACe / pre-registration)**
- **Asset limits.** Up to 5 headlines of 30 characters or fewer, up to 5 descriptions of 90 characters or fewer, up to 20 images and 20 videos. Videos must be hosted on YouTube and can be landscape, portrait or square. Images are .jpg/.png, maximum 5 MB. — [Google Ads Help: About assets in App campaigns](https://support.google.com/google-ads/answer/6357595?hl=en); [MegaDigital: App campaign specs 2026](https://megadigital.ai/en/blog/google-app-campaign-specs/); [RocketShip HQ](https://www.rocketshiphq.com/creative-assets-google-app-campaigns/)
- **Budget.** Google recommends a daily budget of at least **50–100× tCPI**; for example, a US$2 tCPI needs US$100–200/day. tROAS campaigns need more budget and more data. There is no universal minimum, so use Google's bid-to-budget recommendations. — [MegaDigital](https://megadigital.ai/en/blog/google-app-campaigns/); [Admiral Media](https://admiral.media/google-app-campaigns-best-practices/); [Google Ads Help: Best practices for App campaigns](https://support.google.com/google-ads/answer/14104492?hl=en); [Google Ads Help: recommended initial tROAS](https://support.google.com/google-ads/answer/15995101?hl=en); [RevenueCat guide](https://www.revenuecat.com/blog/growth/a-practical-guide-to-google-app-campaigns)
- **tROAS for ad revenue (ARO)** optimises for users likely to engage with in-app ads, using `ad_impression`. **tROAS for hybrid monetisation** optimises for combined IAP and ad value. — [Google Ads Help: tROAS for ad revenue](https://support.google.com/google-ads/answer/13799577?hl=en); [AdMob case study: Wave Studio](https://admob.google.com/home/resources/wave-studio-sees-thirty-percent-growth-ad-revenue-admob-troas-feature/)
- **ACe requirements:**
  - At least **50,000 installs**.
  - Universal Links (iOS), App Links (Android) or a custom scheme.
  - An audience list of app users.
  - Conversion tracking through Firebase or an App Attribution Partner.
  - A privacy policy that discloses re-engagement.
  - Google recommends App Links and Universal Links over custom schemes.
  - — [Google Ads Help: Create ACe](https://support.google.com/google-ads/answer/9234102?hl=en); [MegaDigital: ACe](https://megadigital.ai/en/blog/google-app-campaigns-for-engagement/); [Google Ads Help: deep linking strategy for ACe](https://support.google.com/google-ads/answer/16413616?hl=en)
- **App Connect** (web to app):
  - A central Google Ads hub that sends Search and Performance Max traffic into the installed app. Google cites on average **2.8×** higher conversion rates for ad clicks that land in the app rather than the mobile website.
  - At GML 2026, Google announced that Search, Shopping, PMax and Demand Gen can direct to both web and app.
  - — [Google Ads Help: App Connect deep-link strategy](https://support.google.com/google-ads/answer/16401018?hl=en); [WordStream GML 2026](https://www.wordstream.com/blog/google-marketing-live-2026); [Strike Social GML 2026](https://strikesocial.com/blog/google-marketing-live-2026/)
- **App campaigns for pre-registration:**
  - Android phones and tablets only.
  - The APK must be on at least one Play release track.
  - The app must launch within 90 days of opening pre-registration.
  - The app must not already be installable in the targeted country.
  - Child-directed apps are ineligible.
  - Start pre-registration at least 2 weeks before marketing begins; 3–6 weeks is typical, and 9–12 weeks for high-hype launches.
  - — [Google Ads Help: pre-registration](https://support.google.com/google-ads/answer/9441344?hl=en); [Play Console Help: pre-registration](https://support.google.com/googleplay/android-developer/answer/9859047?hl=en); [App Radar](https://appradar.com/academy/google-app-campaign/pre-registration-app-campaigns)
- **iOS measurement.**
  - On-device conversion measurement (ODM) uses the Firebase Analytics SDK and the app's sign-in identity; no PII leaves the device.
  - Reported SDK versions: 11.14.0 (June 2025) is cited as current, but ODM using event data needs 12.12.1+. The source is internally inconsistent; confirm in Firebase docs.
  - SKAdNetwork supplements ODM, including for web-to-app.
  - Integrated conversion measurement (ICM) provides AAP-side cross-network views.
  - — [Firebase: iOS ODM tutorial](https://firebase.google.com/docs/tutorials/ads-ios-on-device-measurement); [Google Ads Help: iOS ODM](https://support.google.com/google-ads/answer/12119136); [GA Help: SKAdNetwork](https://support.google.com/analytics/answer/13168376?hl=en); [Think/Google: iOS three](https://business.google.com/us/accelerate/resources/articles/drive-better-performance-and-measurement-for-ios-app-campaigns/)

**Demand Gen**
- **Inventory:** YouTube (in-stream, in-feed, Shorts), Discover, Gmail and GDN, plus Google Maps since late 2025. — [Store Growers](https://www.storegrowers.com/google-demand-gen-campaigns/); [Google Ads Help: About Demand Gen](https://support.google.com/google-ads/answer/13695777?hl=en)
- **Channel controls** (expanded March 2025) sit at the **ad group** level under "Channels": all channels, Google-owned surfaces only, or manual selection, which includes **YouTube Shorts only**. — [Search Engine Land](https://searchengineland.com/googles-demand-gen-channel-controls-beta-454534); [Google Ads Help: Channel controls](https://support.google.com/google-ads/answer/15973205?hl=en); [La Factory](https://lafactory.com/demand-gen-formats-placements-maps-channel-controls/)
- Video Action Campaigns have been upgraded to Demand Gen. — [Google Ads Help](https://support.google.com/google-ads/answer/15110871?hl=en)
- **Budget and learning.** Daily budget should be 15× tCPA, or 20× (average conversion value ÷ tROAS). The campaign needs at least 50 conversions to learn. Allow 4–6 weeks before judging it. — [Google: Demand Gen performance guide (PDF)](https://services.google.com/fh/files/misc/external_demand_gen_performance_guide.pdf); [Google Ads Help: DG performance guide](https://support.google.com/google-ads/answer/16797388?hl=en); [Search Engine Land](https://searchengineland.com/google-demand-gen-campaigns-migration-and-best-practices-433014)
- **Assets:**
  - Headlines up to **40 chars**, with at least one of 30 chars or fewer.
  - Descriptions up to **90 chars**.
  - Up to **5 YouTube videos** per ad group, each at least **10 seconds**, in 16:9, 1:1 and 9:16.
  - The old 90-char "long headline" field is no longer in the current Demand Gen asset table, although many spec lists still show it.
  - — [SizeIM (Sep 2026)](https://sizeim.com/2026/09/07/performance-max-vs-demand-gen-creative-how-the-asset-requirements-differ/); [AdsCreator DG specs](https://adscreator.ai/blog/demand-gen-ad-specs)
- 9:16 vertical **image** ads now run in Demand Gen, including on Shorts. — [Inceptly](https://inceptly.com/you-can-now-use-916-vertical-image-ads-in-demand-gen-even-on-youtube-shorts/)
- **GML 2026 (Demand Gen):**
  - Creator and partnership videos that feature the brand can be pulled straight into Demand Gen; Google cites about +20% conversion lift from creator assets.
  - Feeds bring about +33% conversions for large catalogues.
  - High-impact Demand Gen ads on Maps.
  - "Campaign type attribution" shows Demand Gen's own contribution.
  - — [WordStream](https://www.wordstream.com/blog/google-marketing-live-2026); [Strike Social](https://strikesocial.com/blog/google-marketing-live-2026/); [Google GML 2026 collection](https://business.google.com/en-all/think/search-and-video/google-marketing-live-2026-collection/)
- Google published an "April 2026 Demand Gen Drop" titled "Convert faster on YouTube". Its contents could not be read. — [blog.google](https://blog.google/products/ads-commerce/demand-gen-drop-april-2026/)

**Video reach / Video views and YouTube Shorts ads**
- **Video reach campaigns** mix bumper, skippable and non-skippable in-stream, in-feed and Shorts ads.
- Efficient-reach and Video view campaigns can run **exclusively on Shorts** if you opt into multi-format ads and select only the YouTube Shorts placement.
- In multi-format campaigns you **cannot pin an individual video asset to Shorts only**; Google optimises delivery across formats.
- — [Darkroom](https://www.darkroomagency.com/observatory/youtube-shorts-ads-guide-setup-specs-and-2025-best-practices); [Google Ads Help: Video reach campaigns](https://support.google.com/google-ads/answer/10581234?hl=en); [Google Ads Help: Shorts ads asset specs](https://support.google.com/google-ads/answer/16041697?hl=en)
- **Shorts ad specs:**
  - Vertical 9:16 at 1080×1920, minimum 720×1280. Vertical outperforms landscape on Shorts.
  - Suggested lengths (practitioner guidance): about 12–20 seconds for views and reach, 15–30 seconds for consideration, 20–45 seconds for direct response.
  - — [Darkroom](https://www.darkroomagency.com/observatory/youtube-shorts-ads-guide-setup-specs-and-2025-best-practices); [Strike Social specs](https://strikesocial.com/blog/youtube-ad-specifications/); [Google Business: Shorts ads](https://business.google.com/us/ad-solutions/youtube-ads/shorts-ads/)

**Search / AI Max**
- **AI Max brand controls:**
  - Brand exclusions and inclusions began upgrading into AI Max from 27 May 2025.
  - From 1 Jun 2026, a native branded-search toggle offers three choices: all relevant searches, brand inclusions/exclusions, or **unbranded searches only**.
  - AI Max and PMax text guidelines opened in all languages and markets from 26 Feb 2026.
  - Term exclusions are language-specific, so a multilingual campaign needs them in each language.
  - — [PPC Land](https://ppc.land/google-ads-gets-branded-search-controls-inside-ai-max/); [PPC News Feed](https://ppcnewsfeed.com/ppc-news/2026-05/branded-searches-control-setting-ai-max/); [Google Ads Help: brand exclusions](https://support.google.com/google-ads/answer/14505308?hl=en-GB); [ALM Corp](https://almcorp.com/blog/google-ai-max-text-guidelines-all-advertisers-2026/)

**Category context (India micro-drama user acquisition)**
- Kuku TV, Story TV and Quick TV have broken into India's top 5 most-downloaded video-streaming apps. — [exchange4media](https://www.exchange4media.com/digital-news/microdrama-apps-break-into-indias-top-streaming-giants-whats-changing-in-ott-153391.html)
- Kuku TV reports 170M+ downloads. JioHotstar was reported to be launching free micro-dramas around IPL 2026. — [Vitrina](https://vitrina.ai/blog/top-micro-drama-series-apps-2026/)
- The Lumikai 2025 report puts India's micro-drama market above US$300M in its first year of scale, with 450M downloads and 100M MAU. — [Storyboard18](https://www.storyboard18.com/media-and-entertainment/microdramas-reshape-indias-digital-entertainment-and-advertising-economy-ws-l-101268.htm); [Vitrina](https://vitrina.ai/blog/top-micro-drama-series-apps-2026/). The search summary blended these sources, so the exact attribution between them is uncertain.
- There are over 700 monthly-active micro-drama app advertisers, +63.61% YoY, and creatives per advertiser are up 144.9% YoY. The competitive edge is creative testing velocity and localisation. — [Business of Apps](https://www.businessofapps.com/insights/from-scale-to-sustainability-how-short-drama-app-marketing-will-be-redefined-in-2026/)
- Kuku FM spent ₹94 crore on marketing in FY23, about 57% of total spend. CAC was around ₹300 against ARPU of about ₹600. — [GrowthX](https://growthx.club/blog/kukufm-business-model)

### Inferences

**Recommended campaign architecture (India, Hindi-first)**

1. **ACi – Android – Hindi/English, India.** This is the main campaign.
   - Goal: installs with in-app action optimisation.
   - Bid: start on Maximize conversions for `first_open` → `sign_up`, or on the `engaged_viewer` proxy.
   - After about 2–4 weeks with steady daily volume, switch to tCPA on `purchase`. Then move to tROAS (hybrid monetisation, IAP plus `ad_impression`).
   - Ad groups: one per series or genre cluster (revenge, romance, family drama, horror). Link each ad group to its matching Play custom store listing (see Section 6).
   - Assets per ad group: 5 × 30-char Hindi/Hinglish headlines, 5 × 90-char descriptions, 10–20 videos (mostly 9:16, plus 1:1 and 16:9 cut-downs), 5+ images, plus HTML5 if available.
2. **ACi – iOS.** Needs the Firebase SDK version that supports event-data ODM, and SKAN conversion values mapped to `sign_up` and `purchase` tiers. Keep iOS as a separate campaign.
3. **Demand Gen – "Shorts-only" ad group.** Vertical 15–45 second episode-1 cliffhanger cuts.
   - Two destinations. (a) App (install) for Android, with a separate iOS campaign. (b) Web series page on thegulel.com, optimising to `sign_up`/`purchase` through GA4 key events plus Enhanced Conversions.
   - Budget at 15× tCPA. Hold changes for 4–6 weeks.
   - A second ad group on "Google-owned channels" (Discover + YouTube in-feed) serves as a comparison test.
4. **Search – Brand**, exact and phrase: Gulel, गुलेल, "gulel app", "thegulel", and series titles.
   - Use AI Max's "control branded searches" option.
   - Sitelinks go to the top series pages.
5. **Search – Category, Hindi plus Hinglish.** Examples: "hindi web series", "short drama hindi", "hindi drama app", "chhoti kahani series", "romantic web series hindi".
   - Use AI Max with text guidelines so the rewritten copy never says "free" without qualifying it (see Section 7).
   - With App Connect on, send users who already have the app into it.
6. **Search – Competitor** (Kuku TV, Story TV, Quick TV, ReelShort, DramaBox, Pocket FM). Keep this in its own campaign with low bids, and do not use competitor names in ad text.
7. **ACe.** Only after 50,000 installs, using App Links / Universal Links for deep links to a series or episode.
8. **Pre-registration (Android).** Run it only if a new app build or new-country launch can be held for 3–6 weeks. Pair it with a Play pre-registration reward, for example 50 bonus coins.

**Budget heuristic.** With an expected India tCPI of roughly ₹15–40 (my estimate; no source found), 50–100× tCPI works out to about ₹750–4,000/day per ACi campaign as a floor. With a ₹150 tCPA, a Demand Gen campaign needs about ₹2,250/day.

**Asset strength.** Fill every text slot. Supply all three video orientations. Refresh the bottom 20–30% of assets every 2–3 weeks. Micro-drama competitors' creative volume is rising about 145% YoY, so creative fatigue is the main constraint.

### Gaps
- **Performance Max asset limits** could not be verified (search budget exhausted). Believed: up to 15 headlines (30 chars), 5 long headlines (90 chars), 5 descriptions (one of them at most 60 chars, others 90), 20 images, 5 videos, logos, and a business name (25 chars). PMax is not recommended as Gulel's primary engine: App campaigns cover app installs, and PMax's web conversions overlap with Demand Gen.
- **RSA limits** were not verified. Believed: 15 headlines of 30 chars, 4 descriptions of 90 chars, 2 paths of 15 chars.
- **Google's "Ad strength" / "asset strength" definitions** for App and Demand Gen were not retrieved.
- **India CPI, CPA and ROAS benchmarks** for micro-drama apps: no reliable public source found.
- **Trademark policy for competitor keywords in India** was not verified. Believed: Google does not restrict trademarked terms as keywords, but restricts them in ad text if the owner files a complaint.
- **Minimum conversions before tCPA/tROAS for App campaigns** (e.g. "10 conversions/day" for tCPA, "10 purchases/day" for tROAS in older guidance) was not confirmed for 2026.
- **The April 2026 Demand Gen Drop** contents could not be read.

---

## 4. YouTube organic: brand and character channels, Shorts strategy, related-video links, playlists, Test & Compare, auto-dubbing, YPP thresholds, synthetic-content disclosure, inauthentic/reused-content risk

### Takeaway
- **Channel setup.** Run the Gulel brand channel and each AI-character channel as Brand Accounts under one Google account (up to 100 channels). Add multiple managers, and turn on 2-Step Verification for every manager, since YPP requires it.
- **Every upload:**
  - Tick the "Altered or synthetic content" box, because the AI characters are photorealistic.
  - Use Shorts' "Related video" (description links in Shorts are not clickable) to push viewers into long-form episode compilations or series playlists.
  - Use Test & Compare (up to 3 title and thumbnail variants, judged on watch time).
- **Biggest monetisation risk.** The July 2025 "inauthentic content" (mass-produced/repetitive) YPP policy. Each episode must show clear human authorship and variation. Channels are judged separately, but they share one AdSense identity.

### Cited Findings
- **Channels and Brand Accounts.**
  - One Google account can hold up to **100 channels**; every channel after the first is a Brand Account.
  - Brand Accounts can have multiple owners and managers.
  - YouTube Studio switches between channels, but analytics stay separate per channel.
  - YPP eligibility is judged per channel and requires 2-Step Verification.
  - A severe violation on one channel can affect every channel tied to the same AdSense identity.
  - — [AIR Media-Tech](https://air.io/en/youtube-hacks/create-multiple-youtube-channels-with-the-same-email-a-step-by-step-guide); [YouTube Help: Manage Brand Account](https://support.google.com/youtube/answer/7001996?hl=en); [ScaleLab](https://scalelab.com/en/guide-to-create-several-youtube-channels-with-the-same-email); [Dicloak](https://dicloak.com/blog-detail/how-many-youtube-channels-i-can-create-with-one-email-and-the-strategy-to-scale-safely-2026)
- **YPP thresholds (2026).**
  - Fan-funding tier: 500 subscribers plus 3 public uploads in 90 days, plus either 3,000 public watch hours in 12 months or **3M public Shorts views in 90 days**.
  - Full ad-revenue tier: 1,000 subscribers plus either 4,000 watch hours in 12 months or **10M qualified Shorts views in 90 days**.
  - Shorts views and long-form watch hours do not combine.
  - 2-Step Verification is required, with no active Community Guidelines strikes.
  - — [AIR Media-Tech](https://air.io/en/monetization/youtube-partner-program-requirements-2026-the-complete-guide); [vidIQ](https://vidiq.com/blog/post/youtube-partner-program-guide/); [Unkoa](https://www.unkoa.com/youtube-shorts-monetization-requirements/)
- **Inauthentic content policy (15 Jul 2025).** YouTube renamed "repetitious content" to "**inauthentic content**" and clarified that it covers repetitive or **mass-produced** content, such as videos made from one template with minimal variation. YouTube said there was "no change" to the **reused content** policy (commentary, clips, compilations, reactions). AI tools are allowed as long as the output has original, human-added value. — [YouTube Help: channel monetization policies](https://support.google.com/youtube/answer/1311392?hl=en); [Fliki](https://fliki.ai/blog/youtube-monetization-policy-2025); [SubSub](https://www.subsub.io/blog/youtube-inauthentic-content-policy-2025); [AIR timeline](https://air.io/en/monetization/youtube-monetization-policy-changes-2026-a-complete-dated-timeline)
- **Altered or synthetic content disclosure.**
  - Introduced March 2024. Creators set it with the "Altered or synthetic content" field or checkbox at upload in YouTube Studio.
  - It is required when content is realistic and could be mistaken for a real person, place or event, including synthetic or cloned voices.
  - The label shows in the description under "How this content was made". Sensitive topics (health, news, elections, finance) get a more prominent label on the player.
  - Sources report the requirements became effective on 21 May 2025, with enforcement from early 2025.
  - — [YouTube Blog: disclosing AI content](https://blog.youtube/news-and-events/disclosing-ai-generated-content/); [PPC Land](https://ppc.land/youtube-introduces-mandatory-disclosure-for-ai-content/); [Minimatters](https://minimatters.com/youtube-altered-or-synthetic-content-disclosure/); [Influencer Marketing Hub](https://influencermarketinghub.com/ai-disclosure-rules/)
- **Related video for Shorts.** After uploading a Short, a creator can add a "related video" link in the Shorts player pointing to a video, Short or live stream. Clickable links in Shorts descriptions and comments were removed from 31 Aug 2023. The clickable surfaces that remain are Related Video, channel-profile links (now up to 14), Green Screen/Remix attribution, the US brand-link pilot and Shopping. — [YouTube Help: Add a related video to Shorts](https://support.google.com/youtube/answer/14075157?hl=en); [YouTube Blog: related-videos traffic guide](https://blog.youtube/creator-and-artist-stories/youtube-related-videos-traffic-guide/); [9to5Google](https://9to5google.com/2023/08/10/youtube-shorts-links-spam/); [Linkboo](https://link.boo/guides/youtube-shorts-link-in-description)
- **Shorts filter in search.** On 8 Jan 2026, YouTube added a Shorts vs long-form filter to search, under the "Type" menu. — [TheStreet](https://www.thestreet.com/entertainment/youtube-add-shorts-filter-users-have-long-wanted)
- **Test & Compare.**
  - Title testing was added on **9 Dec 2025**, alongside thumbnails.
  - Up to **3** variants: thumbnails, titles or title+thumbnail packages.
  - Each test runs up to **2 weeks**. YouTube picks the winner by **watch time**, not CTR.
  - Open to every creator with Advanced Features; YPP is not required.
  - Practitioners suggest about 1,000–5,000 impressions per variant.
  - — [PPC Land](https://ppc.land/youtube-expands-a-b-testing-to-include-titles-alongside-thumbnails/); [Search Engine Journal](https://www.searchenginejournal.com/youtube-title-a-b-testing-rolls-out-globally-to-creators/562571/); [Business Standard](https://www.business-standard.com/technology/tech-news/youtube-now-lets-creators-test-different-titles-and-thumbnails-on-videos-125121000751_1.html); [Gyre](https://gyre.pro/blog/youtubes-new-title-ab-testing-tool-everything-creators-need-to-know)
- **Auto-dubbing.**
  - Launched December 2024 for knowledge channels, with Hindi among the first target languages.
  - On **4 Feb 2026** it was declared "available to everyone", covering **27 languages**. "Expressive Speech" is on in 8 languages, **including Hindi**: English, French, German, Hindi, Indonesian, Italian, Portuguese and Spanish.
  - Lip-sync is still in testing, so dubbed faces visibly mismatch.
  - — [Social Media Today](https://www.socialmediatoday.com/news/youtube-expands-auto-dubbing-to-all-creators/811375/); [OutlierKit](https://outlierkit.com/resources/youtube-auto-dubbing-all-creators-global-growth-2026/); [YouTube Blog: auto dubbing](https://blog.youtube/news-and-events/auto-dubbing-on-youtube/); [sync. labs](https://sync.so/blog/youtube-auto-dubbing)

### Inferences
- **Channel map.**
  - `@Gulel` (brand) holds trailers, episode 1s, and full-series compilations as long-form, organised into **series playlists**, one playlist per show with episodes in order.
  - `@<CharacterName>` channels, one per breakout AI character, post in-character Shorts: POV, reactions to plot twists, "diary" clips, Q&A with comments.
  - Use the same handle pattern on Instagram and X to reserve the names.
- **Shorts to long-form funnel.**
  - Every Short gets a Related Video pointing to the series playlist's episode-1 long-form or a compilation.
  - The channel-profile links (up to 14) carry a thegulel.com/series/… URL with UTMs (`utm_source=youtube&utm_medium=organic_shorts&utm_campaign=<series>`).
  - End screens on long-form link to the app or site through the channel's website link.
- **Disclosure.** Gulel's characters are photorealistic, AI-generated people with synthetic voices, so the "Altered or synthetic content" toggle should be **ON** for every upload. A standard "AI-produced fiction" line in descriptions supports this. Not disclosing risks labels being applied by YouTube and penalties.
- **Avoiding "inauthentic / mass-produced" flags on character channels:**
  - Avoid near-identical templated uploads.
  - Vary scripts, show writer and director credits, and add behind-the-scenes and human commentary.
  - Keep a steady cadence rather than dumping dozens of clips a day.
  - Keep clip-compilation uploads (a reused-content risk) on the brand channel, cut with added narrative and recaps.
  - Monetisation and IP safety matter more than YPP revenue here: YouTube's main value to Gulel is acquisition.
- **Localisation.** Hindi is Expressive-Speech-enabled. Auto-dub Hindi masters into English, Indonesian, Portuguese and Spanish to test demand outside India cheaply. Lip mismatch is less of an issue for over-the-shoulder shots and more of an issue for close-up dialogue.
- **Test & Compare.** Use it on long-form episode-1 and compilation uploads. It judges on watch time, which matches Gulel's "watch episode 1, then hit the paywall" objective.

### Gaps
- Not verified in this session: the Shorts maximum length (believed 3 minutes since Oct 2024), the Shorts ad revenue share (believed 45% to creators), and whether "Related video" can point to other channels' videos. The last one matters for cross-linking character channels to `@Gulel`.
- YouTube's likeness-detection tool and any 2026 rules on AI "virtual creators" or characters were not researched.
- I did not find official YouTube statements on how micro-drama or AI-series channels are assessed under the inauthentic-content policy.

---

## 5. Firebase: Analytics for the app, Dynamic Links deprecation and deep-linking replacements, Google Ads linking, Remote Config and A/B testing for the paywall

### Takeaway
Firebase Dynamic Links has been dead since **25 Aug 2025**: all `page.link` and custom-domain FDL URLs return 404. Use native Android App Links plus iOS Universal Links on thegulel.com for owned links and ACe. Add an MMP with deferred deep linking (AppsFlyer OneLink, Branch, Adjust, Airbridge) if paid UA scales across several networks. Use `@react-native-firebase` (works with Expo) for Analytics and Remote Config/A/B Testing on paywall variables. Link AdMob → Firebase so ad revenue flows into GA4 for hybrid tROAS.

### Cited Findings
- **Firebase Dynamic Links shutdown.** FDL shut down on **25 Aug 2025**. All links on custom domains and `page.link` subdomains stopped working, mostly returning 404, and no new links can be created. — [Firebase FAQ](https://firebase.google.com/support/dynamic-links-faq); [AppsFlyer](https://www.appsflyer.com/blog/mobile-marketing/fdl-deprecation-deep-linking/); [Branch](https://www.branch.io/resources/blog/firebase-dynamic-links-shutting-down/)
- **Recommended replacements** named in these sources: Adjust, Airbridge, AppsFlyer (OneLink), Bitly, Branch, Kochava, Singular. ChottuLink is promoted as a low-cost 1:1 replacement (vendor claim: free tier of 25K MAU). — [Airbridge](https://www.airbridge.io/en/blog/firebase-dynamic-links-alternatives); [AppsFlyer](https://www.appsflyer.com/blog/mobile-marketing/fdl-deprecation-deep-linking/); [ChottuLink (vendor)](https://chottulink.com/blog/firebase-dynamic-links-shut-down-5-best-alternatives-for-2026/)
- **Google Ads deep links.** For ACe and App Connect, Google recommends App Links (Android) and Universal Links (iOS) over custom schemes. — [Google Ads Help: deep links for ACi/ACe](https://support.google.com/google-ads/answer/10024200?hl=en); [Google Ads Help: ACe strategy](https://support.google.com/google-ads/answer/16413616?hl=en)
- **Remote Config and A/B Testing.** Change app behaviour without a release, with built-in A/B and multivariate testing driven by Analytics. On React Native, install `@react-native-firebase/app` plus `@react-native-firebase/remote-config`. React Native Firebase supports Expo. — [React Native Firebase](https://rnfirebase.io/); [Expo docs: feature flags](https://docs.expo.dev/guides/using-feature-flags/); [Level Up Coding](https://levelup.gitconnected.com/a-b-testing-in-react-native-has-never-so-easy-firebase-is-here-67836a35e0d3)
- **RevenueCat Paywalls** are built in a web dashboard, rendered natively, and attached to an "offering", which is an alternative paywall-testing path. — [The React Native Rewind](https://thereactnativerewind.com/issues/react-native-0-87-instant-paywall-a-b-testing-and-buying-mike-hardy-a-beer)
- **AdMob.** AdMob ↔ Firebase linking sends ad revenue to Firebase/GA4 (`ad_impression`). This enables ARO and hybrid tROAS bidding. — [AdMob Help](https://support.google.com/admob/answer/6383165?hl=en); [Firebase: Use Firebase with AdMob](https://firebase.google.com/docs/admob)
- **iOS ODM** uses the Firebase Analytics SDK (see Section 3). — [Firebase ODM tutorial](https://firebase.google.com/docs/tutorials/ads-ios-on-device-measurement/index-first-party)

### Inferences
- **Deep-link stack for Gulel:**
  - (a) Host `/.well-known/assetlinks.json` and `/.well-known/apple-app-site-association` on thegulel.com from Next.js/Vercel.
  - (b) Map `https://thegulel.com/series/<slug>/ep/<n>` to the same route in the Expo app through `expo-router` / linking config.
  - (c) The same URL then works as the web fallback, the Search/Demand Gen final URL and the App Connect/ACe deep link.
  - (d) Add an MMP only when Meta, TikTok and other networks are also bought and deferred deep linking is needed, i.e. landing a new install directly on "episode 2 of the series from the ad". AppsFlyer OneLink and Branch are the common choices; pricing is a gap.
- **Remote Config paywall parameters to A/B test:**
  - `paywall_episode` (2 vs 3)
  - `free_coins_on_signup` (0 / 30 / 60)
  - `coin_pack_order`
  - `vip_price_anchor`
  - `rewarded_ads_per_day_cap`
  - `show_rewarded_option_first` (true/false)
  - Test goal: `purchase` revenue per user, with `sign_up` as the secondary goal.
  - Run it either as Firebase A/B Testing (Analytics-backed) or as RevenueCat Experiments. Do not stack both on the same users.
- **Send `paywall_variant` as an event parameter and user property** so GA4 and BigQuery can break down the whole funnel by variant.
- **Rewarded ads.** Keep SSV as the source of truth for granting coins. Fire `earn_virtual_currency` {source:'rewarded_ad'} only after the SSV callback succeeds, so the GA4 economy matches the ledger.

### Gaps
- Exact Firebase A/B Testing limits (concurrent experiments, maximum variants) were not retrieved.
- Current Firebase console steps for linking Google Ads, and whether `in_app_purchase` auto-logging on iOS needs StoreKit 2 configuration, were not retrieved.
- MMP pricing for India (AppsFlyer, Branch, Adjust) was not researched.

---

## 6. Google Play and Search Console: store listing experiments, custom store listings for ad campaigns, pre-registration, promotional content (LiveOps), acquisition reports, and SEO for series pages

### Takeaway
- **Custom store listings.** Build per-series or per-genre CSLs (up to 50) and target them with "By Google Ads campaign", which links each CSL to App campaign ad group IDs. The store page then matches the trailer the user just saw.
- **Store listing experiments.** Up to 3 variants against control. Run localized experiments in up to 5 languages; Hindi and English are the priority.
- **Promotional content** (formerly LiveOps). Use it for new-series drops and coin sales. Google cites +5% active users and +4% revenue.
- **Web SEO.** Make each episode or trailer page a "watch page" where the video is the main content, add `VideoObject` markup, and monitor Search Console's Video indexing report.

### Cited Findings
- **Custom store listings (CSLs).**
  - Up to **50** per app.
  - Choose "By Google Ads campaign" targeting and enter one or more App campaign **ad group IDs** (comma-separated) in Play Console.
  - Once approved, select the CSL in the Google Ads ad group. Ad clicks from that ad group then land on the CSL instead of the default listing.
  - In 2025 Google added Gemini-assisted CSL text generation and keyword targeting.
  - — [Google Ads Help: Ads-targeted CSLs](https://support.google.com/google-ads/answer/16742242?hl=en); [Phiture](https://phiture.com/asostack/google-play-custom-store-listings/); [Play Console Help: CSLs](https://support.google.com/googleplay/android-developer/answer/9867158?hl=en); [MobileAction](https://www.mobileaction.co/blog/custom-store-listings-on-google-play/)
- **Store listing experiments.**
  - Up to **3 variants** per attribute, compared with the current listing.
  - Per app: **1 default graphics experiment** or up to **5 localized experiments** at once, in up to 5 languages.
  - Testable attributes: icon, feature graphic, screenshots (up to 8), short description and full description.
  - — [MobileAction](https://www.mobileaction.co/blog/google-play-store-listing-experiments/); [Play Console: Store listing experiments](https://play.google.com/console/about/store-listing-experiments/); [App Radar](https://appradar.com/blog/app-ab-testing-with-store-listing-experiments-in-google-play); [Play Console Help](https://support.google.com/googleplay/android-developer/answer/12053285)
- **Promotional content.** LiveOps was renamed **Promotional Content**. It provides self-service Play Store merchandising units for limited-time events, offers and major updates. In the closed beta, participating apps saw on average **+5% active users and +4% revenue**. — [Play Console: Promotional content](https://play.google.com/console/about/programs/promotionalcontent/); [AppTweak](https://www.apptweak.com/en/aso-blog/what-are-google-play-liveops-best-practices-examples); [ShyftUp](https://www.shyftup.com/blog/what-is-google-play-promotional-content/)
- **Pre-registration.** One pre-registration reward is allowed per app lifetime. It must be a one-time (managed) product, and the app must implement reward consumption. Launch timing requirements are in Section 3. — [Play Console Help: pre-registration](https://support.google.com/googleplay/android-developer/answer/9859047?hl=en); [Google Ads Help](https://support.google.com/google-ads/answer/9441344?hl=en)
- **Search Console for series and episode pages.** See Section 1: the watch page must be indexed, the video must be the main content, use `VideoObject`, and check the Video indexing report. — [Google Search Central](https://developers.google.com/search/docs/appearance/structured-data/video); [Coywolf](https://coywolf.com/news/seo/google-made-video-indexing-more-challenging-but-you-can-still-get-indexed-with-these-tips/)

### Inferences
- **CSL plan.** Create one CSL per launch series, covering the top 5–10 series and each with its own screenshots and title card. Also create genre CSLs (Revenge, Romance, Horror, Family) for evergreen ad groups. Link each CSL to the matching ACi ad group IDs. This gives trailer-to-store continuity, which should lift install conversion rate. No Gulel-specific data yet.
- **Experiment backlog** (Hindi and English localized tests):
  1. Screenshot 1: "Ep 1 FREE, then coins" vs a cliffhanger still. Keep payment disclosure accurate (see Section 7).
  2. Icon: character face vs Gulel logomark.
  3. Short description in Hindi vs Hinglish.
- **Promotional content calendar.** Schedule a unit for each series premiere and each festival coin sale (Diwali, Holi, IPL season). JioHotstar's micro-drama push makes IPL windows competitive.
- **Web SEO structure.**
  - `/series/<slug>`: series hub with `TVSeries` or `CreativeWorkSeries` schema, the episode list, and the trailer as the main video (`VideoObject`).
  - `/series/<slug>/ep/<n>`: episode watch page, where episode 1 is indexable and free.
  - Locked episodes should still expose a trailer or preview video plus a text synopsis, so the page stays a legitimate watch page. Do not cloak paywalled content.
  - Hindi (Devanagari) and English titles, with `hreflang` only if separate language URLs exist.
  - Submit a video sitemap. Link GA4 ↔ Search Console.

### Gaps
- Play Console acquisition reports (store listing acquisition, conversion rate by traffic source or country, peer benchmarks) could not be researched in detail: search budget exhausted.
- Promotional content eligibility thresholds were not retrieved; Google historically limited access to eligible developers.
- No source was found on whether Play custom store listings can be keyword-targeted in Hindi.

---

## 7. Policy: Google Ads rules for AI-generated content, mature/horror themes, coins and subscription transparency, India advertiser verification

### Takeaway
Four policy changes directly constrain Gulel's creative.

1. **AI labels (July 2026).** Google Ads now has an AI-label setting and allows in-creative AI labels. EU, **India** and New York rules require AI disclosures on certain ads. Gulel's creative is fully AI-produced, so tick the AI-generated box on every asset and consider an on-video "AI-generated" label.
2. **Misrepresentation: Dishonest Pricing Practices (enforced from 28 Oct 2025).** "Free" claims must be qualified, because episodes after episode 1 need coins, VIP or ads. Any VIP auto-renewal must be disclosed.
3. **Shocking content.** Horror and revenge trailers need gore-free cuts.
4. **Advertiser verification in India.** It is now a multi-step workflow including GST and business-operations checks. Complete it before launch, or ads will stop serving.

### Cited Findings
- **AI labelling (July 2026).**
  - Google introduced an AI label setting across Google Ads, DV360, CM360, Merchant Center and Ads Editor, rolling out gradually through July 2026.
  - It permits text or visual "AI-generated" labels inside image and video creatives without breaching the text-overlay and watermark policies.
  - Google may auto-label assets made with Google's own AI tools. For third-party-tool creative, the advertiser must tick the box.
  - Users see a "How this ad was made" panel in My Ad Center.
  - Google cites AI regulations in the **EU, India and New York** that require disclosures on ads with certain AI-generated or edited assets.
  - — [Google Ads Policy Help: Updates to AI labeling requirements (July 2026)](https://support.google.com/adspolicy/answer/17257106?hl=en); [Search Engine Journal](https://www.searchenginejournal.com/google-ads-requires-disclosure-for-ai-generated-content/581925/); [PPC Land](https://ppc.land/advertisers-face-mandatory-ai-ad-labels-across-googles-five-platforms/); [TechCrunch, 9 Jul 2026](https://techcrunch.com/2026/07/09/google-will-now-disclose-which-ads-are-made-with-ai/); [Google blog: AI transparency labels](https://blog.google/products/ads-commerce/google-ads-ai-transparency-labels/)
  - **Source conflict:** some summaries say Google "permits" labels; others say Google "requires disclosure" of AI voices and deepfake video, with disapproval or suspension risk. The SEJ headline says "requires"; the Google policy page title says "requirements". Both agree the advertiser carries the responsibility, and that Google does not verify the box for third-party tools. — [SEJ](https://www.searchenginejournal.com/google-ads-requires-disclosure-for-ai-generated-content/581925/); [Pink Dog Digital](https://pinkdogdigital.com/google-ads-policy-changes-marketers-prepare/); [Kompozy](https://kompozy.io/guides/google-ads-ai-content-disclosure-requirement)
- **Misrepresentation.** Using AI to manipulate media so as to deceive is not allowed. AI-generated images are reviewed under the same policies as photographed ones. — [Google Ads Policy: Misrepresentation](https://support.google.com/adspolicy/answer/6020955?hl=en); [Novoads](https://novoads.ai/en/blog/google-ads-ai-generated-images-policy)
- **Dishonest pricing practices** (enforced from **28 Oct 2025**):
  - The payment model and the full cost to the user must be disclosed clearly and conspicuously, including recurring subscription costs.
  - Do not advertise something as "free" if payment is needed to use it.
  - Free trials must state the trial length and the auto-renewal amount.
  - — [Google Ads Policy: Dishonest pricing practices](https://support.google.com/adspolicy/answer/15938375); [Search Engine Land](https://searchengineland.com/google-ads-updated-policies-to-target-dishonest-pricing-practices-462555); [Kliken](https://help.kliken.com/en/articles/12401029-google-ads-policy-update-dishonest-pricing-practices-effective-october-2025)
- **Play subscriptions policy** also governs how VIP subscriptions are presented. Not read in detail. — [Play Console Help: Subscriptions](https://support.google.com/googleplay/android-developer/answer/9900533?hl=en)
- **Shocking content.** Ads and destinations with gruesome, graphic or disgusting imagery are disallowed: violence, physical trauma, bodily fluids, violent language. Graphic fight or explosion scenes can be disapproved even when animated. Google gives a warning at least 7 days before any suspension for this policy. — [Google Ads Policy: Shocking content](https://support.google.com/adspolicy/answer/16490051?hl=en-GB); [Google Ads Policy: Inappropriate content](https://support.google.com/adspolicy/answer/6015406?hl=en); [SF Digital](https://www.sfdigital.co.uk/blog/google-ads-disapproved-shocking-content/)
- **Advertiser verification in India.**
  - Google suspended **1.7M** advertiser accounts and blocked **483.7M** ads in India in 2025, and calls advertiser verification a "second layer of defence".
  - A vendor source says that in 2026 verification applies to all advertisers serving in India. It is a multi-task workflow: Advertiser Identity Verification, Business Operations Verification, GST upload, payer confirmation and a business questionnaire. This is a commercial source; confirm in Google Ads.
  - Organisations may need both registration documents and a government photo ID for an authorised representative.
  - False information counts as Circumventing Systems and leads to suspension. Ignoring the verification prompt stops ads from serving.
  - — [Storyboard18](https://www.storyboard18.com/amp/advertising/google-blocks-483-7-million-ads-in-india-suspends-1-7-million-advertiser-accounts-in-2025-95387.htm); [BestMediaInfo](https://bestmediainfo.com/insights/google-blocks-4837-million-ads-suspends-17-million-advertiser-accounts-in-india-in-2025-11735086); [G2 Verification (vendor)](https://g2verification.com/google-ads-advertiser-verification-india/); [Google: Document requirements – India](https://support.google.com/adspolicy/answer/9872280?hl=en&co=GENIE.CountryCode%3DIN); [Google: Advertiser verification](https://support.google.com/adspolicy/answer/9703665?hl=en); [PPC Land](https://ppc.land/google-emphasizes-consequences-for-false-verification-information/)
- **Privacy law.** DPDP dates are in Section 1. Consent Mode v2 is mandatory only for EEA/UK. — [ConsentOS](https://consentos.in/learn/dpdp-compliance-timeline/); [CookieHub](https://www.cookiehub.com/blog/what-is-google-consent-mode-v2)

### Inferences
- **Copy rules for all Google ads and store listings:**
  - Use "Episode 1 free" or "पहला एपिसोड फ़्री", never "Watch free" or "Free app".
  - Add "Unlock more with coins, VIP or ads" in a description or end card.
  - VIP offers must state the price, period and auto-renew, e.g. "₹99/week, auto-renews, cancel anytime".
  - Rewarded ads let Gulel honestly say "watch free with ads", but only if every episode is actually unlockable that way.
- **AI disclosure stack:**
  - (1) Google Ads AI label setting ON for all Gulel creatives.
  - (2) A small "AI-generated" or "AI-निर्मित" corner label in videos. This is now policy-safe and likely needed under India's regulations.
  - (3) The YouTube altered/synthetic toggle on organic uploads.
  - (4) Never make an AI character look like a real celebrity or public figure in ads. That would breach Misrepresentation and impersonation rules.
- **Genre-specific creative guardrails:**
  - Horror, revenge and crime: suggest rather than show; no blood, wounds or gore in the first 3 seconds or the thumbnail.
  - Romance: avoid sexualised thumbnails, as the Sexual content policy restricts reach (not researched in this session).
  - Build a "policy-safe" cut of every trailer.
- **Launch readiness checklist:**
  - Complete Google Ads advertiser verification (organisation: incorporation certificate, GST, authorised-signatory ID, payer details) at least 2–3 weeks before launch.
  - Keep the legal entity name on the Ads account, the Play developer account, the App Store account and the website footer the same, to avoid Business Operations Verification mismatches.

### Gaps
- Google's **Sexual content** policy and its **Entertainment/"mature" content** rules for film and TV-style ads were not researched (search budget exhausted).
- The exact text of India's AI-labelling regulation that Google cites (believed to be MeitY's IT Rules amendments on "synthetically generated information", notified in early 2026) and its specific label size or placement requirements were not verified.
- No official Google source confirms that verification is mandatory for *all* India advertisers in 2026; this comes only from a vendor site.
- Whether Google Ads has special rules for apps selling virtual currency (coins), beyond the dishonest-pricing policy, was not researched.
