# Meta (Facebook / Instagram / WhatsApp / Threads) Marketing Toolchain for Gulel — 2026 Setup & Campaign Playbook

> Research date: 26 Sep 2026. Method note: WebFetch was blocked by the sandbox egress proxy for almost every domain (developers.facebook.com, facebook.com/business, jonloomer.com, ppc.land, revenuecat.com, techcrunch.com). Findings below come from search-result extracts and the pages they summarize. Primary Meta pages are linked where search surfaced them, but I could not open them to confirm wording. Where only secondary blogs back a claim, it is flagged. "Inferences" marked **[prior knowledge]** reflect my pre-2026 knowledge of Ads Manager/Meta docs and were **not re-verified in this session**. Check them in the live UI before use.
>
> **First-hand codebase findings (Gulel repo, 26 Sep 2026):**
> - `src/components/FacebookPixel.tsx` loads the Pixel from `NEXT_PUBLIC_FB_PIXEL_ID` and fires only `fbq('track','PageView')`.
> - `src/lib/analytics.ts` sends **every** event through `fbq('trackCustom', …)`: `episode_view`, `episode_unlock`, `coin_purchase`, `ad_watch`, `sign_up`, `series_view`, `search`, `share`. It never uses standard events and never passes an `eventID`.
> - Grepping `src/` for `analytics.<event>` calls finds **only `analytics.share`** (in `src/components/ShareButton.tsx:24`). The other helpers are defined but never called. In production, Meta is probably receiving only PageView and share.
> - No `_fbp`/`_fbc`/`fbclid` handling exists anywhere in `src/`.
> - Server routes that could host Conversions API calls already exist: `src/app/api/webhooks/razorpay/route.ts`, `src/app/api/webhooks/stripe/route.ts`, `src/app/api/webhooks/revenuecat/route.ts`, `src/app/api/coins/purchase/route.ts`, `src/app/api/coins/ad-reward/route.ts`, `src/app/api/subscriptions/checkout/route.ts` and `src/app/api/auth/otp/verify/route.ts`.

---

## 1. Account structure: Business Portfolio, ad accounts, Pages vs IG professional accounts, verification, domain verification, AEM status, WhatsApp Business Platform + Channels

### Takeaway
Put everything in one Meta Business Portfolio: the Gulel Page and IG account, the character Pages and IG accounts, one or two ad accounts, the Pixel/dataset, the apps and the WhatsApp Business Account. Verify the business and verify thegulel.com by DNS TXT. Aggregated Event Measurement no longer needs manual 8-event setup (removed June 2025), so domain verification now matters mainly for ownership, security and link-editing rights, not event ranking. The character accounts must carry Instagram's new "AI-generated profile" label (announced 31 Aug 2026), or they lose non-follower reach.

