# 05 · Tracking & funnel: how every view becomes a measurable rupee

> Goal: every post, Short, ad and creator video carries a link we can trace to a
> sign-up, a purchase and a series. Without this, the pilot test in the master plan can't
> pick winners. Research basis: `reports/Gulel social launch playbook.md`
> (Meta/Google toolchain and funnel sections).

## 1. The funnel

```
 SOCIAL / ADS / CREATORS                       WEB APP (thegulel.com)                              RETENTION
 ───────────────────────                       ─────────────────────                              ─────────
 Reel · Short · Story · Ad ──► /go/{slug}?utm ──► /watch/{ep1}  ──► Ep1 ends on a cliffhanger
 Bio link ──────────────────► /go?utm                 │ video_start / ViewContent
                                                      │ video_complete / EpisodeComplete
                                                      ▼
                                              Ep2 paywall (UnlockSheet)  paywall_view / PaywallView
                                                      │
                                    ┌─────────────────┼──────────────────┐
                                    ▼                 ▼                  ▼
                              Sign up (OTP)     Watch rewarded ad    Buy coins / VIP
                              sign_up /         earn_virtual_currency begin_checkout / InitiateCheckout
                              CompleteRegistration  / AdReward        purchase / Purchase · Subscribe
                                                      │                  │
                                                      ▼                  ▼
                                              Unlock ep2+ (spend_virtual_currency / UnlockEpisode)
                                                      │
                                                      ▼
                                   WhatsApp Channel · IG Broadcast · web push · retargeting ads
```

The rules that make it work:

1. **Paid social goes straight to the Episode 1 player**, not a landing page and not the app store.
   The web player autoplays muted, and the paywall arrives after the first moment of value.
2. **The link-in-bio is ours** (`thegulel.com/go`), not Linktree. It keeps UTMs, shows every pilot,
   and warns in-app-browser users that Google login won't work there.
3. **Phone OTP is the default login** in Instagram and Facebook in-app browsers, because Google OAuth fails
   there with `403 disallowed_useragent`. Razorpay also shows cards only inside those WebViews.
4. **One event, two pipes.** The browser Pixel and the server Conversions API send the same `event_id`,
   so Meta deduplicates and still sees purchases that iOS/ad blockers hide.

## 2. Link map (use these everywhere)

| Where | Link | Notes |
|---|---|---|
| Brand IG / Threads / FB / YouTube bio | `thegulel.com/go?utm_source={platform}&utm_medium=organic_bio&utm_campaign=always-on_gulel` | One per platform |
| Character bio | `thegulel.com/go/{alias}?utm_source=instagram&utm_medium=organic_bio&utm_campaign=always-on_{character}` | Opens that character's Episode 1 |
| Story link sticker | `thegulel.com/go/{alias}?utm_source=instagram&utm_medium=organic_story&utm_campaign={yyyymm}_{series}&utm_content={account}_story_{id}` | |
| YouTube Short | Pinned comment + description: `thegulel.com/go/{alias}` (typed, not clickable in Shorts). Clickable path: **Related video** → full-pilot upload whose description has the UTM link | |
| WhatsApp Channel | `thegulel.com/go/{alias}?utm_source=whatsapp&utm_medium=whatsapp_channel&utm_campaign={yyyymm}_{series}` | |
| Creators | `thegulel.com/go/{alias}?utm_source={creator_handle}&utm_medium=creator&utm_campaign={yyyymm}_{series}_creator` | One link per creator, so payouts can be judged on sign-ups |
| Meta ads (URL parameters field) | `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_term={{adset.name}}&utm_content={{ad.name}}` | Dynamic values. Destination = `/go/{alias}` |
| Google Ads (final URL suffix) | `utm_source=google&utm_medium={_medium}&utm_campaign={_campaign}&utm_content={creative}&utm_term={keyword}` + auto-tagging on | Set `{_medium}` = `paid_search` / `paid_video` / `demand_gen` per campaign |

**Series aliases** (served by `src/app/go/[slug]`; the full slugified title also works):

