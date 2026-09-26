# Funnel Design, Deep Linking & Attribution for a Web-First Hindi Micro-Drama App (Gulel, India, as of Sept 2026)

> **Method note for the report writer:** In this session WebFetch was blocked by the network egress proxy for every domain tried (jonloomer.com, developers.facebook.com, firebase.google.com, techtimes.com, variety.com, dataslayer.ai), so no page could be read in full. Every external finding below comes from web-search result summaries. I marked primary sources (Google/Apple/Android/WebKit/Meta/Razorpay/TRAI/PIB docs) and flagged secondary or vendor-biased ones (for example, pricing claims about competitors made by ChottuLink, a deep-link vendor). The web-search budget ran out before I could search for creative kill/scale rules, micro-drama payer benchmarks, or recent changes to Meta's in-app browser, so those are listed as gaps. Facts about Gulel's own code come from reading the repo at `/home/user/thegulel`.

---

## 1. Link-in-bio, platform outbound-link behaviour, and in-app browser problems

### Takeaway
Each platform gives you a small number of clickable surfaces: Instagram bio (5 links) and Story link stickers, Threads bio (5 links), YouTube channel links (up to 14) and the Shorts "related video" link, and Facebook Page links. Every tap opens inside an embedded in-app browser (WebView). That breaks Google Sign-In outright (`403 disallowed_useragent`) and limits Razorpay to cards in Instagram/Facebook browsers. Because of this, Gulel should run its own link page on thegulel.com with phone OTP as the default login and an "open in browser" prompt, rather than Linktree.