### Cited Findings
- **Domain verification:** in Business Manager/portfolio you copy a **DNS TXT record** into the registrar's DNS settings. Propagation is usually minutes but can take up to 72 hours. — [Meta Business Help: Verify your domain](https://en-gb.facebook.com/business/help/321167023127050); [Lightspeed guide](https://x-series-support.lightspeedhq.com/hc/en-us/articles/41589718644891-Verifying-domain-to-sell-and-advertise-on-Facebook-and-Instagram-by-Meta)
- **Business verification** raises spending limits and unlocks advanced features. It needs a business licence, tax registration or incorporation document. It usually takes 1–3 business days, but can stretch to about 2 weeks if the business name doesn't exactly match the documents or the domain is newly registered. — [Izoate 2026 guide](https://www.izoate.com/blog/how-to-verify-your-facebook-business-account-in-2026/); [growwithsakib setup guide](https://growwithsakib.com/how-to-set-up-meta-business-manager/) (secondary)
- **IG account limits per portfolio:** a standard portfolio reportedly caps at **25 Instagram accounts** (a 26th fails) but supports up to 200 Facebook Pages. Every IG account managed through Meta Business Suite must be linked to a Facebook Page. — [Sendwin blog](https://blog.send.win/meta-business-suite-manage-multiple-instagram-accounts-limit-multi-account-management-guide-2026/) (secondary, single source)
- **AEM in 2026:** Meta **removed the 8-event limit and manual event prioritization in June 2025**. The standalone AEM configuration screen is gone and eligible web events are aggregated automatically. You also no longer select a domain when creating an ad. — [Segwise AEM 2026 guide](https://segwise.ai/blog/facebook-aggregated-event-measurement); [Jon Loomer: Meta announces big changes to website conversion campaigns](https://www.jonloomer.com/meta-announces-big-changes-to-website-conversion-campaigns/); [Adviso](https://www.adviso.ca/en/blog/evolution-aggregated-measurement-meta); Meta's own page: [About Meta's Aggregated Event Measurement](https://www.facebook.com/business/help/721422165168355)
- **Offline Conversions API** was permanently discontinued in **May 2025**. All offline conversions now go through the standard Conversions API. — [search extract citing Meta docs / audiencelab](https://audiencelab.ai/blog/facebook-conversions-api-setup-guide) (secondary)
- **Meta Verified for Business (India):** launched July 2024. Plans start at **₹639/month for a single app** and go up to ₹21,000/month for two apps under a 12-month introductory offer, then up to ₹30,000/month at standard rates. There are four plans, bought through the iOS/Android apps, covering Facebook, Instagram and WhatsApp, with single-app or FB+IG bundle options. — [Meta Newsroom, Jul 2024](https://about.fb.com/news/2024/07/launching-meta-verified-subscription-plans-for-businesses-on-instagram-and-facebook-in-india/); [Business Standard](https://www.business-standard.com/technology/tech-news/meta-launches-verified-plans-for-businesses-on-facebook-instagram-in-india-124071700373_1.html); [Indian Startup News](https://indianstartupnews.com/news/meta-launches-meta-verified-for-businesses-in-india-know-the-key-details-6239166)
- **AI character accounts, new rule (31 Aug 2026):** Instagram replaced the "AI creator" label with an **"AI-generated profile"** tag for accounts presenting AI-generated personas. Unlabelled accounts get reduced reach: their posts are kept out of non-followers' Reels and Explore. The rule covers virtual influencers, AI presenters and AI brand hosts. Photo editing, comment improvement and illustrations don't require the label. — [Engadget](https://www.engadget.com/2246914/instagram-will-demote-ai-generated-influencers-if-they-dont-clearly-label-their-account/); [Yahoo Tech](https://tech.yahoo.com/social-media/articles/instagram-done-letting-ai-influencers-174225351.html); [EDMTunes, Sep 2026](https://www.edmtunes.com/2026/09/instagram-cracks-down-on-ai-generated-influencer-accounts/)
- **WhatsApp ad surfaces:** Status ads and Promoted Channels in the **Updates tab** are rolling out globally. Ads appear only in Updates (Status/Channels), never in personal chats. — [Storyboard18](https://www.storyboard18.com/brand-makers/whatsapp-introduces-global-status-ads-promoted-channels-and-new-controls-for-users-in-updates-tab-91018.htm); [WABetaInfo](https://wabetainfo.com/whatsapp-is-rolling-out-promoted-channels-and-status-ads-globally/). One secondary source says the global rollout of Status ads finished in **Dec 2025**, with most countries live by Q1 2026 and some EU markets later. — [Omnichat](https://blog.omnichat.ai/whatsapp-ads/). India rollout was staged, and the placement is not guaranteed live for every account. — [richautomate.in](https://richautomate.in/blog/whatsapp-status-ads-updates-tab-india-2026) (secondary)
- **WhatsApp Business Platform billing:** **per-message pricing since 1 July 2025**. Businesses pay per delivered template by category (marketing, utility, authentication), recipient country and monthly volume. — [Meta for Developers: Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing); [Wati](https://www.wati.io/en/blog/whatsapp-api-pricing-guide/)
- **India rates:** marketing about **₹0.8631 (~$0.010) per delivered message**; utility and authentication about ₹0.115. Marketing messages get no volume tiers. — [myoperator](https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026); [richautomate](https://richautomate.in/blog/meta-whatsapp-per-template-pricing-2026-india-explained) (secondary; confirm on Meta's rate card)
- **Claimed change from 1 Oct 2026:** service and utility messages inside an open 24-hour window become chargeable (previously free). — [EngageLab](https://www.engagelab.com/blog/whatsapp-business-api-pricing). **Single secondary source, unverified. Check Meta's pricing page before budgeting.**
- **Click-to-WhatsApp free entry point:** if a user messages you from a CTWA ad or Page CTA on Android/iOS and you reply within 24 hours, a **72-hour window** opens in which all messages, templates included, are free. If you miss the 24-hour reply, you must send a paid template. — [360dialog](https://360dialog.com/blog/72-hour-click-to-whatsapp-ad-window/); [SleekFlow Help](https://help.sleekflow.io/en_US/whatsapp/understanding-click-to-whatsapp-ads-ctwa-and-the-72-hour-free-window); [DoubleTick](https://learn.doubletick.io/click-to-whatsapp-ctwa/understanding-the-72-hour-free-messaging-window-for-ctwa-leads)

### Inferences
- **Recommended portfolio layout (my recommendation):**
  - **1 Business Portfolio**, "Gulel Media" (legal entity name exactly as on GST/incorporation documents), business-verified.
  - **Ad Account A, "Gulel – Web (INR)":** web funnel and CAPI. **Ad Account B, "Gulel – App (INR)":** app campaigns. Separating them isn't required but keeps reporting and spend limits clean. Set account currency to INR and time zone to Asia/Kolkata at creation. **[prior knowledge]** These cannot be changed later without a new ad account.
  - **1 dataset/Pixel** for thegulel.com, connected to CAPI. Link the iOS and Android apps (registered in Meta for Developers) to the same portfolio.
  - **Pages:** "Gulel" brand Page plus one Page per AI character. Each character IG must be a professional (Creator or Business) account linked to its own Page if it will run ads, Partnership ads or appear in Business Suite. At 25 IG accounts per portfolio, Gulel has room for roughly 20 characters.
  - **WhatsApp Business Account (WABA)** under the same portfolio, via a BSP (Wati, Interakt, Gupshup or AiSensy in India) or Cloud API directly, plus a **WhatsApp Channel** for "new episode drops".
- **Label every AI character account** with "AI-generated profile" from day one. It avoids the reach penalty and matches India's IT Rules 2026 duty to label synthetic content (see Q6).
- **Meta Verified:** buy it for the Gulel brand accounts (FB+IG bundle) mainly for impersonation protection and support access. It is probably not worth it for every character account at launch.
- With manual AEM gone, domain verification is still worth doing for ownership. **[prior knowledge]** It controls who can edit link previews and protects against pixel misuse.

### Gaps
- Could not open Meta's Help Center to confirm the **current** per-portfolio limits (ad accounts, IG accounts). The 25-IG-account figure has one secondary source.
- Couldn't confirm whether the 1 Oct 2026 WhatsApp service-message charge is real.
- Couldn't confirm the exact India launch date for WhatsApp Status ads/Promoted Channels or current eligibility rules (for example, whether a Channel is needed to buy Status ads).

---

## 2. Tracking: Pixel standard vs custom events, CAPI on Next.js, dedup/EMQ, what to hash, App Events/SDK, SKAN/AdAttributionKit, RevenueCat → Meta

### Takeaway
Gulel's current setup (all `trackCustom`, no `eventID`, most events never fired) gives Meta almost nothing to optimize on. Map the funnel to **standard events**:
- ViewContent → episode view
- CompleteRegistration → sign-up
- InitiateCheckout → coin/VIP checkout open
- Purchase (value + INR) → coin pack bought
- Subscribe / StartTrial (with `predicted_ltv`) → VIP

Mirror each one server-side via **CAPI** from the Razorpay, Stripe and RevenueCat webhooks, using a shared `event_id`. On mobile, send subscription and IAP events to Meta from **RevenueCat's Conversions API integration** and install/open events from the Meta SDK (`react-native-fbsdk-next`), without double-logging purchases.

### Cited Findings
- **The 17 standard Pixel events:** AddPaymentInfo, AddToCart, AddToWishlist, CompleteRegistration, Contact, CustomizeProduct, Donate, FindLocation, InitiateCheckout, Lead, Purchase, Schedule, Search, StartTrial, SubmitApplication, Subscribe, ViewContent. — [adsuploader standard events list](https://adsuploader.com/blog/meta-pixel-standard-events); [NYBA](https://www.nyba.ai/blog/meta-pixel-standard-events)
- **StartTrial** takes `value`, `currency` and `predicted_ltv`. **Subscribe** (start of a paid subscription) takes `value`, `currency` and `predicted_ltv`, which enables value optimization. Example: `fbq('track','Subscribe',{value:'0.00',currency:'USD',predicted_ltv:'0.00'})`. Always send `value` + `currency` on revenue events or ROAS reporting and value optimization break. — [adsuploader](https://adsuploader.com/blog/meta-pixel-standard-events); [ceaksan](https://ceaksan.com/en/facebook-pixel-and-events)
- **Deduplication:** send the browser and server copies with an **identical `event_id`** (exact match, including case and whitespace) and matching `event_name`. Meta keeps one if both arrive **within 48 hours**. The fallback is `event_name` + `fbp` or `external_id`. Best practice is to send `event_id`, `external_id` and `fbp` together. — [adsuploader CAPI guide](https://adsuploader.com/blog/meta-conversions-api); [Watsspace](https://watsspace.com/blog/meta-conversions-api-deduplication-event_id/); [Stape](https://stape.io/blog/how-to-set-up-facebook-conversion-api)
- **Event Match Quality (EMQ)** is a 0–10 score per server event in Events Manager. The biggest levers are **hashed email, hashed phone, `fbc`, and IP + user agent sent together**. — [adsuploader](https://adsuploader.com/blog/meta-conversions-api); [dataally](https://www.dataally.ai/blog/how-to-set-up-meta-conversions-api)
- **`fbp`/`fbc` must NOT be hashed**, since hashing breaks matching. `_fbp` is the first-party browser-ID cookie. `fbc` comes from the `fbclid` URL parameter on ad clicks. Send the freshest values because stale cookies lower match quality. — [Meta for Developers: fbp and fbc parameters](https://developers.facebook.com/docs/marketing-api/conversions-api/parameters/fbp-and-fbc); [Watsspace fbc/fbp](https://watsspace.com/blog/meta-conversions-api-fbc-and-fbp-parameters/)
- **Parameter Builder Library:** Meta publishes a client and server library that builds `fbc`/`fbp` and client IP correctly for CAPI. — [Meta for Developers: Parameter Builder Library](https://developers.facebook.com/documentation/ads-commerce/conversions-api/parameter-builder-library) (page title seen in search; contents not fetched)
- **Keep the Pixel alongside CAPI:** a common mistake is going server-only. The Pixel supplies the `fbp`/`fbc` browser signals, so run both and deduplicate. — [Weld](https://weld.app/blog/boost-facebook-conversion-tracking-to-95-with-server-side-tracking-a-step-by-step-guide); [Stape](https://stape.io/blog/how-to-set-up-facebook-conversion-api)
- **RevenueCat → Meta:** you choose **Conversions API or App Events API**, and RevenueCat recommends CAPI for reliability. CAPI can send trial conversions and renewals **even when the app is closed**, which the Meta SDK can't do reliably. You can map RevenueCat events to Meta **standard** event names. Setup uses a Datasource ID for production, an optional sandbox Datasource ID, and a CAPI token. — [RevenueCat Docs: Meta Ads](https://www.revenuecat.com/docs/integrations/attribution/meta-ads); [RevenueCat community: dataset ID + token](https://community.revenuecat.com/third-party-integrations-53/how-to-setup-datasource-id-and-conversions-api-token-for-meta-ads-conversion-api-7139); [RevenueCat community: free-trial setups](https://community.revenuecat.com/third-party-integrations-53/meta-ads-revenuecat-conversion-api-which-setup-correctly-tracks-free-trial-activations-7142)
- **`react-native-fbsdk-next`:**
  - The Expo config plugin accepts `appID`, `clientToken`, `displayName`, `scheme`, `advertiserIDCollectionEnabled`, `autoLogAppEventsEnabled` and `isAutoInitEnabled`.
  - `autoLogAppEventsEnabled` **defaults to false**.
  - `AppEventsLogger.logPurchase()` logs `fb_mobile_purchase`, and `AEMReporterIOS` reports to Apple attribution.

  Sources: [react-native-fbsdk-next README](https://github.com/thebergamo/react-native-fbsdk-next/blob/master/README.md); [npm](https://www.npmjs.com/package/react-native-fbsdk-next)
- **SKAN / AdAttributionKit:** AdAttributionKit (iOS 17.4+) is Apple's successor to SKAN. It adds re-engagement and web-to-app attribution. Reportedly **Meta supports AAK postbacks alongside SKAN in 2026**, and MMPs (AppsFlyer, Singular) report both in parallel. — [adlibrary SKAN 2026](https://adlibrary.com/posts/skadnetwork) (secondary); [AppsFlyer: SKAN & AAK postback copies](https://support.appsflyer.com/hc/en-us/articles/4402320969617-Send-SKAN-and-AdAttributionKit-postback-copies-directly-to-AppsFlyer-iOS-15); [AppsFlyer: SKAN interoperation with Meta ads](https://support.appsflyer.com/hc/en-us/articles/360017095198-SKAdNetwork-SKAN-interoperation-with-Meta-ads)
- **Android attribution:** "Meta install referrer" and engaged-view attribution close Android tracking gaps. — [bir.ch Meta mobile ad tools 2025](https://bir.ch/blog/meta-mobile-ad-tools) (secondary)
- **Attribution-setting deprecations:**
  - **12 Jan 2026:** the **7-day view and 28-day view windows were removed from the Ads Insights API**.
  - **3 Mar 2026:** **click-through was redefined to count only link clicks**. Likes, comments, shares, saves, profile visits and 5-second video views moved to a new **"engage-through" attribution** category (1-day).
  - The default setting is 7-day click + 1-day view.

  Sources: [Jon Loomer: How Meta Ads Attribution Works in 2026](https://www.jonloomer.com/meta-ads-attribution-2026/); [Dataslayer (Jan 2026)](https://www.dataslayer.ai/blog/meta-ads-attribution-window-removed-january-2026); [Dataslayer (engage-through)](https://www.dataslayer.ai/blog/meta-attribution-change-2026-what-engage-through-attribution-is-and-why-your-numbers-look-different); [adsuploader: only link clicks count](https://adsuploader.com/blog/meta-click-attribution)

### Inferences
**Recommended web event map (replace the current `trackCustom` calls):**

| Gulel moment | Meta event | Key params | Where to fire |
|---|---|---|---|
| Land on series/episode page | `PageView` (auto) | — | Pixel |
| Episode 1 starts playing | `ViewContent` | `content_ids:[episode_id]`, `content_type:'product'`, `content_name`, `content_category:series_genre` | Pixel + CAPI |
| Episode 1 completed / reached paywall on Ep 2 | custom `PaywallHit` (or keep `episode_view` custom) → build a Custom Conversion | `series_id`, `episode_number` | Pixel + CAPI |
| OTP sign-up success | `CompleteRegistration` | `status:true`, `method:'phone_otp'` | Pixel + CAPI from `src/app/api/auth/otp/verify/route.ts` |
| Coin pack / VIP checkout opened (Razorpay order created) | `InitiateCheckout` | `value`, `currency:'INR'`, `content_ids:[package_id]`, `num_items:1` | Pixel + CAPI from `src/app/api/coins/razorpay/order/route.ts` |
| Coin pack paid (Razorpay/Stripe webhook success) | `Purchase` | `value` (INR actually paid, net of discount), `currency:'INR'`, `content_ids`, `content_type:'product'`, `order_id` | **CAPI from the webhook** + Pixel on the success page, same `event_id` = payment/order ID |
| VIP subscription started | `Subscribe` | `value`, `currency:'INR'`, `predicted_ltv` | CAPI (webhook) + Pixel |
| Free-trial VIP (if offered) | `StartTrial` | `value:0`, `currency:'INR'`, `predicted_ltv` | CAPI + Pixel |
| Episode unlocked with coins | custom `EpisodeUnlock` | `episode_id`, `coins_spent` | Pixel + CAPI (a strong mid-funnel signal for later custom conversions) |
| Rewarded ad watched | custom `RewardedAdWatched` | — | Pixel + CAPI from `src/app/api/coins/ad-reward/route.ts` |

- **Why standard events:** campaign optimization dropdowns and value optimization are built around standard events. Custom events can only be optimized through Custom Conversions. **[prior knowledge]**
- **CAPI on Next.js/Vercel (my recommendation):**
  1. Create a server helper (for example `src/lib/meta-capi.ts`) that POSTs to `https://graph.facebook.com/v{latest}/{PIXEL_ID}/events?access_token=…`. Include `data: [{ event_name, event_time, event_id, action_source:'website', event_source_url, user_data, custom_data }]`, plus `test_event_code` in staging.
  2. `user_data`: SHA-256 hash of lowercase, trimmed `em`; `ph` as digits with country code (e.g. `91XXXXXXXXXX`); and `external_id` (the Gulel user ID, hashed). Send **unhashed** `client_ip_address`, `client_user_agent`, `fbp` and `fbc`.
  3. Capture `_fbp` and `_fbc` cookies (or build `fbc` from `fbclid` on landing) and store them on the user or order record at sign-up and checkout, so the Razorpay, Stripe and RevenueCat webhooks can include them. Webhooks have no browser cookies.
  4. Generate `event_id` once, client-side or from the order ID. Pass it to `fbq('track', 'Purchase', {...}, {eventID})` and to the server event.
  5. Since phone OTP is the sign-up method, `ph` will be the strongest match key. Also collect email where possible.
- **CAPI Gateway / Signals Gateway:** these are hosted options (Meta-managed or via partners like Stape) for teams that don't want to write code. For a Next.js team, direct CAPI from the existing webhook routes is simpler and cheaper. **[prior knowledge]** I could not confirm 2026 naming or pricing.
- **Mobile setup (recommended):**
  - Install `react-native-fbsdk-next` with the Expo config plugin. Keep `autoLogAppEventsEnabled:false` so the SDK doesn't auto-log IAP and double-count against RevenueCat.
  - Use the SDK for installs/activations (`fb_mobile_activate_app`), `fb_mobile_complete_registration` and `fb_mobile_content_view`.
  - Let **RevenueCat → Meta CAPI** send `Purchase`/`Subscribe`/`StartTrial` with value.
  - Pass the Meta anonymous ID and ad IDs to RevenueCat as subscriber attributes (RevenueCat's docs list the required attributes). **[prior knowledge]**
- **iOS ATT:** request ATT consent before initializing the Meta SDK. Advantage+ app campaigns on iOS rely on SKAN/AAK plus Meta's AEM for apps. **[prior knowledge]** Details are unverified for 2026.
- **Reporting:** with view-through windows gone from the API and engage-through split out, compare Meta-reported Purchases against Razorpay/Stripe/RevenueCat revenue weekly, and use the 7-day click column as the working source of truth.

### Gaps
- Couldn't open Meta's customer-information-parameters doc (blocked) to quote the full normalization table. Normalization rules above come from **[prior knowledge]** and secondary guides.
- Couldn't confirm RevenueCat's default event-name mapping table or required subscriber attributes (docs blocked).
- Couldn't confirm Meta's official 2026 AdAttributionKit support statement or the current state of "AEM for iOS apps".
- No source on Meta "web-to-app" campaign options (for example sending web ads to app deep links) that apply to Gulel's hybrid web/app funnel.

---

## 3. Campaign types for 2026: unified Advantage+ (sales/app/leads), Reels/Stories, Threads, WhatsApp CTWA/Status, video views → ThruPlay retargeting, Partnership ads + Creator Marketplace India, gen-AI creative, Flexible format, dynamic creative

### Takeaway
In 2026 every Sales, App Promotion and Leads campaign defaults to the **unified Advantage+** structure: Advantage+ budget, audience and placements all on. The legacy ASC/AAC APIs are deprecated, with all new campaigns unified by about May 2026. Threads ads went global in Jan 2026, with video and carousel formats global from Jul 2026. WhatsApp Status ads and Promoted Channels are live in the Updates tab. Creator Marketplace went worldwide in Jan 2026 (India included). Partnership ads are the enforced format for any creator-made branded content. Meta's March 2026 gen-AI update added **AI dubbing, reportedly including Hindi**.

### Cited Findings
- **Unified Advantage+ timeline:**
  - Marketing API **v24.0 (Sep–Oct 2025)** blocked creating or updating ASC/AAC campaigns on the new version.
  - **v25.0 (Q1 2026)** blocked ASC/AAC creation on **all** versions.
  - Existing ASC/AAC campaigns keep running, but editing them in the new Ads Manager can auto-convert them.

  Sources: [ppc.land: Meta deprecates legacy campaign APIs](https://ppc.land/meta-deprecates-legacy-campaign-apis-for-advantage-structure/); [ppc.land: unified API structure](https://ppc.land/meta-launches-unified-api-structure-for-advantage-campaigns/); [Dancing Chicken](https://dancingchicken.com/post/meta-ads-api-deprecation-notices-what-to-know)
- **Claimed deadline:** "By **May 19, 2026** all new campaigns must use the unified Advantage+ framework." — [AdManage Meta Ads Updates 2026](https://admanage.ai/blog/meta-ads-update); [Aimerce](https://www.aimerce.ai/blogs/meta-is-retiring-legacy-campaign-types-in-2026-asc-and-aac-deprecation) (secondary; exact date not confirmed on a Meta page)
- **Three automation levers:** **Advantage+ campaign budget, Advantage+ audience and Advantage+ placements**. Sales, App and Leads campaigns now default to this setup. — [ppc.land](https://ppc.land/meta-launches-unified-api-structure-for-advantage-campaigns/); [Search Engine Land: Meta simplifies Advantage+ setup, adds leads](https://searchengineland.com/meta-advantage-campaign-setup-leads-campaigns-451713); [Meta Blueprint course: Advantage+ Sales Campaigns](https://www.facebookblueprint.com/student/path/253126)
- **Advantage+ app campaigns:** described by Meta at [Meta for Business: Advantage+ App Campaigns](https://www.facebook.com/business/ads/meta-advantage-plus/app-campaigns) and [About Advantage+ App Campaigns](https://www.facebook.com/business/help/309994246788275). They use Meta AI for bidding, audiences and placements.
- **Threads ads:**
  - Global rollout to eligible advertisers began the **week of 26 Jan 2026**. — [CNBC, 21 Jan 2026](https://www.cnbc.com/2026/01/21/meta-ads-global-threads.html); [TechCrunch](https://techcrunch.com/2026/01/21/threads-rolls-out-ads-to-all-users-worldwide); [Search Engine Land](https://searchengineland.com/meta-expands-threads-ads-to-all-users-globally-467786)
  - **Carousel and video ads went global in July 2026**. Formats are image, video, carousel, Advantage+ catalog and **app ads**, with 4:5 recommended.
  - Threads has 400M+ MAU.

  Sources for formats: [Metricool](https://metricool.com/threads-ads/); [Postory](https://postory.io/blog/meta-threads-ads); [ALM Corp](https://almcorp.com/blog/meta-threads-ads-global-expansion-complete-guide-advertisers-2026/)
- **WhatsApp ad formats in 2026:**
  - Status ads (Updates tab)
  - Promoted Channels
  - Click-to-WhatsApp ads (FB/IG → WhatsApp chat)
  - Status click-to-chat hybrids

  Sources: [Omnichat](https://blog.omnichat.ai/whatsapp-ads/); [helo.ai Status ads playbook](https://helo.ai/resources/blog/whatsapp-status-ads); [Enrich Labs](https://www.enrichlabs.ai/blog/whatsapp-advertising-complete-guide-2026)
- **Creator Marketplace / Partnership ads:**
  - At the **end of Jan 2026 Meta removed the country restriction** and Creator Marketplace is available to businesses worldwide.
  - Eligibility was expanded to **Professional Mode** profiles.
  - "Partnership ads" is the current name for what were branded content ads.

  Sources: [Storika Creator Marketplace guide 2026](https://www.storika.ai/guides/instagram-creator-marketplace); [JKS Digital (India)](https://jksdigital.in/instagram-creator-marketplace-2026/) (secondary). Meta's eligibility page: [Instagram Help: eligibility for partnership ads and branded content](https://help.instagram.com/1372533836927082)
- **Partnership ads as a requirement (2026):** multiple sources say that across **Mar–May 2026** Meta required creator content promoting a brand (paid, gifted or affiliate) to run as **Partnership Ads**. They say UGC-style ads that simulate organic creator posts without the designation are treated as "Deceptive Practice", and that whitelisting consent must be re-verified within 90 days. Industry sources **disagree on whether this is formal published policy or observed enforcement**. — [ContentGrip](https://www.contentgrip.com/meta-branded-content-rules-update/); [Cohley](https://www.cohley.com/blog/meta-partnership-ads-requirements); [Skale Strategy](https://www.skalestrategy.com/blog/meta-partnership-ads-mandatory)
- **Gen-AI creative (March 2026):** Advantage+ creative gained **AI dubbing, AI-generated music in the video generation tool, image-to-video, and persona-based images**. — [Marketing Dive: new business agent & creative tools](https://www.marketingdive.com/news/meta-streamlines-ai-use-brands-new-business-agent-creative-tools/801763/); [digitalapplied March 2026 recap](https://www.digitalapplied.com/blog/meta-advantage-plus-march-2026-ai-dubbing-music-persona)
- **Dubbing languages and adoption:** a secondary source says dubbing supports English, Spanish, **Hindi**, Portuguese, **Bengali, Tamil** and more, with voice replication and lip-sync. It also claims more than 4 million advertisers use Meta gen-AI ad tools. — [digitalapplied](https://www.digitalapplied.com/blog/meta-ai-automated-ads-2026-marketing-guide) (secondary; the "18% higher engagement" and "2.3B variants" figures there are unverified and should not be used)
- **Instagram live video ads** (ads linking to a live broadcast with product tabs) are reported for 2026. — [digitalapplied live video ads](https://www.digitalapplied.com/blog/meta-live-video-ads-instagram-live-shopping-playbook-2026) (secondary)

### Inferences
**Campaign stack for Gulel (my recommendation):**

1. **Web Sales campaign (Advantage+ sales)** to thegulel.com episode landing pages.
   - Conversion location: Website. Performance goal: maximize number of conversions.
   - Start on `CompleteRegistration`, then move to `Purchase` once volume allows (see Q4).
   - Advantage+ placements on; Advantage+ audience on with no suggestions, or a light age suggestion (18–44).
   - Country: India. Languages: leave open (Hindi-speaking users often have English UI).
2. **App campaign (Advantage+ app)**, one per OS, once the apps are live.
   - Optimize for app events (`fb_mobile_complete_registration`, then Purchase via RevenueCat CAPI) rather than installs, as soon as volume allows.
   - India is Android-dominant, so start with Android.
3. **Video Views / Awareness "trailer" campaign**, optional and small.
   - Goal: **ThruPlay**, with 30–60s cliffhanger cuts on Reels and Stories.
   - Feeds the retargeting pool: people who watched 50%/75%/95% of the video, engaged with IG/FB, or opened the Gulel WhatsApp Channel.
4. **Retargeting** in a separate ad set or campaign **only if** the budget supports it (see Q4). Otherwise let Advantage+ handle it.
5. **Click-to-WhatsApp and Promoted Channel**, as a test.
   - CTWA ad → WhatsApp bot that sends the Episode 1 link and a coin offer; the 72-hour window is free.
   - Promote the Gulel WhatsApp Channel for daily episode drops.
6. **Threads** in Advantage+ placements by default. No standalone Threads campaign until data shows it pulling (the audience skews text-first).
7. **Partnership ads** with Indian creators (via Creator Marketplace) reacting to or recapping Gulel episodes, and with Gulel's own AI character accounts as the "creator" identity. Character-account posts boosted as Partnership ads from the brand ad account keep social proof on the character handle.

**Formats and tools [prior knowledge]:**
- Use **9:16 video** (Reels, Stories, Status) as the primary format, with 4:5 variants for Feed and Threads.
- The **Flexible ad format** lets you upload up to 10 images/videos in one ad and have Meta choose the format per placement. It fits the "many hooks per episode" style.
- **Dynamic creative** is an ad set-level toggle, largely superseded by Flexible format and Advantage+ creative inside Advantage+ campaigns.
- **Advantage+ creative "enhancements"** (text improvements, music, image expansion, video generation, translation/dubbing) should be switched on selectively, and **reviewed**, because auto-edits can clash with Hindi copy or distort AI-character faces.
- AI dubbing makes regional-language versions (Hindi → Bengali, Tamil, Telugu, Marathi) of the same trailer cheap to test. Validate quality before scaling.

### Gaps
- Couldn't confirm official Meta minimum budget rules for Advantage+ app campaigns in India, or whether Advantage+ app campaigns can optimize for web-to-app events.
- No primary Meta source on the exact AI-dubbing language list or availability in India's Ads Manager.
- No primary source on Threads app-install ads eligibility in India specifically.
- Couldn't verify the "May 19, 2026" deadline on a Meta page.

---

## 4. Optimization strategy for a low-budget India launch: starting objective, learning phase, budgets, bid strategies, number of ads/ad sets, creative testing, audiences

### Takeaway
The learning phase still needs about **50 optimization events per ad set in 7 days**, and reportedly runs 7–14 days after Andromeda changes. A low-budget Indian launch can't reach 50 Purchases a week per ad set, so start optimizing for a **higher-frequency proxy** (CompleteRegistration after the Ep 2 paywall, or a Custom Conversion such as `EpisodeUnlock`) in **one consolidated Advantage+ sales campaign** with broad targeting and 8–15 **conceptually distinct** creatives. Shift to Purchase once there are 50+ per week. Use a small ABO/3:2:2 test lane for new hooks.

### Cited Findings
- **Learning phase:** about **50 optimization events per ad set in a rolling 7-day window**. One source says Andromeda's **April 2026** update stretched typical learning from 4–7 days to **7–14 days** for many accounts. — [growwithsakib learning phase guide](https://growwithsakib.com/meta-ads-learning-phase/); [Chatterbuzz Andromeda](https://www.chatterbuzzmedia.com/blog/meta-andromeda-creative-targeting/) (secondary; the April 2026 claim is single-source)
- **Andromeda and creative diversity:** what matters is **creative diversity, not raw count**. **8–12 structurally distinct ads** can be enough. Common advice is **10–15 conceptually distinct assets** per Advantage+ campaign, or 15–25 mixed formats (short and long video, carousel, static, UGC-style) when seeding consolidated ad sets. — [Segwise Andromeda playbook](https://segwise.ai/blog/meta-andromeda-update-creative-strategy-2026); [Jetfuel](https://jetfuel.agency/metas-2026-algorithm-update-what-andromeda-changed-and-how-to-adapt-your-ads/); [Logical Position 2026 playbook](https://www.logicalposition.com/blog/the-2026-paid-social-playbook)
- **3:2:2 method:** a dynamic creative test with **3 creatives × 2 primary texts × 2 headlines = 12 combinations**. The 3 creatives are often one video body with 3 hooks. Run it under **ABO** for 7–14 days, then move the winner's **Post ID** into the CBO/Advantage+ scaling campaign. — [adsmanagement.co 3:2:2](https://www.adsmanagement.co/blog/meta-ads-testing-methodology-the-3-2-2-creative-testing-method); [ROASPIG](https://roaspig.com/blog/3-2-2-campaign-structure/); [AdManage testing framework](https://admanage.ai/blog/facebook-ad-creative-testing-framework)
- **Foxwell Digital 2026:** about 8–10 new concepts and 40–50 new assets per month at $100K+/month spend, but only **4–5 new assets per month at about $5K/month**. — [Foxwell: How to test creatives on Meta in 2026](https://www.foxwelldigital.com/blog/how-to-test-creatives-on-meta-in-2026-the-ultimate-guide-for-brands-and-media-buyers)
- **Detailed targeting exclusions were removed on 31 Mar 2025** (Ads Manager) and **June 2025** (boosted posts). Meta cited a **22.6% lower median cost per conversion** without exclusions. Exclude existing customers with **custom audience exclusions** in Audience Controls. — [Online Optimism](https://onlineoptimism.com/blog/detailed-targeting-exclusions-in-meta-ad-campaigns/); [Pixel Movers](https://pixelmovers.co/blog/meta-detailed-targeting-removed-what-works-2026); [Conversios](https://www.conversios.io/blog/meta-advantage-audience-vs-detailed-targeting-2026-guide/)
- **Advantage+ audience:** age, gender, interests, custom audiences and lookalikes are **suggestions the system can go beyond**. — [Linear Design](https://lineardesign.com/blog/metas-advantage-audience/); [adsuploader audience targeting 2026](https://adsuploader.com/blog/meta-audience-targeting)
- **India cost benchmarks (secondary, wide ranges):**
  - Technical minimum daily budget about **₹87–100/day**. Practitioners suggest ₹200–1,000/day and advise against conversion campaigns under ₹500/day. — [Techeasify](https://techeasify.com/minimum-budget-for-facebook-ads-in-india/); [upgrowth](https://upgrowth.in/facebook-advertising-pricing/)
  - India CPM by objective: awareness ₹20–35, traffic ₹35–60, leads ₹60–120, conversions ₹80–150. Other sources quote CPM ₹85–220.
  - Festive season (Oct–Nov) CPMs run **30–50% higher**.

  Sources: [VGraple](https://www.vgraple.com/blog/facebook-ads-cost-india-2026/); [Infinite Option](https://infiniteoption.com/blog/facebook-ads-cost-india-2026); [Mark 42](https://mark42.com/blog/meta-ads-cost-budget-guide). The benchmarks disagree, so treat them as rough.
- **Micro-drama category context (India):**
  - Short-drama app downloads rose **403%** as India app revenue hit $300M in Q1 2026.
  - Kuku TV has about **37M MAU and 5M+ paying subscribers**.
  - **FreeReels grew downloads 520% QoQ, "driven by aggressive digital advertising primarily on Meta platforms"**.
  - Ad-funded free Hindi micro-drama apps (FreeReels, FreeDrama, Viralo/Rigi TV) have **140M+ downloads**.

  Sources: [Vitrina micro-drama distribution 2026](https://vitrina.ai/blog/micro-drama-distribution-platforms-2026/); [Streaming Radar micro-drama apps](https://lens.streaming-radar.com/micro-drama-apps); [Vertical Haus trends Jun 2026](https://verticalhaus.ai/blog/micro-drama-trends-june-19-2026) (secondary aggregators; the report writer should attribute them as such)

### Inferences
**Launch plan (my recommendation, 4–6 weeks):**

1. **Weeks 0–1: data plumbing first.** Fix the Pixel (standard events + `eventID`), ship CAPI, verify in Events Manager Test Events, and aim for EMQ ≥ 6 on Purchase and CompleteRegistration.
2. **Starting objective: Sales (website).**
   - Optimize for **CompleteRegistration**, which sits right after the Ep 2 paywall and happens far more often than Purchase. If sign-ups also exceed 50/week, test a **Custom Conversion on `EpisodeUnlock` or `Purchase`**.
   - Avoid Traffic/Landing Page Views as the main objective. It finds clickers, not payers. At most, use it for a few days to seed the pixel.
   - Avoid App Installs as the event, for the same reason. Use app-event optimization.
3. **Budget arithmetic.**
   - Required daily budget ≈ (50 ÷ 7) × expected cost per event ≈ **7 × CPA**.
   - Example: at a ₹60 cost per registration, one ad set needs about ₹430/day. At a ₹400 cost per purchase, it needs about ₹2,900/day.
   - This math is why Gulel should start on registration and use **one** campaign with **one** ad set.
4. **Bid strategy:** start on **Highest volume (lowest cost)** with no cap. Once CPA is stable, try **Cost per result goal (cost cap)** around the observed CPA. Use **ROAS goal** only after enough Purchase volume with values; RevenueCat and CAPI `predicted_ltv`/value make that possible later. **[prior knowledge on UI names]**
5. **Structure:**
   - One Advantage+ sales campaign for scale: 1 ad set, broad India, 18+, Advantage+ audience on, 8–15 distinct concepts. Mix hook styles: cliffhanger opener, "POV" text-on-screen, AI-character talking head, twist reveal, comment-reply style, and regional-dub variants.
   - One small ABO "test lane" at about 20–30% of budget running 3:2:2 tests. Graduate winners by Post ID so social proof is kept.
6. **Audiences:**
   - Rely on broad targeting plus creative. Build custom audiences for exclusion and signals: purchasers (exclude from acquisition), registrants, ThruPlay/50% video viewers, IG/FB engagers of the brand and character accounts, WhatsApp Channel followers.
   - Seed 1–3% lookalikes of purchasers and paying VIPs as Advantage+ audience **suggestions**, not hard targeting.
7. **Creative cadence:** at Gulel's likely spend (≈ $1–5K/month), Foxwell's 4–5 new assets per month is the floor. AI production makes 10–20 hooks per month cheap, so the constraint becomes distinctness, not volume.
8. **Timing:** Diwali/festive CPM inflation (Oct–Nov) argues for learning at lower CPMs in late Sep–early Oct, then scaling on proven creatives.

### Gaps
- Couldn't find a primary Meta statement on 2026 learning-phase thresholds or any change to "50 events".
- Couldn't find public India OTT or micro-drama Meta case studies (Kuku, Pocket FM, ZEE5, etc.) with CPI, CPA or ROAS numbers. None surfaced.
- Meta's official minimum daily budget in INR per optimization goal wasn't verifiable. The ₹87–100 figure comes from a blog.

---

## 5. Meta Business Suite / creator tools: scheduling multiple accounts, IG insights, Trial Reels, Broadcast channels, collab posts, Ad Library for competitor research

### Takeaway
Meta Business Suite (Planner) is free and can schedule IG and FB posts, Reels and **Stories** from desktop across all linked accounts, up to 25 posts per day and 30 days ahead per account. Use **Trial Reels** to test cliffhanger clips on non-followers without hurting follower feeds, **Broadcast channels** on the brand and hero-character IG accounts for drop alerts, and **collab posts** between the brand and character accounts to pool reach. Use the Meta Ad Library to reverse-engineer competitors' creative.

### Cited Findings
- **Meta Business Suite Planner:**
  - Visual calendar with desktop scheduling and **Story scheduling**, free on web and mobile.
  - Scheduled posts can be edited until they publish.
  - Limits: **25 scheduled posts/day, 30 days in advance**.
  - You pick the target IG account per post.

  Sources: [SocialBee 2026](https://socialbee.com/blog/how-to-schedule-instagram-posts/); [PostFaster](https://postfaster.app/articles/meta-business-suite-instagram-scheduling); [herocontent](https://herocontent.ai/en/blog/schedule-instagram-posts-meta-business-suite) (secondary)
- **Trial Reels** show a Reel to **non-followers first** so creators can test what performs. — [Instagram for Creators: Trial reels](https://creators.instagram.com/blog/instagram-trial-reels)
- **Broadcast channels** give brands a direct line to followers outside the feed and support product tagging. — [JoinBrands Instagram 2026](https://joinbrands.com/blog/instagram-shop-2026/); [EmbedSocial new IG features 2026](https://embedsocial.com/blog/new-instagram-features-2026/) (secondary)
- **Affiliate product tagging** now covers 22 countries, with **Flipkart as an Indian affiliate marketplace partner**. This is not directly relevant to Gulel but signals India commerce features are live. — [Storika](https://www.storika.ai/guides/instagram-creator-marketplace) / search extract (secondary)
- **Unoriginal content crackdown (July 2025):** Meta demotes reach and restricts monetization for accounts that repost others' content without meaningful transformation, including low-effort AI clips. It says it sanctioned about 500K accounts for spammy behaviour in 2025. Transformative edits, reactions and original AI-assisted content are fine. — [TechCrunch, 14 Jul 2025](https://techcrunch.com/2025/07/14/following-youtube-meta-announces-crackdown-on-unoriginal-facebook-content); [Business Standard](https://www.business-standard.com/technology/tech-news/after-youtube-meta-tightens-rules-against-unoriginal-content-facebook-125071500692_1.html); [Tubefilter](https://www.tubefilter.com/2025/07/15/ai-slop-unoriginal-repetitive-content-monetization-facebook-meta/)

### Inferences
**Organic operating model (my recommendation):**
- Brand account posts series trailers and episode clips.
- Each AI character account posts in-character "POV", reactions and behind-the-scenes content, all labelled "AI-generated profile".
- Cross-post as **collab posts** (brand + character) so one Reel counts on both grids.
- Run new hooks as **Trial Reels** first. Winners go to the main grid and become paid ads (by Post ID, to keep social proof).
- **The same clip across ~20 character accounts risks "unoriginal content" demotion.** Make each account's cut distinct: character-specific voiceover or text and different framing.

**Ad Library [prior knowledge]:**
- URL: `https://www.facebook.com/ads/library/`. Set country to India, Ad category to "All ads", and search advertiser names (Kuku TV, ReelShort, DramaBox, ShortMax, FreeReels, Stage, Pocket FM, Story TV).
- Filter by media type = video and active status. Long-running ads (30+ days live) usually mean winners.
- Outside the EU and political ads, the Library shows creative and run dates but **no spend or reach** for Indian commercial ads.

**Tooling:** Business Suite for scheduling. Add a third-party tool (Buffer, Later, Metricool, SocialBee) only if you need more than 25 IG accounts or cross-platform (YouTube Shorts) scheduling.

### Gaps
- Couldn't confirm 2026 Broadcast channel eligibility rules, or whether Meta Business Suite is being folded into a new "Meta Business" app. Search surfaced nothing definitive.
- Couldn't confirm Trial Reels availability on Business (vs Creator) accounts or scheduling support for Trial Reels.
- No primary source for current Ad Library features in India. The notes above are **[prior knowledge]**.

---

## 6. Policy risks: AI-generated content disclosure, unoriginal content, horror/violence/romance/mature themes, paywall/coins disclosure, India-specific rules

### Takeaway
Gulel faces risk on four fronts:
1. **Adult/sexually suggestive and violent/shocking imagery** in romance and revenge micro-drama hooks, which is the most common rejection trigger for this category.
2. **AI disclosure.** Meta auto-applies "AI info" labels, sources conflict on whether self-disclosure is now mandatory for commercial ads, and **India's IT Amendment Rules 2026 (effective 20 Feb 2026) require prominent labelling of synthetic content**.
3. **Creator/UGC-style ads** must run as Partnership ads.
4. **Clear pricing.** "Free" claims must not hide the Ep 2 paywall or coin costs (a misleading-claims risk).

### Cited Findings
- **Adult content in ads:** ads must not contain adult nudity or sexual activity, including sexually suggestive positions or activities. — [Meta Transparency Center: Adult Nudity and Sexual Activity (ad standards)](https://transparency.meta.com/policies/ad-standards/objectionable-content/adult-nudity-and-sexual-activity); separate policy: [Adult Sexual Solicitation and Sexually Explicit Language](https://transparency.meta.com/policies/ad-standards/objectionable-content/adult-sexual-solicitation-and-sexually-explicit-language/)
- **Violent content in ads:** no imagery that is shocking, gruesome or sensational. — [Meta Transparency Center: Violent and Graphic Content](https://transparency.meta.com/policies/ad-standards/objectionable-content/violent-graphic-content/); overview: [Advertising Standards intro](https://transparency.meta.com/policies/ad-standards/)
- **Automatic AI labels:** Meta auto-applies an **"AI info"** label when ads are created or significantly edited with its gen-AI features (Background Generation, Image Generation, Add Animation, etc.) **or** when it detects third-party gen-AI tools. The label sits in the three-dot menu / "About this ad". — [Social Media Today: Meta adds updated disclosure tags for AI-generated ads](https://www.socialmediatoday.com/news/meta-adds-updated-disclosure-tags-for-ai-generated-ads/824658/); [Marketing Dive](https://www.marketingdive.com/news/sociable-meta-adds-updated-disclosure-tags-for-ai-generated-ads/824833/)
- **Conflict: is self-disclosure mandatory for commercial ads?**
  - **No:** mandatory self-disclosure applies only to social issue, election and political ads; commercial ads rely on auto-labelling. — [Common Thread Collective](https://commonthreadco.com/blogs/coachs-corner/meta-ai-ad-labels-mandatory-disclosure-ecommerce-2026); [digitalapplied reference](https://www.digitalapplied.com/blog/ai-content-labeling-rules-advertisers-2026-reference)
  - **Yes:** a **March 2026 overhaul extended mandatory AI disclosure to commercial ads**, with manual disclosure at setup for third-party AI creative, and "undisclosed AI content" is 14% of rejections. — [AuditSocials](https://www.auditsocials.com/blog/meta-ad-policy-updates-2026-guide); [TechJack](https://techjacksolutions.com/ai-brief/meta-now-requires-advertisers-to-disclose-ai-generated-conte/); [JDesigns](https://jdesigns.info/blog/meta-ai-disclosure-rules-2026)
  - **Unresolved.** The 14% figure comes from an audit vendor, not Meta.
- **India IT Amendment Rules 2026:**
  - Notified **10 Feb 2026**, **in force 20 Feb 2026**. They bring "synthetically generated information" (SGI), meaning AI-created or altered audio, visual or AV content that appears authentic, under intermediary due-diligence rules.
  - Permitted SGI must be **prominently labelled** and carry **permanent metadata or provenance markers**. Platforms must not allow labels to be removed.
  - Significant social media intermediaries (5M+ users, which includes Meta) must **require users to declare** whether content is synthetic before posting and verify it with automated tools.
  - The amendment also introduced a **3-hour takedown** timeline for certain unlawful content.

  Sources: [Freshfields](https://www.freshfields.com/en/our-thinking/blogs/technology-quotient/india-targets-deepfakes-and-ai-generated-content-key-changes-under-meitys-2026-102mjwn); [Lexology](https://www.lexology.com/library/detail.aspx?g=adb2714c-1188-43e3-b62b-eb6649727f6e); [HLC](https://www.hlc.com/en/publications/india-introduces-mandatory-labelling-for-ai-and-3hour-takedown-for-illegal-content); [S.S. Rana](https://ssrana.in/articles/india-tightens-oversight-on-ai-generated-content-under-it-rules/)
- **Instagram "AI-generated profile" label** (31 Aug 2026) with reach penalties for unlabelled AI-persona accounts. — [Engadget](https://www.engadget.com/2246914/instagram-will-demote-ai-generated-influencers-if-they-dont-clearly-label-their-account/)
- **Unoriginal content** demotion and monetization limits (July 2025). — [TechCrunch](https://techcrunch.com/2025/07/14/following-youtube-meta-announces-crackdown-on-unoriginal-facebook-content); [Forbes](https://www.forbes.com/sites/johanmoreno/2025/07/15/meta-cracks-down-on-ai-generated-facebook-spam/)
- **Partnership ads enforcement** (Mar–May 2026): simulated-organic creator/UGC ads without Partnership designation are reportedly treated as "Deceptive Practice". Sources debate formality. — [ContentGrip](https://www.contentgrip.com/meta-branded-content-rules-update/); [Cohley](https://www.cohley.com/blog/meta-partnership-ads-requirements)
- **General review:** most ads are screened by ML systems, and legal products can still be rejected under platform rules. — [bir.ch Meta ad policies guide 2026](https://bir.ch/blog/what-can-you-advertise-on-meta); [bir.ch rejection reasons](https://bir.ch/blog/facebook-ads-rejected)

### Inferences
**Creative guardrails (my recommendation):**
- No kissing close-ups, bed scenes, cleavage-focused framing or "sexual tension" text overlays in ads.
- No slaps with visible injury, blood, weapons pointed at camera or corpses in the first frame. Imply conflict (reaction shots, dialogue cliffhangers) instead of showing violence.
- Horror hooks: no gore or jump-scare "shock" thumbnails.
- Keep "revenge/betrayal" copy free of personal-attribute callouts ("Are you divorced?" and similar) to avoid personal-attributes violations. **[prior knowledge]**

**AI disclosure:** treat it as mandatory regardless of how the Meta-policy conflict resolves.
1. Rely on Meta's auto "AI info" label.
2. Tick any AI-disclosure option offered at ad setup.
3. Add a small on-video "AI-generated series / AI द्वारा निर्मित" super.
4. Keep C2PA/provenance metadata in exported files where the tools support it.

This covers the India SGI labelling duty and Instagram's persona rules.

**Don't impersonate real people.** AI characters must not resemble real celebrities or public figures. Voice cloning must be of consenting or fully synthetic voices. This avoids both deepfake takedowns under the 2026 IT Rules and Meta impersonation policies.

**Pricing honesty:**
- Say "Episode 1 free" rather than "Watch free" when later episodes need coins or VIP.
- Landing pages should show coin and VIP prices before payment.
- Auto-renewing VIP must state price, renewal period and how to cancel (a general Meta subscription/misleading-claims principle **[prior knowledge]**; consumer-protection context: India's Dark Patterns guidelines, Nov 2023, **not verified in this session**).

**Age:** set a minimum age of 18 on ad sets for mature-themed series. **[prior knowledge]** If content ratings are self-classified (India's OTT code under IT Rules 2021 Part III requires age classification for publishers of online curated content), show the rating in ads and on landing pages. Legal counsel should confirm whether Gulel is covered as a "publisher of online curated content".

**Account health:** a rejection spree can restrict the ad account, so use a **backup admin** and verified business. Keep ad-account ownership on the verified portfolio, never on a personal account.

### Gaps
- Couldn't open Meta's Advertising Standards to check whether there is a specific 2026 "AI disclosure" checkbox for commercial ads in India, which would resolve the conflict above.
- No source found on Meta ad policies specific to **coins/virtual currency** or subscriptions for entertainment apps.
- Couldn't verify whether Meta requires age-gating (18+) for romance or mature-drama ads, or has category-specific rules for "dating-like" romance content.
- The applicability of India's OTT Code of Ethics (IT Rules 2021 Part III) to Gulel wasn't researched. It needs legal review.