| Alias | Series | Alias | Series |
|---|---|---|---|
| `pishachini` | Pishachini: The Healer | `wife` | The CEO's Hidden Wife |
| `bride` | The Substitute Bride | `weddings` | Three Weddings |
| `ceo` | CEO's Hidden Identity | `whispers` | Whispers in the Dark |
| `mafia` | The Mafia Lord's Bride | `vows` | Broken Vows |
| `stepmom` | My Stepmother's Lies | `forbidden` | Forbidden Love |
| `alliance` | The Secret Alliance | `obsession` | Midnight Obsession |
| `doctor` | Medical Genius | `heart` | Million Dollar Heart |
| `revenge` | The Billionaire's Revenge | `fate` | Bound By Fate |
| `empress` | The Last Empress | `dragon` | Dragon's Blood |
| `beijing` | Love in Beijing | `heir` · `shanghai` · `mafiaking` · `palace` | Revenge of the Heir · Love in Shanghai · Mafia King's Heart · Imperial Palace Secrets |

## 3. UTM taxonomy (lowercase, hyphens inside values, underscores between parts)

| Param | Allowed values | Example |
|---|---|---|
| `utm_source` | `instagram` `facebook` `threads` `youtube` `whatsapp` `google` `{creator_handle}` | `instagram` |
| `utm_medium` | `organic_bio` `organic_story` `organic_post` `organic_comment` `whatsapp_channel` `paid_social` `paid_video` `paid_search` `demand_gen` `app_campaign` `creator` `referral` | `paid_social` |
| `utm_campaign` | `{yyyymm}_{objective}_{series}` or `always-on_{account}` | `202610_pilot-test_pishachini` |
| `utm_content` | `{account}_{format}_{hook-id}` | `pishachini-acct_reel_h03` |
| `utm_term` | ad set / audience / keyword | `broad_hindi-belt_18-40` |

Objectives: `pilot-test`, `scale`, `retarget`, `festive-diwali`, `creator`, `always-on`.
Hook IDs (`h01`…) come from the hook library in `03-content-playbook.md`, so a winning hook
can be traced from the ad back to the script.

The app stores **first touch** (`gulel_ft`, 90 days) and **last touch** (`gulel_lt`, 30 days)
in first-party cookies (`src/lib/attribution.ts`). Last-touch UTMs travel as parameters on every funnel
event, and on checkout metadata to the payment webhooks. Safari strips `fbclid`/`gclid` but keeps UTMs,
so the UTMs are the backbone.

## 4. Event map (as implemented)

| Funnel step | GA4 event | Meta Pixel event | Server-side |
|---|---|---|---|
| Episode starts playing | `video_start` (+ legacy `episode_view`) | `ViewContent` | — |
| Episode reaches 90% | `video_complete` | `EpisodeComplete` (custom) | — |
| Paywall / unlock sheet shown | `paywall_view` | `PaywallView` (custom) | — |
| New account | `sign_up` | `CompleteRegistration` | — |
| Returning login | `login` | — | — |
| Taps a coin pack / VIP plan | `begin_checkout` | `InitiateCheckout` | — |
| Coin pack paid | `purchase` | `Purchase` | CAPI `Purchase` from Razorpay / Stripe webhook, same `event_id` |
| VIP started | `purchase` + `vip_subscribe` | `Subscribe` | CAPI `Subscribe` from webhook; RevenueCat → CAPI for app |
| Episode unlocked with coins | `spend_virtual_currency` | `UnlockEpisode` (custom) | — |
| Rewarded ad completed | `earn_virtual_currency` | `AdReward` (custom) | Coins granted only by Google SSV (`/api/ads/ssv`) |
| "Notify me when Episode N drops" (end card of the last available episode) | `notify_me` / `notify_me_cancel` | `NotifyMe` (custom) | Saved in the `SeriesAlert` table with the last-touch `utm_campaign`; counted on the investor dashboard |

Event IDs: `stripe:<checkout session>`, `razorpay:<payment id>`, `revenuecat:<event id>`, `reg:<userId>`. The browser and server copies
share the ID, so Meta counts each conversion once. Every GA4 funnel event also carries the last-touch `utm_source/medium/campaign/content`.