### Cited Findings
**Platform link surfaces**
- Instagram bio supports up to **five links** with no follower minimum. The Story **Link sticker** is open to all accounts (it used to need 10k+ followers). Feed-post captions are not clickable, so feed posts can only point to the bio. Creators who are 18+ with 1,000+ followers can tag up to 30 products per Reel. — [inro.social](https://www.inro.social/blog/instagram-affiliate-links); [EvergreenFeed](https://www.evergreenfeed.com/blog/how-to-add-links-on-instagram-story/); [bytesize.me](https://bytesize.me/blog/how-to-add-link-to-instagram-bio) (secondary)
- **Threads** added up to **5 bio links** plus link-click tracking and Insights in a **May 2025** update. — [Social Media Today](https://www.socialmediatoday.com/news/threads-adds-multiple-profile-links-analytics/748280/); [AlternativeTo news, May 2025](https://alternativeto.net/news/2025/5/threads-adds-multiple-bio-links-link-click-tracking-and-enhanced-insights)
- **YouTube:** links in **Shorts descriptions and comments are not clickable**. The change was announced in Aug 2023 to reduce spam, and viewers have to copy and paste those URLs. — [TechCrunch, 10 Aug 2023](https://techcrunch.com/2023/08/10/youtube-is-disabling-links-on-shorts-to-cut-down-on-spam); [YouTube Help "Sharing links with your audiences"](https://support.google.com/youtube/answer/13748639?hl=en) (primary)
- On Shorts, the one clickable surface you control is the **"Related video"** link below the channel handle in the Short player. It can point only to one of **your own** YouTube videos (long-form, Short or Live), not to an external site. YouTube has been adding clickable surfaces (Related Video, brand links, Shopping affiliate) rather than restoring description links. — [link.boo guide](https://link.boo/guides/youtube-shorts-link-in-description); [TubeBuddy](https://www.tubebuddy.com/blog/youtube-shorts-link-changes/) (secondary)
- **YouTube channel links:** up to **14 links** on the About section (Customize Channel → Basic info → Links). Only the **first link is shown in full**, so put the key link first. The old row of up to 5 clickable icons on the banner is gone. — search summary of [havecamerawilltravel](https://havecamerawilltravel.com/youtube-banner-links-social-media/) / [Wyzowl](https://wyzowl.com/youtube-banner-size/) (secondary)
- **Facebook:** a profile has About → Links. A Page has an action button and a **Links** section that reportedly holds up to 10 URLs and appears under the Page name. — [Bitly](https://bitly.com/blog/facebook-link-in-bio/); [UniLink](https://app.unilink.us/blog/how-to-add-link-facebook-bio) (secondary)
- **WhatsApp Channels / Updates tab:** in June 2025 Meta announced **channel subscriptions** (a monthly fee for exclusive updates), **Promoted Channels** (paid visibility in the channel directory) and **ads in Status**. All of these appear only in the Updates tab, and personal chats remain E2E-encrypted and unused for ads. Rollout reports continued into Dec 2025. — [Meta Newsroom, June 2025](https://about.fb.com/news/2025/06/helping-you-find-more-channels-businesses-on-whatsapp/) (primary); [WhatsApp Blog](https://blog.whatsapp.com/helping-you-find-more-channels-and-businesses-on-whatsapp) (primary); [Techweez, 15 Dec 2025](https://techweez.com/2025/12/15/whatsapp-quietly-rolls-out-ads-in-status-and-channels/)
- **Unreliable claim, left out on purpose:** one search summary said "on Saturday, June 26th, 2026 YouTube adjusted the Shorts screen to place Related Shorts under the text". 26 June 2026 is a Friday, while 26 June 2021 was a Saturday, so this is probably a misdated 2021 article. — [youtubeshortsfeed.com](https://youtubeshortsfeed.com/youtube-removes-related-video/)

**Linktree / Beacons vs. own page**
- Linktree's **free** plan has Linktree branding and takes **up to 12% transaction fees** on digital product sales. Paid plans start at **$5/mo**, and a **custom domain is a Pro feature at $15/mo** (2026). Links to linktr.ee build Linktree's domain authority, not yours. — [u2l.ai Linktree pricing](https://u2l.ai/blog/linktree-pricing); [shelfy.today](https://www.shelfy.today/blog/linktree-vs-website) (secondary; u2l is a competing vendor)
- Linktree's analytics are basic click counts. Alternatives such as Cuttly (branded domain on the $25/mo Single plan), BonPages ($4.99/mo) and U2L advertise UTM builders, deep links and conversion analytics. — [Cuttly](https://cutt.ly/resources/blog/best-linktree-alternative-2026); [Bitly](https://bitly.com/blog/linktree-alternatives/) (vendor sources)

**In-app browser problems**
- **Google Sign-In fails inside the Instagram, Facebook and LINE in-app browsers** with `403: disallowed_useragent`. Google has refused OAuth in embedded WebViews since about 2021 for security reasons. **No site-side setting disables this.** Spoofing the user-agent works but violates Google's ToS. The fix is to send users to the system browser (Safari/Chrome). — [Google Developers Blog: OAuth in embedded webviews](https://developers.googleblog.com/upcoming-security-changes-to-googles-oauth-20-authorization-endpoint-in-embedded-webviews/) (primary); [TrueLink blog 2026](https://truelink-group.com/en/blog/why-google-login-fails-in-line-facebook-in-app-browsers-2026/)
- **Razorpay:** "Cards will appear on Instagram/Facebook browsers, but these browsers **do not support any other payment method that opens on a pop-up page**." Popup-based flows may be disabled in WebViews, and UPI Intent inside a WebView needs extra native configuration that only the host app can add. — [Razorpay Docs: Web Integration Troubleshooting & FAQs](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/troubleshooting-faqs/?preferred-country=IN); [Razorpay Docs: Webview](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/webview/); [Razorpay UPI Intent in WebView – Android](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/webview/upi-intent-android/) (primary)
- **Escaping the in-app browser:** users tap the ⋯ menu → **"Open in external browser"** (or "Open in Chrome" / "Open in Safari"). On **iOS no link can automatically leave Instagram's in-app browser**, and Meta's iOS in-app browser blocks automatic app launches. Android is more permissive (intent-based tricks), but results are unreliable. — [u2l.ai](https://u2l.ai/blog/instagram-in-app-browser); [Linkly](https://linklyhq.com/blog/open-instragram-link-in-browser); [OpenOut](https://openout.app/blog/how-to-open-instagram-links-in-safari-or-chrome) (secondary)
- **Video autoplay:** on iOS, `<video autoplay muted playsinline>` may autoplay inline. A video that gains an audio track or is **unmuted without a user gesture is paused**. Inside a WKWebView, the **host app** decides autoplay through `allowsInlineMediaPlayback` and `mediaTypesRequiringUserActionForPlayback`. — [WebKit: New <video> Policies for iOS](https://webkit.org/blog/6784/new-video-policies-for-ios/) (primary); [Thomas Visser on WKWebView media](https://www.thomasvisser.me/2018/06/26/wkwebview-media/); [Apple Dev Forums – WKWebView iOS 18 autoplay](https://developer.apple.com/forums/thread/764194)

**Gulel's current state (from the repo)**
- The web app only has client-side tracking. `src/components/FacebookPixel.tsx` loads the Pixel and fires `PageView`. `src/lib/analytics.ts` sends **every** event to Meta as `fbq('trackCustom', …)`, for example `episode_view`, `coin_purchase` and `sign_up`. — [/home/user/thegulel/src/lib/analytics.ts](/home/user/thegulel/src/lib/analytics.ts); [/home/user/thegulel/src/components/FacebookPixel.tsx](/home/user/thegulel/src/components/FacebookPixel.tsx)
- A grep of `src/` for `utm_`, `fbclid`, `gclid`, `first_touch` and `attribution` found nothing, so there is no UTM or click-ID capture yet. — repo grep, `/home/user/thegulel/src`

### Inferences
- **Build your own link page at thegulel.com and skip Linktree.** Link-page visits then count in GA4/Pixel as Gulel traffic, you can set first-touch cookies there, and you avoid paying for custom domains. A suggested structure:
  - `thegulel.com/l/{account}` for each account (the brand account and each AI-character account, e.g. `/l/gulel`, `/l/meera`). Each page shows 3–5 large buttons: "▶ Episode 1 free: {current series}", "Continue Episode 2", "Get the app", "Join WhatsApp Channel", "All series".
  - `thegulel.com/go/{code}` for short links that you can edit after posting. Use these in Story stickers, WhatsApp Channel posts, pinned comments and YouTube About links. A Next.js route handler logs the click server-side and 302s to the full `/watch/{episodeId}?utm_…` URL.
- **Design the funnel for the in-app browser, because most social traffic will land there.**
  - Make phone OTP (not Google) the default login on web. Hide or de-emphasise "Continue with Google" when the user-agent looks like Instagram/FBAN/FBAV, or show "Open in Chrome/Safari to sign in with Google".
  - At the paywall inside Meta in-app browsers, show an "Open in browser to pay with UPI" interstitial. Only cards are expected to work there, per Razorpay's docs.
  - Start episode 1 **muted with a large "Tap for sound"** control. Autoplay with sound will not work, and autoplay can be disabled entirely by the host app.
- **Use the 5 bio slots on Instagram and Threads the same way on every account.** Slot 1 is the current series Episode 1 (with utm_content=bio1), slot 2 the app, slot 3 the WhatsApp Channel, slot 4 the link page. YouTube: link 1 is the series page, and every Short's **Related Video** should point to a long-form "Episode 1 full" upload or a compilation whose **description** carries the thegulel.com link (clickable on long-form).

### Gaps
- I could not confirm the current (2026) Instagram/Facebook in-app browser behaviour on Android. Some reports say Meta tested Chrome Custom Tabs; this is unverified, and the search budget ran out.
- I could not confirm whether Meta's in-app browsers set `mediaTypesRequiringUserActionForPlayback` to allow muted autoplay. Test on real devices.
- I found no primary Meta doc confirming Facebook Page link limits, or whether links posted in WhatsApp Channel updates are tappable (they generally are, but this was not verified).
- I have no primary source on Beacons or Koji pricing and features for 2026. (Koji is widely reported to have shut down in 2024, but this was not verified here.)

---

## 2. Landing strategy for micro-drama ads (episode player vs. series page vs. app store; web-to-app vs. web-only)

### Takeaway
For a web-first player whose payments are UPI-led, the evidence points to **sending paid social traffic straight to the Episode 1 web player**. It should autoplay muted and prompt sign-up at the Episode 2 paywall, with the app offered only after that first value moment. ReelShort's 2026 profitability is attributed to billing moving onto its own web store (avoiding store fees of up to 30%). Google's Web to App Connect helps only after Universal Links/App Links are live.

### Cited Findings
- ReelShort is on track for **$1.05B revenue in 2026 (+34%)** and its **first profit at scale**, according to a Media Partners Asia report (Aug 2026). The reported drivers include falling platform fees as operators **move billing onto their own web stores**, which bypasses store commissions of up to 30%. The public reports do not give a share-of-revenue breakdown for web versus app. — [Variety, Aug 2026](https://variety.com/2026/tv/global/reelshort-1-billion-revenue-profit-2026-mpa-1236828885/); [Deadline, Aug 2026](https://deadline.com/2026/08/microdrama-reelshort-revenue-profit-1237027492/); [TechTimes, 6 Aug 2026](https://www.techtimes.com/articles/323399/20260806/reelshort-hits-1-billion-microdrama-revenue-first-profit-driven-app-store-bypass.htm)
- Web versus store pricing: on **28 Aug (2026)**, ReelShort's guest **web store** showed **$11.99 for the first week, then $14.99/week**, while the US iOS listing showed **$19.99/week**. ReelShort's website is becoming a **franchise/fandom hub**. DramaBox's leaner site (Home / Browse / App) pushes one path: **install the app**. — [Filmustage, "ReelShort vs DramaBox in 2026"](https://filmustage.com/blog/short-drama-apps-compared-reelshort-vs-dramabox-in-2026/)
- ReelShort and DramaBox held about 70% of global short-drama IAP in Q1 2025 (≈$130M and ≈$120M). — [Filmustage](https://filmustage.com/blog/short-drama-apps-compared-reelshort-vs-dramabox-in-2026/)
- One practitioner pattern: lightweight **web funnels** offer the first ~3 episodes free and require **sign-up to unlock the next one**. The "growth rails" are app-direct, web-to-app and in-platform (e.g., TikTok's H5 Mini Dramas). Meta Reels is "the workhorse" for short-drama UA. — [Flicknexs micro-drama marketing](https://blog.flicknexs.com/micro-drama-app-marketing-distribution/); [TikTok for Business: Publish Mini Dramas](https://ads.tiktok.com/resources/help/article/how-to-publish-your-mini-drama-content) (TikTok is banned in India, so this is context only)
- Industry scale: **700+ companies** were advertising short-drama apps each month as of June 2026, with **creatives per advertiser up 145% YoY**. Campaigns are typically bought on CPI, attributed through MMPs and optimised to **same-day (D0) ROAS**. TikTok launched "Growth Max for Mini Series" on 13 May 2026. More than **60%** of short-drama installs globally are said to come from paid ads. — [PPC Land microdrama explainer](https://ppc.land/microdrama/); [Digital Yield Group 2026](https://digitalyieldgroup.com/blog/short-drama-apps-in-2026-macro-landscape-market-dynamics-and-monetization-principles/) (the search summary merged these claims, so exact per-claim attribution is uncertain)
- **India context:** India app revenue reached **$300M in Q1 2026 (+33% YoY)**, and short-drama downloads grew **403%**. Micro-dramas are projected at **$1.5B by end-2026**. **FreeReels** grew downloads **520% QoQ**, driven mainly by **Meta ads**. **KukuTV** has 100M+ Android downloads and **StoryTV** 90M+. **89%** of Indian viewers discover micro-dramas through social feeds, and the median viewing time is 3.5 h/week. Kuku TV sells premium through **UPI**. — [Vertical Haus, June 2026](https://verticalhaus.ai/blog/micro-drama-trends-june-19-2026); [Hollywood Reporter India](https://www.hollywoodreporterindia.com/features/insight/indias-microdrama-boom-how-data-desire-and-aritifical-intelligence-are-reshaping-entertainment); [Sukudo Studios case study](https://www.sukudostudios.com/case-studies/india-numbers-game-micro-drama-case-study) (secondary; merged summary)
- **Google Web to App Connect** sends Search, PMax, Shopping and (since the 2025 expansion) **YouTube, Demand Gen and Hotel** ad clicks into the installed app. It **requires App Links (Android) / Universal Links (iOS) as the final URL**. Google claims a **2.8× conversion-rate lift** for clicks landing in-app versus mobile web, and 2× for YouTube. — [Google Ads Help: deep linking strategy for Web to App Connect](https://support.google.com/google-ads/answer/16401018?hl=en-GB); [Google Ads Help: New features to connect web and app](https://support.google.com/google-ads/answer/16501674?hl=en) (primary); [PPC Land](https://ppc.land/google-expands-web-to-app-connect-across-multiple-campaign-types/)
- **Store-fee context for linking from the app to web checkout:**
  - US only: the Epic v. Apple order of **30 April 2025** bars Apple from charging its 27% fee on out-of-app purchases and lets apps on the **US storefront** show external purchase links and buttons. IAP generally must still be offered. Apple's appeal was headed to a **25 June 2026 Supreme Court conference vote**; I could not verify the outcome. — [MacRumors, 30 Apr 2025](https://www.macrumors.com/2025/04/30/apple-app-store-anti-steering-injunction-violation/); [RevenueCat](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy); [TechTimes, 13 Jun 2026](https://www.techtimes.com/articles/318335/20260613/app-store-antitrust-fight-heads-june-25-supreme-court-vote-apple-cites-circuit-split-contempt.htm)
  - **Google Play India:** **user choice billing** is available to gaming and non-gaming apps with users in India, at a service fee **4 percentage points lower** when the user picks alternative billing. Users can choose between Play Billing and alternative in-app billing or **external web links**. Google's June 2026 blog announced expanded billing choice and lower fees, with updated fees taking effect **from 30 June 2026**. — [Play Console Help: India billing changes](https://support.google.com/googleplay/android-developer/answer/13306652?hl=en); [Android Developers Blog, June 2026](https://android-developers.googleblog.com/2026/06/play-expanded-billing.html); [Play Console: billing choice program](https://support.google.com/googleplay/android-developer/answer/17161464) (primary)

### Inferences
- **Recommended default for Meta and YouTube paid traffic:** use `thegulel.com/watch/{ep1Id}` as the final URL.
  - Autoplay muted, show the series title plus a "Tap for sound" overlay, and put **no login wall before Ep 1**.
  - At the end of Ep 1, show a cliffhanger card that leads into Ep 2 as a **paywall view**, followed by OTP sign-up and then a coin pack or VIP offer through web Razorpay.
  - Send the **series page** (`/series/{id}`) only for broad or brand ads and for organic "all episodes" CTAs.
  - Send **app store** traffic only on App-Install campaigns. Otherwise offer the app **after** the first purchase or at the Ep 3–5 boundary ("continue in app, your coins sync"), so it does not leak users before they pay.
- **Stay web-first for payments in India.** Web UPI through Razorpay avoids store fees entirely. Android Play user choice billing can cut fees for in-app purchases, but the saving is small compared with web checkout.
- **Test** "Ep 1 player" against "Ep 1 player plus auto-advance to Ep 2 paywall" against "3 free episodes before login" as landing variants, using the KPI tree in §5.
- **Turn on Universal Links / App Links for `/watch/*` and `/series/*`** so that the same ad URL opens the app when it is installed. This is a prerequisite for Google Web to App Connect. Treat Meta in-app browser clicks as web-only, since UL/App Link handoff from inside Meta's WebView is unreliable (see §3 gaps).

### Gaps
- I found no public data on what share of ReelShort or DramaBox revenue is web versus app, or on their exact ad landing destinations (web player or store) in India.
- I found no benchmark for "landing → play start" or "Ep 1 completion" rates for micro-drama web players.
- I could not verify the outcome of Apple's June 2026 Supreme Court petition, or whether any external-purchase-link entitlement exists for the **India** App Store. Assume none.

---

## 3. Deep linking in 2026 (Universal Links / App Links, deferred deep links, FDL shutdown, vendors, Expo Router)

### Takeaway
**Firebase Dynamic Links shut down on 25 Aug 2025.** Both `page.link` and custom-domain FDL links stopped working, with no automatic migration. Plain Universal Links / App Links cover the "app already installed" case at no cost, and Expo Router maps URLs to routes automatically. **Deferred** deep linking (install first, then open the right episode) still needs a vendor SDK or a self-built solution. The low-cost options for 2026 are ChottuLink (free up to 25K MAU), Airbridge's DeepLink Plan (free under 10K MAU), and Android's Play Install Referrer on its own. AppsFlyer and Branch are the paid, full-MMP route.

### Cited Findings
- **FDL shutdown:** on **25 Aug 2025** all FDL links stopped working, on both `page.link` and custom domains, and new links could not be created. Google lists alternatives including **Adjust, Airbridge, AppsFlyer, Bitly, Branch, Kochava, Singular**. There is no automatic migration or fallback. — [Firebase Dynamic Links Deprecation FAQ](https://firebase.google.com/support/dynamic-links-faq) (primary; via search summary); [Airbridge](https://www.airbridge.io/en/blog/firebase-dynamic-links-alternatives); [AppsFlyer](https://www.appsflyer.com/blog/mobile-marketing/fdl-deprecation-deep-linking/); [Branch](https://www.branch.io/resources/blog/firebase-dynamic-links-shutting-down/)
- **Expo / Expo Router configuration:**
  - Expo Router enables deep links for every route automatically.
  - iOS: set `ios.associatedDomains` (e.g. `"applinks:thegulel.com"`) in app.json and host `https://thegulel.com/.well-known/apple-app-site-association` served as `application/json`.
  - Android: declare `android.intentFilters` with `"autoVerify": true`. Without it Android never attempts verification. The matching `/.well-known/assetlinks.json` must also be hosted.
  - Use `app/+native-intent.tsx` to rewrite incoming URLs, for example from a vendor link domain. Branch integrates through `+native-intent` or a hook in the layout.
  - Universal Links / App Links work **only when the app is installed**. Deferred deep linking is not provided by the platforms; it is "the territory of attribution SDKs".
  - Sources: [Expo docs: Linking overview](https://docs.expo.dev/linking/overview/); [Expo blog: configure Universal and App Links](https://expo.dev/blog/universal-and-app-links) (primary); [React Native Relay 2026 guide](https://reactnativerelay.com/article/deep-linking-react-native-expo-router-universal-links-app-links); [Why UL/App Links break](https://vengalath.com/blog/why-universal-links-and-android-app-links-break/)
- **Android Dynamic App Links (Android 15+):** you can change the deep-link path rules **server-side** in `assetlinks.json` using `dynamic_app_link_components`, including `"exclude": true` rules, without shipping an app update. Devices on Android 15 (API 35)+ with Google services fetch the file periodically, while older versions ignore the field. Dynamic rules **cannot widen** the scope declared in the manifest. Google announced this in **Oct 2025**, and Google Ads documents it for Web to App Connect. — [Android Developers Blog, Oct 2025](https://android-developers.googleblog.com/2025/10/dynamic-app-links-elevating-your.html); [developer.android.com: configure assetlinks](https://developer.android.com/training/app-links/configure-assetlinks); [Google Ads Help: implement Dynamic App Links](https://support.google.com/google-ads/answer/16604164?hl=en-GB) (primary)
- **Play Install Referrer (Android, free):** a Play Store URL can carry a URL-encoded `referrer` query, e.g. `https://play.google.com/store/apps/details?id=…&referrer=utm_source%3Dinstagram%26utm_campaign%3D…`. On first launch, `InstallReferrerClient` returns the referrer string plus click and install-begin timestamps. MMPs use this same mechanism to encode the post-install destination for **deferred deep links on Android**. — [GoToApp: Play install referrer](https://gotoapp.store/blog/play-store-install-referrer); [Dynalinks Android deferred docs](https://docs.dynalinks.app/deferred/deferred-android.html); [Dub docs: deferred deep linking](https://dub.co/docs/concepts/deep-links/deferred-deep-linking)
- **Vendor pricing (2026). Treat competitor claims with caution:**
  - **ChottuLink:** "Forever Free" **$0 up to 25K MAU**, unlimited links, deferred deep linking, analytics and a custom domain. The first paid tier is **$19/mo**. — [ChottuLink pricing](https://chottulink.com/pricing.html) (vendor page)
  - **Airbridge DeepLink Plan:** free below **10K MAU**, with unlimited links and QR codes, deferred deep linking, branded domains and a dashboard. ChottuLink says the free tier has a **3,000-link cap** and costs **$199/mo above 10K MAU**. — [Airbridge DeepLink Plan](https://www.airbridge.io/en/deeplink-plan); [Airbridge blog 2026](https://www.airbridge.io/en/blog/enterprise-budget-for-deep-linking); cap and price from [ChottuLink's comparison](https://chottulink.com/blog/airbridge-deeplink-vs-chottulink-which-deep-linking-solution-is-better-in-2025/) (competitor)
  - **Branch:** no public pricing. One comparison says it "starts at $199/mo for 100K volume credits" ([Ulinkly](https://ulink.ly/blog/appsflyer-vs-branch)), while ChottuLink says enterprise contracts "typically start around $500/month" ([ChottuLink](https://chottulink.com/blog/branch-io-pricing-what-it-actually-costs-and-what-drives-the-quote/)). **These conflict, and both come from competitors.**
  - **AppsFlyer Zero** (free): described as a Welcome Package of **12,000 free conversions to use within the first 12 months**, plus a 30-day premium add-on trial ([metacto](https://www.metacto.com/blogs/the-complete-guide-to-appsflyer-costs-setup-integration-maintenance)). Another source calls it **12,000 lifetime non-organic installs** ([Toolradar](https://toolradar.com/tools/appsflyer/pricing)). **The two descriptions conflict; check AppsFlyer's pricing page.** OneLink is part of the suite.
  - **Adjust (AppLovin):** custom pricing, positioned as measurement-first. — [ChottuLink comparison](https://chottulink.com/blog/is-firebase-dynamic-links-the-best-top-alternatives-for-deep-linking/)
- **Gulel's current state:** `mobile/app.json` declares `"scheme": "gulel"`. I found **no `associatedDomains` or `intentFilters`** and no `public/.well-known/` directory in the web app, so Universal Links and App Links are **not configured**. Versions: Expo SDK ~56, expo-router ~56.2, Next.js 16.2.1, react-native-purchases ^10.2.2. — [/home/user/thegulel/mobile/app.json](/home/user/thegulel/mobile/app.json); [/home/user/thegulel/mobile/package.json](/home/user/thegulel/mobile/package.json); [/home/user/thegulel/package.json](/home/user/thegulel/package.json)

### Inferences
- **Recommended stack:**
  1. Serve `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` from Next.js (static files in `public/.well-known/` or route handlers with the correct `Content-Type`). Cover `/watch/*`, `/series/*` and `/l/*`, and exclude `/api/*`, `/admin/*` and payment return URLs.
  2. Add `associatedDomains: ["applinks:thegulel.com"]` and an Android `intentFilters` entry (autoVerify, https, host thegulel.com, pathPrefix `/watch` and `/series`). Expo Router's file routes then need to mirror the web paths (`app/watch/[episodeId].tsx`, `app/series/[id].tsx`), so the same URL resolves on both web and app.
  3. For deferred deep links, **start with ChottuLink's or Airbridge's free tier**, or build your own:
     - Android: Play Install Referrer carrying `ep={episodeId}&ft={first-touch-id}`.
     - iOS: a "clipboard-free" fallback in which the app asks the user to log in with the same phone number, then resumes their `last_watched` from the server.
     - The **server-side account state is the most reliable "deferred deep link" for a login-based app.**
  4. Adopt a full MMP (AppsFlyer or Adjust) only when **app-install** campaigns reach meaningful spend.
- **Next.js 16 note:** the repo uses `src/middleware.ts`. Per the repo's AGENTS.md, Next 16 has breaking changes, and I believe middleware was renamed to `proxy.ts` in Next 16. I did not verify this because `node_modules/next/dist/docs` was not present. Whoever implements UTM capture or link routing should check this.

### Gaps
- I did not verify whether a Universal Link tapped **inside Instagram's or Facebook's in-app browser** opens the installed app in 2026. Earlier behaviour was inconsistent, and this needs device testing.
- There is no primary confirmation of the AppsFlyer Zero terms, Branch list pricing, or Kochava's free tier (Kochava Free App Analytics).
- I did not confirm Expo SDK 56-specific changes to linking config. Check the Expo SDK 56 changelog.

---

## 4. Attribution: UTM taxonomy, first- vs last-touch storage, Meta windows, GA4 models, MMPs, SKAN/AdAttributionKit, Install Referrer, incrementality

### Takeaway
UTMs survive Safari 26 while `gclid` and `fbclid` are stripped, which makes a **strict lowercase UTM taxonomy plus a first-party record of first and last touch on the user row** the backbone of LTV-by-channel reporting. Meta's reported numbers changed twice in 2026:
- **12 Jan 2026:** 7-day and 28-day view windows were removed.
- **Mar 2026:** click-through now requires a link click, and a new "engage-through" category was added.

GA4 now offers only data-driven and last-click models.

### Cited Findings
**UTMs and parameters**
- GA4 reads the five classic UTMs plus four more:
  - **`utm_id`** (campaign ID, the join key for cost-data import) and **`utm_source_platform`**, both reported.
  - **`utm_creative_format`** and **`utm_marketing_tactic`**, which Google defines but **does not currently report**.
  - Sources: [Google Analytics Help: traffic-source dimensions & manual tagging](https://support.google.com/analytics/answer/11242870?hl=en); [GA Help: URL builders](https://support.google.com/analytics/answer/10917952?hl=en) (primary); [Terminus](https://www.terminusapp.com/blog/utm-source-platform/)
- **Meta dynamic URL parameters** use double braces, e.g. `{{campaign.id}}`, `{{campaign.name}}`, `{{adset.id}}`, `{{adset.name}}`, `{{ad.id}}`, `{{ad.name}}`, `{{placement}}` and `{{site_source_name}}` (which splits fb / ig / an / msg). The canonical place for them is the **"URL parameters"** field at the **ad level**. Google Ads ValueTrack uses single braces (`{campaignid}`). — [Jon Loomer: URL parameters](https://www.jonloomer.com/url-parameters-facebook-ads/); [utm.new Meta dynamic params](https://utm.new/blog/meta-dynamic-utm-parameters); [AdManage 2026](https://admanage.ai/blog/utm-parameters-for-facebook-ads)
- **Safari/iOS 26 Link Tracking Protection** strips click IDs such as `gclid`, `fbclid`, `msclkid`, `dclid` and `twclkid` before the page loads. **UTM parameters are not stripped**, because they describe a campaign rather than a user. — [Taggrs: Safari 26 changes](https://taggrs.io/safari-26-tracking-changes/); [WITHIN: iOS 26 LTP](https://www.within.co/blog/ios-26/); [Triple Whale](https://www.triplewhale.com/blog/ios-26-utm) (secondary; Apple's own documentation not fetched)

**First/last-touch persistence**
- UTMs exist only on the landing URL, so capture them **on landing** and persist them. Cookies (30–90 day expiry) or localStorage both work; sessionStorage is lost when the tab closes. Pass the values into hidden form fields or the CRM at conversion to enable revenue-by-channel reporting. GTM has a "Persist Campaign Data" custom template for this. — [MeasureSchool: capture UTMs in hidden fields](https://measureschool.com/capture-utm-parameters-in-form-fields/); [UTM.io: UTMs in CRM](https://web.utm.io/blog/utm-parameters-in-crm/); [Five Nine Strategy: persistent UTM tracking](https://fiveninestrategy.com/persistent-utm-tracking-guide/)

**Meta attribution windows (2026)**
- On **12 Jan 2026**, Meta **permanently removed the 7-day and 28-day view windows** from the Ads Insights API. Many advertisers saw reported conversions fall **15–40%**. — [Dataslayer: windows removed Jan 2026](https://www.dataslayer.ai/blog/meta-ads-attribution-window-removed-january-2026); [Conversios](https://www.conversios.io/blog/meta-attribution-window-changes-2026-fix-your-tracking/)
- **March 2026** (announced **3 Mar 2026**): **click-through now requires a link click**, meaning a click to a website, app, lead form or other destination. Likes, shares, saves and comments moved to a new **engage-through** category, which credits a conversion **within 1 day** of a like, comment, share, save, profile visit, or a **video view of 5+ seconds**. Billing did not change. The stated goal is closer alignment with third-party analytics such as GA. — [Meta for Business: "Simplifying Ad Measurement for a Social-First World"](https://www.facebook.com/business/news/click-attribution) (primary); [Jon Loomer: click-through now requires a link click](https://www.jonloomer.com/click-through-attribution-link-click/); [Mintec](https://mintec.co/blog/meta-ads-attribution-engage-through-2026/)
- The default for website-conversion campaigns is now **7-day click-through + 1-day engage-through + 1-day view-through**. — [Jon Loomer: How Meta Ads attribution works in 2026](https://www.jonloomer.com/meta-ads-attribution-2026/); [Dataslayer](https://www.dataslayer.ai/blog/meta-attribution-change-2026-what-engage-through-attribution-is-and-why-your-numbers-look-different)
- Meta also offers an "incremental attribution" setting according to 2026 guides. I did not verify the details. — [karb.ai](https://karb.ai/blog/meta-ads-attribution-settings)

**Meta Pixel + Conversions API**
- Run the Pixel and CAPI together with deduplication. Meta keeps one event when **`event_name` and `event_id` match** and both arrive **within 48 hours**. Any mismatch in casing or whitespace breaks deduplication. Use a UUID per action.
- Send **`fbp`/`fbc` unhashed** and **email/phone hashed with SHA-256** to raise Event Match Quality. IP plus user-agent sent together also helps.
- Sources: [Stape CAPI guide 2026](https://stape.io/blog/how-to-set-up-facebook-conversion-api); [AdsUploader CAPI dedup](https://adsuploader.com/blog/meta-conversions-api); [Watsspace event_id](https://watsspace.com/blog/meta-conversions-api-deduplication-event_id/)

**GA4 attribution**
- The reporting attribution models are **Data-driven (default)**, **Paid and organic last click**, and **Google paid channels last click**, set under Admin → Attribution settings. First click, linear, time decay and position-based are **no longer available**. — [Lovesdata](https://www.lovesdata.com/blog/google-analytics-attribution-models/); [Optimize Smart](https://optimizesmart.com/blog/ga4-attribution-models-explained-how-to-choose-the-right-one/); [MeasureU](https://measureu.com/attribution-google-analytics-4/)

**iOS: SKAN / AdAttributionKit**
- **AdAttributionKit (AAK)** was introduced at WWDC24 as SKAdNetwork's successor. It adds re-engagement, alternative marketplaces, configurable windows and country codes, and is fully interoperable with SKAN. **WWDC25 (June 2025)** added configurable attribution windows, cooldowns, overlapping re-engagement windows and postback country codes. **WWDC26 (June 2026) brought no changes.** SKAN has **no announced deprecation date** but is not expected to get updates, and "SKAN 5" never shipped. — [Singular: WWDC25 AAK recap](https://www.singular.net/blog/wwdc-2025-aak/); [RevenueCat: AAK for subscription apps](https://www.revenuecat.com/blog/growth/adattributionkit-what-is-it); [Rock Paper: iOS attribution 2026](https://rockpapermarketing.io/blog/ios-att-skadnetwork-mobile-marketers-guide); [OpenUTM 2026](https://blog.openutm.app/ios-attribution-2026/)

**Android: Play Install Referrer**
- Covered in §3. The `referrer` string carries UTMs, and the API also returns click and install timestamps. — [GoToApp](https://gotoapp.store/blog/play-store-install-referrer)

**Incrementality testing**
- Google **cut the minimum spend for incrementality (Conversion Lift) experiments from $100,000 to $5,000**, using Bayesian methodology. PPC Land reports the change; the summary mentions both GML May 2025 and "November 11", so the exact effective date is uncertain. — [PPC Land](https://ppc.land/google-lowers-incrementality-testing-threshold-to-5-000-for-advertisers/)
- **Conversion Lift based on geography** can be self-served for **Video, Discovery/Demand Gen** campaigns. **Search, Shopping, PMax and Display** need a Google rep. Lift studies moved into the Experiments section in 2026. — [Google Ads Help: Conversion Lift based on geography](https://support.google.com/google-ads/answer/14097193?hl=en) (primary); [ALM Corp](https://almcorp.com/blog/google-moves-lift-studies-to-experiments-google-ads/)
- **Meta GeoLift** is an **open-source** R package from Meta Open Source for geo-level lift, not an Ads Manager feature. It needs analyst support. — [Triple Whale GeoLift 101](https://www.triplewhale.com/blog/geolift-geo-based-incrementality-testing); [Space Ads](https://www.spaceads.agency/blog/incrementality-testing-geo-experiments-meta-google-meridian)

### Inferences
**Proposed Gulel UTM taxonomy.** Everything lowercase, `-` inside a value, `_` between tokens, no spaces, and an ASCII slug for Hindi titles.

| Param | Convention | Examples |
|---|---|---|
| `utm_source` | where the click happened | `instagram`, `facebook`, `threads`, `youtube`, `whatsapp`, `google`, `meta` (paid, via `{{site_source_name}}` → `fb`/`ig`/`an`/`msg`), `email`, `sms`, `push` |
| `utm_medium` | channel type, aligned to GA4 default channel groups | organic: `social`; paid: `paid_social`, `cpc` (Search), `paid_video` (YouTube); `bio` is **not** recommended because it breaks the Organic Social grouping, so use `social` + `utm_content=bio1`; `whatsapp_channel` / `messaging`; `email`; `sms`; `push`; `referral` |
| `utm_campaign` | `{objective}_{series-slug}_{yyyymm}` | `acq_badla-ep1_202610`, `rtg_badla-ep2_202610`, `org_badla_202610` |
| `utm_content` | `{account}_{creative-id}_{hook}_{format}` | `meera_cr0142_h3_reel`; for bio `gulel_bio1`; for pinned comment `meera_pin` |
| `utm_term` | Meta ad set / audience (`{{adset.name}}`) or Google keyword | |
| `utm_id` | platform campaign ID (`{{campaign.id}}` / `{campaignid}`) | |
| `utm_source_platform` | `meta_ads`, `google_ads`, `organic` | |
| custom | `gch=`{character handle}, `gsr=`{seriesId}, `gad=`{{ad.id}}, `gpl=`{{placement}}; captured into first-party storage, not GA4 | |

**Meta ad-level "URL parameters" template:**
`utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}&utm_term={{adset.name}}&utm_id={{campaign.id}}&gad={{ad.id}}&gpl={{placement}}`
This requires naming Meta campaigns and ads exactly to the taxonomy above.

**Storage design (web):**
- On any landing with UTMs, click IDs or an external referrer, write two server-set first-party cookies:
  - `gul_ft`: first touch, **never overwritten**, 180 days.
  - `gul_lt`: last non-direct touch, overwritten on each new campaign touch.
- Each stores source, medium, campaign, content, term, id, the custom params, `fbclid`→`_fbc`, `gclid`, landing path, referrer and timestamp.
- **Set them server-side** (Next.js route handler or proxy/middleware on Vercel) rather than with JS. Safari ITP caps JS-set cookies at 7 days; this is background knowledge I did not verify in this session.
- On **sign-up** (OTP or Google) and on **first purchase**, snapshot both cookies onto the Supabase user row (`ft_*`, `lt_*`, `signup_*` columns) and into the purchase row. This enables LTV, ARPPU and payback by first-touch source, character account, series and creative in SQL, independent of Meta and GA4 models.
- For the app, write the same fields from the Install Referrer on Android, from the deep-link vendor, or from the web cookie when the user first logs in on web.

**Event fixes implied by the repo:**
- Send **Meta standard events** instead of `trackCustom`: `ViewContent` (series/episode), `CompleteRegistration` (sign-up), `InitiateCheckout`, `Purchase` (value + `currency: 'INR'`) and `Subscribe` (VIP).
- Use **GA4 recommended events**: `sign_up`, `login`, `begin_checkout`, and `purchase` with `transaction_id`.
- Mirror `Purchase` and `CompleteRegistration` server-side through CAPI from the Razorpay/Stripe webhook, sharing `event_id`.
- Without this, Meta cannot value-optimise on purchases.

**Which window to trust:**
- For go/no-go on creatives, use **Meta 7-day click (link-click-only since Mar 2026)** alongside **first-party D0/D7 revenue by `utm_content`/`gad`**.
- Ignore 1-day view for decisions, or report it separately.
- In GA4, use **Paid and organic last click** for day-to-day channel comparison, because DDA needs volume that a new property lacks.
- A first incrementality test is realistic once spend on a Google Video/Demand Gen campaign reaches about $5k. For Meta, run a simple **geo holdout** (e.g. hold out 2–3 comparable Indian states for 2–4 weeks) and read it out with GeoLift or a difference-in-differences comparison on first-party purchases.

### Gaps
- I did not verify whether Meta's in-app browsers still append `fbclid`, or whether iOS LTP applies inside WKWebView-based in-app browsers (the stripping is documented for Safari).
- I did not confirm GA4's current default-channel-group regex for "Paid Social" / "Organic Social". Verify at GA Help "Default channel group" (support.google.com/analytics/answer/9756891) before finalising `utm_medium` values.
- I did not confirm the exact name or availability of Meta's "incremental attribution" setting, or Meta Conversion Lift minimums in India.
- I did not verify the ITP 7-day cap on JS-set cookies in this session.

---

## 5. Funnel KPIs, dashboards, review cadence and decision rules

### Takeaway
Track a single KPI tree from creative through to payback:
1. Creative: hook rate → hold rate → link CTR.
2. Web player: landing view → play start → Ep 1 completion → paywall view.
3. Monetisation: sign-up → first purchase → ARPPU.
4. Retention and return: D1/D7 retention → D0/D7/D30 ROAS → payback.

Build it on GA4 plus BigQuery (free daily export up to 1M events/day), Supabase purchase data, and Meta custom columns, visualised in Looker Studio. Benchmarks specific to micro-drama are scarce publicly, so use generic app benchmarks only as rough guardrails.

### Cited Findings
- **Hook rate = 3-second video plays ÷ impressions.** **Hold rate = ThruPlays ÷ 3-second video plays**. ThruPlay means played to completion or at least 15 s. Create both in Ads Manager under **Columns → Customize Columns → Create Custom Metric**, formatted as a percentage. — [Vaizle](https://insights.vaizle.com/hook-rate-hold-rate/); [AdManage](https://admanage.ai/blog/what-is-a-good-hook-rate-for-facebook-ads)
- Generic Meta benchmarks: hook rate of **~20–25%** as a target (25% baseline, 30%+ good, 35%+ scalable in one source) and hold rate of **~40–50%**. — [AdManage](https://admanage.ai/blog/what-is-a-good-hook-rate-for-facebook-ads); [Skaler 2026](https://skaler.app/blog/hook-rate-benchmarks-2026); [Billo](https://billo.app/blog/hook-rate-to-hold-rate/) (secondary; not specific to micro-drama)
- **ROAS/payback guardrails** (not specific to micro-drama):
  - Subscription apps: **D30 ROAS 40–70%** for 12-month payback.
  - IAP games: **D7 ROAS 15–40%**; F2P: **15–25% D7 / 40–60% D30**.
  - Hypercasual: **30–80% at D3**.
  - Sources: [Liftoff: what is a good ROAS 2026](https://liftoff.ai/blog/what-is-a-good-roas/); [Playio D7 ROAS benchmarks](https://blog.playio.co/d7-roas-benchmarks-mobile-games); [Admiral Media 2026 benchmarks](https://admiral.media/mobile-app-marketing-benchmarks-2026/)
- Short-drama UA is commonly **optimised toward same-day (D0) ROAS**. — [PPC Land microdrama](https://ppc.land/microdrama/)
- **GA4 → BigQuery:** export is free for standard properties. The **daily export is capped at 1M events/day**; if a property keeps exceeding it, Google may pause daily exports. **Streaming export** has no event cap but incurs a streaming-insert charge (about $0.05/GB). The BigQuery free tier is 10 GB storage and 1 TB of queries per month. — [GA Help: BigQuery Export](https://support.google.com/analytics/answer/9358801?hl=en) (primary); [Optimize Smart](https://optimizesmart.com/blog/how-to-overcome-ga4-bigquery-export-limit/); [DigitalApplied 2026](https://www.digitalapplied.com/blog/ga4-bigquery-export-2026-marketing-analytics-reference)
- **Repo state:** `src/app/(admin)/admin/analytics/page.tsx` and `src/app/api/admin/analytics/route.ts` exist. That is an in-house admin analytics surface that could host first-party funnel and LTV views. — [/home/user/thegulel/src/app/(admin)/admin/analytics/page.tsx](/home/user/thegulel/src/app/(admin)/admin/analytics/page.tsx)

### Inferences
**KPI tree and event definitions.** Event names are proposed; a "✓" marks events whose name already exists in `src/lib/analytics.ts`.

| Stage | KPI | Formula / event |
|---|---|---|
| Creative | Hook rate | 3s plays ÷ impressions (Meta custom metric) |
| | Hold rate | ThruPlays ÷ 3s plays |
| | Link CTR | link clicks ÷ impressions |
| Landing | LP view rate | `page_view` on /watch ÷ link clicks (Meta "Landing page views" ÷ link clicks) |
| | Play start rate | `video_start` (ep 1) ÷ /watch page_views |
| | Ep 1 completion | `episode_complete` (ep 1) ÷ `video_start` (ep 1) |
| Paywall | Paywall reach | `paywall_view` (ep 2) ÷ Ep 1 completes |
| | Sign-up rate | `sign_up` ✓ ÷ `paywall_view` |
| Monetise | Payer conversion | first `purchase` ÷ `sign_up` (D0, D7) |
| | ARPPU | revenue ÷ payers (D7, D30) |
| | ARPU / CAC | revenue ÷ new users; spend ÷ new users |
| Retention | D1/D7/D30 | returned & played ≥1 episode on day N |
| Return | ROAS D0/D7/D30 | cohort revenue by first-touch ÷ cohort spend |
| | Payback | days until cumulative cohort revenue ≥ spend |

- **Series-pilot KPI:** "Ep 1 → Ep 2 intent", meaning paywall reach multiplied by unlock rate, measured separately for each series, on the same audience, over the same week.
- **Dashboards:**
  1. **Meta Ads Manager** saved column preset "Gulel Creative": Hook, Hold, Link CTR, CPC, LPV, cost per LPV, CompleteRegistration, Purchases, Purchase ROAS (7-day click).
  2. **GA4 Explorations:** a funnel exploration (/watch → video_start → episode_complete → paywall_view → sign_up → purchase), broken down by `utm_content` / `Manual ad content` and device/browser, which shows the Instagram in-app browser as a separate segment.
  3. **BigQuery + Supabase → Looker Studio:** cohort ROAS and payback by first-touch source, account, series and creative, joining Meta cost (via Meta Ads API export or a connector) on `utm_id`/`gad`.
- **Weekly cadence** (a suggested heuristic, not sourced):
  - Monday: last week's cohorts, D0/D7 ROAS and payback curve.
  - Tuesday: creative review, kill or iterate, 10–20 new hooks per series.
  - Wednesday: funnel review (in-app browser vs external browser drop-offs, paywall).
  - Thursday: series-pilot read-outs.
  - Friday: budget reallocation.
- **Starting decision rules** (heuristics to calibrate, not sourced; the search budget ran out before practitioner kill/scale rules could be retrieved):
  - Kill a creative if its hook rate is below 20% after about 5k impressions, or if spend reaches 2× target cost per first purchase with zero purchases.
  - Scale by +20–30% per day while 7-day-click CPA stays within target for 3 consecutive days.
  - Greenlight a series pilot if Ep 1 completion and paywall→sign-up are at or above the portfolio median and D0 ROAS is at least 70% of the best series on matched spend.

### Gaps
- I found no public **micro-drama-specific** benchmarks for Ep 1 completion, paywall→payer conversion, ARPPU, or D1/D7 retention, in India or globally. The search budget ran out before targeted Sensor Tower or data.ai queries.
- I found no practitioner source for creative kill/scale thresholds, because the search budget was exhausted.
- I did not research a Meta cost-data connector for Looker Studio or GA4 cost import options.

---

## 6. Retargeting and retention loops (web push, WhatsApp, email, SMS/DLT, re-engagement ads)

### Takeaway
WhatsApp is the highest-reach owned channel in India, and its per-message costs in 2026 are:
- Marketing: **₹0.8631 + 18% GST** (since 1 Jul 2026).
- Utility and authentication: ₹0.115.
- Service replies: **charged from 1 Oct 2026**, after 1,000 free per month per number.

Meta also enforces **per-user caps on marketing messages**. iOS web push works only for Home-Screen-installed PWAs, so it will not reach iOS in-browser viewers. SMS needs DLT-registered templates, whitelisted URLs and `-P` headers, and can be sent only 10am–9pm. Re-engagement ads should target "watched Ep 1, didn't unlock" audiences built from Pixel/CAPI events.

### Cited Findings
**WhatsApp Business Platform (API)**
- Since **1 July 2025**, pricing has been **per message**: every business-initiated template is billed individually.
  - **Utility templates sent inside an open 24-hour customer service window (CSW) are free.**
  - Marketing and authentication templates are charged even inside the CSW.
  - **All messages are free for 72 hours inside a free entry point window**, which is opened by Click-to-WhatsApp ads or a Facebook Page CTA.
  - Sources: [Meta for Developers: Pricing updates July 2025](https://developers.facebook.com/docs/whatsapp/pricing/updates-to-pricing/) (primary, via search summary); [Twilio notice](https://help.twilio.com/articles/30304057900699-Notice-Changes-to-WhatsApp-s-Pricing-July-2025); [YCloud](https://www.ycloud.com/blog/whatsapp-api-pricing-update)
- **India rates:**
  - India moved to **INR billing in Jan 2026**. **Marketing is ₹0.8631/message effective 1 Jul 2026**, up about 10% from ₹0.7846. **Utility and authentication are ₹0.1150.** **18% GST** applies on top (marketing becomes about ₹1.0185), plus the BSP's markup. — [MyOperator 2026](https://myoperator.com/blog/whatsapp-business-api-pricing-india-2026); [ChatMaxima India](https://chatmaxima.com/whatsapp-api-pricing/india/); [Meta pricing page](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing) (primary; not fetched)
  - One source quotes India marketing at about **USD 0.0103** "updated Jan 2026". That is roughly ₹0.86, so it is broadly consistent. — [EngageLab](https://www.engagelab.com/blog/whatsapp-business-api-pricing)
- **From 1 Oct 2026, service messages are no longer free.** Free-form replies inside the 24-hour CSW cost **₹0.115** to +91 numbers, the same as utility and authentication. **1,000 service messages per business phone number per month remain free**; the allowance resets monthly without rollover. A valid payment method was required by **30 Sep 2026**, or service-message delivery would be suspended. This affects the API and BSPs, not the consumer or Business app. — [DEV Community: two changes on 1 Oct 2026](https://dev.to/preciousky_45d956626d31c3/whatsapp-business-platform-pricing-in-rupees-and-the-two-things-that-change-on-1-october-2026-4ko0); [SendPulse](https://sendpulse.com/blog/whatsapp-service-message-pricing); [Wati](https://www.wati.io/en/blog/whatsapp-service-message-pricing/); [Mark360](https://mark360.ai/blog/whatsapp-service-message-pricing-october-1-2026) (secondary; the Meta page could not be fetched)
- **Per-user marketing caps:** Meta limits how many **marketing** templates a single user receives across all businesses. Messages blocked by the cap fail with **error 131049** ("message failed to send to maintain healthy ecosystem engagement") and **are not charged**. Adding numbers or switching BSPs does not get around it, and utility, authentication and service messages are unaffected. One source puts the cap at about "2 marketing messages per day across all businesses"; **Meta does not publish the number**, so treat it as unverified. — [Infobip](https://www.infobip.com/blog/what-is-whatsapp-frequency-capping); [Vonage support](https://api.support.vonage.com/hc/en-us/articles/17270698783516-WhatsApp-Per-User-Marketing-Template-Messaging-Limits); [ChatArmin](https://chatarmin.com/en/blog/whats-app-messaging-limits)
- **WhatsApp Channels** are one-to-many broadcasts. Since June 2025 they can be **promoted** (paid) and can offer **subscriptions**. — [Meta Newsroom, June 2025](https://about.fb.com/news/2025/06/helping-you-find-more-channels-businesses-on-whatsapp/)

**Web push**
- **iOS/iPadOS 16.4+** supports Web Push **only for web apps added to the Home Screen**. The permission prompt must follow a direct user gesture, such as tapping Subscribe. **Declarative Web Push** (no service worker needed, backwards compatible) shipped in **iOS/iPadOS 18.4**, also for Home Screen web apps. — [WebKit: Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [WebKit: Meet Declarative Web Push](https://webkit.org/blog/16535/meet-declarative-web-push/); [WebKit: Safari 18.4 features](https://webkit.org/blog/16574/webkit-features-in-safari-18-4/); [WWDC25 session 235](https://developer.apple.com/videos/play/wwdc2025/235/) (primary)

**SMS (India, TRAI TCCCPR/DLT)**
- Every URL, APK, OTT link (e.g. WhatsApp links) and callback number in a template must be **whitelisted on DLT**. Operators were told to block SMS containing unregistered URLs from the end of September (the year is not stated in the summary; it was a 2024 direction per the Zoho note). — [WebEngage: TRAI DLT](https://docs.webengage.com/docs/trai-sms-dlt-regulations-india); [SMSGatewayCenter: CTA whitelisting](https://www.smsgatewaycenter.com/blog/kb/what-is-cta-whitelisting-and-why-was-my-sms-blocked/); [TRAI DCA direction](https://trai.gov.in/node/383)
- From **6 May 2025**, headers carry a suffix: **-P** promotional, **-S** service, **-T** transactional, **-G** government. — [SMSAlert KB](https://kb.smsalert.co.in/knowledgebase/trai-mandates-header-suffixes-for-sms-new-rules-effective-from-may-6-2025/)
- **Variable pre-tagging:** templates with more than 3 variables must tag each variable's purpose. This was reported in Nov 2025. — [MediaNama, Nov 2025](https://www.medianama.com/2025/11/223-trai-pre-tagged-sms-templates/); [TextGuru](https://www.textguru.in/blog/dlt-trai-mandatory-variable-pretagging-sms-templates-bulk-sms-india)
- Promotional SMS can be sent **only between 10am and 9pm**. — [Kommify 2026](https://kommify.com/blog/trai-sms-regulations/)
- **Digital Consent Acquisition (DCA):** promotional and service-explicit SMS need recorded consent. Consent-seeking messages come from the common short code **127xxx**, must include revocation information, and may use only whitelisted URLs. A PIB release describes a DCA **pilot** sending notifications to select customers. — [TRAI DCA direction](https://trai.gov.in/node/383); [PIB release](https://www.pib.gov.in/PressReleasePage.aspx?PRID=2201612&reg=48&lang=2); [Airtel DCA FAQ (PDF)](https://www.airtel.in/business/commercial-communication/assets/documents/DCA_FAQS.pdf) (primary)
- Note: the OTP SMS used for login is transactional/service traffic that must also be sent over a DLT-registered header and template (standard DLT practice; see [CleverTap SMS regulations](https://docs.clevertap.com/docs/sms-regulations)).

### Inferences
- **Suggested retention stack, by cost and reach:**
  1. **WhatsApp opt-in at sign-up** with a separate, unticked checkbox: "Get new episode alerts on WhatsApp".
     - Use utility templates for transactional nudges such as coins credited or VIP expiring.
     - Keep marketing templates (new episode dropped, "your series continues") to 1–2 per week to stay under per-user caps.
     - Run **Click-to-WhatsApp ads** to open free 72-hour windows for win-back conversations.
  2. **Brand and character WhatsApp Channels** as free broadcasts with short links such as `thegulel.com/go/…`.
  3. **Email** for users who signed in with Google.
  4. **Web push** for Android Chrome users only. For iOS, push is realistic only through the native app or an installed PWA.
  5. **SMS** only for OTP plus rare, high-value promotions, since it needs DLT templates, `-P` headers and whitelisted `thegulel.com` URLs.
- **Re-engagement ads (Meta custom audiences from Pixel/CAPI events):**
  - "video_start ep1 in last 7d AND NOT Purchase", served cliffhanger cutdowns of Ep 2–3.
  - "paywall_view AND NOT Purchase in last 3d", served a first-purchase coin offer.
  - "Purchasers in last 30d who did not return in 7d", served a new-series launch.
  - Exclude payers from acquisition campaigns.
  - This needs the standard-event refactor from §4 and valid consent (see §7).

### Gaps
- I could not fetch Meta's rate card to confirm ₹0.8631 marketing and ₹0.115 utility/authentication/service, or the exact rules on the 1,000 free service messages. Confirm with the BSP.
- I did not find a primary source for the exact TRAI DCA go-live date or whether DCA is mandatory for all principal entities in 2026 (it may still be at pilot stage).
- I have no data on India opt-in or engagement rates for WhatsApp marketing templates in entertainment apps.

---

## 7. Privacy and compliance (DPDP Act 2023 + DPDP Rules 2025; cookies; children)

### Takeaway
The DPDP Rules were **notified on 14 Nov 2025** and come into force in phases:
- The Data Protection Board started immediately.
- The **Consent Manager framework goes live on 13 Nov 2026**.
- **Substantive obligations, including notice, consent and children's data, apply from 13 May 2027.**

Gulel should build consent now:
- An itemised notice in English and Hindi.
- Separate opt-ins for marketing tracking/cookies and WhatsApp/SMS.
- Withdrawal that is as easy as giving consent.
- An 18+ age gate, because users under 18 require **verifiable parental consent** and must **not be tracked, behaviourally monitored or targeted with ads**.

### Cited Findings
- **Notification and phasing:** MeitY notified the DPDP Rules on **14 Nov 2025**. Phase 1 set up the **Data Protection Board** straight away. Phase 2 makes the **Consent Manager framework (Rule 4) operational on 13 Nov 2026**. Phase 3 brings the **remaining substantive obligations into force on 13 May 2027**, with no grace period expected. — [Wikipedia: DPDP Rules 2025](https://en.wikipedia.org/wiki/Digital_Personal_Data_Protection_Rules,_2025); [ProtectComply timeline](https://protectcomply.com/blog/dpdp-rules-2025-timeline); [Consently timeline](https://www.consently.in/blog/dpdp-rules-2025-implementation-timeline-india); [dcomply: all 22 rules with effective dates](https://dpdpa.dcomply.in/rules/)
- **Notice (Rule 3):** it must be clear and plain, with an **itemised list of the personal data** collected, the **specific purpose**, and how to withdraw consent or exercise rights. It must be available in English or **any of the 22 Eighth Schedule languages**, in the user's language on request. — [Consently: Rule 3 decoded](https://www.consently.in/blog/dpdp-rule-3-itemized-consent-notice-guide); [dpdpactindia.in](https://dpdpactindia.in/dpdp-rules/); [IDfy FAQ](https://www.idfy.com/blog/dpdp-act-faqs-2025-edition-consent-revocation-rights-notices-penalties-compliance-explained/)
- **Withdrawal:** users can withdraw at any time, and withdrawals must be tracked and documented. — [GoTrust](https://www.gotrust.tech/blog/dpdpa-consent-management-how-to-collect-store-and-withdraw-user-consent-legally)
- **Cookies:** the DPDP Rules contain **no cookie-specific rule**. However, where an online identifier is personal data and consent is the basis, the Rule 3 notice and Section 6 consent requirements apply. For **marketing, cross-site tracking, behavioural analytics, ad attribution or personalisation cookies**, the safest position is to treat them as consent-based. — [GoTrust: DPDP cookie consent](https://www.gotrust.tech/blog/dpdp-act-rules-2025-the-new-standard-for-cookie-consent-(and-how-to-get-it-right)); [ASCI "Navigating Cookies" whitepaper (Jan 2025)](https://www.ascionline.in/wp-content/uploads/2025/01/Navigating-Cookies-Whitepaper.pdf)
- **Children:** under the DPDP Act, anyone **under 18** is a child.
  - **Verifiable parental consent** is required under Rule 10. The fiduciary must check whether the user is a child and validate the parent's identity and age. Rule 10 does not mandate a single method such as DigiLocker; it asks for context-appropriate due diligence.
  - **Tracking, behavioural monitoring and targeted advertising directed at children are prohibited.**
  - Sources: [dpdpa.com Rule 10](https://www.dpdpa.com/dpdparules/rule10.html); [MediaNama, Nov 2025](https://www.medianama.com/2025/11/223-dpdp-rules-tracking-children-parental-consent/); [Consently VPC guide](https://www.consently.in/blog/verifiable-parental-consent-dpdp-rules-2025-edtech-gaming)
- **Penalties:** the Board can levy up to **₹250 crore** for security-safeguard failures and up to **₹50 crore** for other or general violations. — [IDfy FAQ](https://www.idfy.com/blog/dpdp-act-faqs-2025-edition-consent-revocation-rights-notices-penalties-compliance-explained/); [Seclore](https://www.seclore.com/fundamentals/dpdp-rules-2025-compliance-guide/)
- **SMS consent** is a separate regime: TRAI's DCA and DLT rules apply on top of the DPDP Act (see §6). — [TRAI DCA direction](https://trai.gov.in/node/383)

### Inferences
- **Before launch** (even though the substantive date is May 2027, the ads and CRM built now will depend on consent):
  - A **consent banner or sheet** on first visit that separates "Essential (login, payments, playback)" from "Analytics" and "Marketing & ad measurement (Meta Pixel, Google Ads)".
  - Load the Pixel, Google Ads tags, and non-essential GA4 cookies only after opt-in. GA4 **Consent Mode** can model the gaps.
  - First-party UTM cookies used only for Gulel's own attribution fall in a grey area. Declare them in the notice and treat them as analytics.
- **At sign-up:**
  - An **18+ self-declaration or date-of-birth** gate. Users under 18 should be blocked, or handled with a VPC flow and no tracking or ads. Micro-drama romance/revenge content will likely skew 18+ anyway.
  - **Unticked, separate** checkboxes for WhatsApp marketing and SMS/email offers.
  - Store `consent_version`, a timestamp and the channel for each purpose on the user row next to the attribution fields.
- **Withdrawal:**
  - A "Privacy & notifications" screen in the profile, a "STOP" keyword on WhatsApp, and an unsubscribe link in email.
  - Propagate withdrawals to Meta Custom Audiences by removing the user from CRM uploads and suppressing CAPI events for opted-out users.
- **Notice languages:** English and Hindi at minimum, given the Hindi-first audience.
- **Consent Managers** (registered with the Board from 13 Nov 2026) are optional integrations for a startup. Monitor them, but they are not blocking.

### Gaps
- I did not verify the specific penalty amount for children's-data violations (the DPDP Act Schedule is commonly cited as up to ₹200 crore, but I did not confirm it this session).
- There is no official MeitY or Board guidance on cookie banners or on first-party analytics cookies under DPDP. Practitioner interpretations vary.
- I did not confirm whether the "verifiably safe" class exemptions under Rule 10 / Fourth Schedule could cover an entertainment OTT. Assume not.
- I did not research Meta's own India requirements for Custom Audience consent (e.g., the Customer List terms) in this session.