**Known limits (as built):**
- GA4 `purchase` fires when the buyer lands back on the wallet/VIP page. If the in-app browser closes first, Meta still gets the
  server event but GA4 doesn't. A GA4 Measurement Protocol sender from the webhooks is the follow-up.
- Mobile purchases reach Meta through the RevenueCat webhook (app events). Link the dataset to the app in Events Manager, and **don't**
  also switch on RevenueCat's own Meta integration, or purchases double-count.
- `/go` hides the social-profile row until the URLs are filled in `src/lib/social-links.ts`.
- `predicted_ltv` on Subscribe is a rough three-month estimate (12 weekly / 3 monthly / 1 yearly payment).

## 5. Setup checklist: Meta

- [ ] **Business Portfolio** (business.facebook.com). Add: Gulel Page + IG, every character Page + IG, one ad
      account (INR, IST), the Pixel/dataset, the WhatsApp Business Account. Two admins minimum, 2FA on.
- [ ] **Business verification** (GST certificate + a utility bill/incorporation doc) → unlocks Meta Verified for
      Business and higher ad limits.
- [ ] **Domain verification**: add the DNS TXT record for `thegulel.com`.
      (Aggregated Event Measurement no longer needs manual event ranking since June 2025.)
- [ ] **Pixel**: set `NEXT_PUBLIC_FB_PIXEL_ID` in Vercel (Production + Preview).
- [ ] **Conversions API**: Events Manager → dataset → Settings → *Generate access token*. Set `META_CAPI_ACCESS_TOKEN`.
      For the first test, also set `META_CAPI_TEST_EVENT_CODE` from the *Test events* tab, then remove it.
- [ ] Check **Event Match Quality** ≥ 6.0 on Purchase after a week (phone + external_id + fbp/fbc are sent).
- [ ] **Custom conversions**: `EpisodeComplete` (Ep 1 only: rule `episode_number = 1`), `PaywallView`, `UnlockEpisode`.
      These are the high-frequency proxies to optimise on until Purchase reaches 50/week.
- [ ] **Custom audiences**:
  - Video viewers: 50% / ThruPlay, 30 days, per series.
  - IG + FB engagers, 90 days.
  - `ViewContent` last 7 days, excluding `Purchase`.
  - `PaywallView` last 14 days, excluding `Purchase`. This is the main retargeting pool.
  - `Purchase` 180 days, as a lookalike seed once there are 100+ buyers.
- [ ] **Instagram "AI-generated profile" label** on every character account (Settings → Account type & tools).
      Tick **"AI info"** on every photoreal Reel.
- [ ] **Meta Business Suite → Planner**: connect all Pages and IG accounts for scheduling (25 posts/day, 30 days ahead per account).
- [ ] **RevenueCat → Meta** integration (mobile purchases) and the Meta SDK for app installs/opens,
      without also logging purchases from the SDK (no double counting).

## 6. Setup checklist: Google

- [ ] **GA4 property** "Gulel" (IST, INR). Streams: Web (`NEXT_PUBLIC_GA_ID`); Android + iOS via Firebase later.
- [ ] Mark **key events**: `purchase`, `sign_up`. Optional: `paywall_view` for Ads optimisation while volume is low.
- [ ] **Custom dimensions** (event scope): `series_id`, `series_title`, `episode_number`, `is_free`, `utm_campaign`, `utm_content`.
- [ ] **BigQuery export** (daily, free tier) → the source for the Looker Studio pilot scoreboard.
- [ ] Link **GA4 ↔ Google Ads ↔ Search Console ↔ AdMob/Firebase**. AdMob revenue then counts toward hybrid tROAS.
- [ ] **Google Ads**: complete **advertiser verification** (India flow asks for GST + business operations) *before* launch.
      Import GA4 `purchase` and `sign_up`. Turn on **Enhanced Conversions** (unified setting).
      Tick the **AI-generated content** setting on every asset.
- [ ] **GTM**: one web container (`NEXT_PUBLIC_GTM_ID`) listening to `dataLayer`. Skip server-side GTM until spend > ~$5k/month.
      ⚠️ `src/components/Analytics.tsx` loads gtag (`NEXT_PUBLIC_GA_ID`) **and** GTM. Don't also add a GA4 tag inside GTM,
      or every event is counted twice. Simplest: GA4 via `NEXT_PUBLIC_GA_ID`; GTM only for Google Ads / other tags.
- [ ] **YouTube**: brand channel + character channels as Brand Accounts under one Google account. 2-Step Verification for every manager.
      Tick **"Altered or synthetic content"** on every upload.
- [ ] **Search Console**: verify `thegulel.com` and submit `/sitemap.xml`.
      Series pages become "watch pages" (VideoObject markup is a follow-up).
- [ ] **Play Console** (when the Android app ships): one custom store listing per hero series (up to 50) linked to App-campaign ad groups.
      Run store listing experiments in Hindi + English.

## 7. Scoreboard (weekly, per series)

| Stage | Metric | Source | Starting target* |
|---|---|---|---|
| Creative | Hook rate (3-s views ÷ impressions) | Meta / YT | ≥ 30% |
| Creative | Hold rate (ThruPlay ÷ 3-s views) | Meta | ≥ 25% |
| Creative | Link CTR | Meta / Google | ≥ 1.2% |
| Cost | Cost per Episode-1 viewer (`video_start`) | Ads ÷ GA4 | ≤ ₹6 |
| Product | Ep 1 completion (`video_complete` ÷ `video_start`, ep 1) | GA4 | ≥ 55% |
| Product | Paywall → sign-up | GA4 | ≥ 20% |
| Money | Sign-up → first purchase (7 days) | GA4 / DB | ≥ 4% |
| Money | D7 ROAS | DB revenue ÷ spend | ≥ 15% (pilot), ≥ 35% (scale) |
| Retention | D7 return rate | GA4 | ≥ 15% |

\*No public micro-drama thresholds exist. These are starting hypotheses built from the research benchmarks
(India CPM ₹20–150, Reels 25–40% cheaper; Android CPI ₹10–45). Re-baseline after two weeks of data.
The live investor dashboard (`/investors/dashboard`) already reports pilot → episode-2 continuation and
revenue per series from the database. Use it as the source of truth for money metrics.

## 8. Compliance guardrails

- **AI labels.** India's IT Amendment Rules 2026 (in force 20 Feb 2026) require prominent labels on synthetic media.
  ASCI requires virtual influencers to disclose they aren't human. Every graphic in `assets/` carries a visible
  "AI-generated · एआई द्वारा निर्मित" chip. Keep it. Don't strip C2PA metadata from generator output.
- **"Free" claims.** Say "Episode 1 free", never "free drama app" (Google's Dishonest Pricing policy has been enforced since 28 Oct 2025).
  Disclose VIP auto-renewal next to the price.
- **18+.** Ad targeting starts at 18. Under-18 users need verifiable parental consent under the DPDP Rules
  (substantive duties from 13 May 2027) and must not be tracked or targeted.
- **DPDP consent.** Build a Hindi + English notice with separate opt-ins for tracking and for WhatsApp/SMS marketing.
  The Consent Manager framework goes live **13 Nov 2026**; full obligations **13 May 2027**.
- **WhatsApp costs** (2026): marketing ₹0.8631 + GST per message; service replies charged from 1 Oct 2026
  after 1,000 free/month. Channels (broadcast) are free. Use the Channel for drops, and paid templates only for
  payment and unlock reminders.
- **SMS** needs DLT-registered templates and can only be sent 10 am–9 pm.

## 9. Environment variables (Vercel → Settings → Environment Variables)

| Var | What |
|---|---|
| `NEXT_PUBLIC_FB_PIXEL_ID` | Meta Pixel / dataset ID |
| `META_CAPI_ACCESS_TOKEN` | Conversions API token (server only) |
| `META_CAPI_TEST_EVENT_CODE` | Only while testing in Events Manager |
| `META_PIXEL_ID` | Optional server-side override of the pixel ID |
| `NEXT_PUBLIC_GA_ID` | GA4 measurement ID (`G-…`) |
| `NEXT_PUBLIC_GTM_ID` | GTM container (`GTM-…`) |
