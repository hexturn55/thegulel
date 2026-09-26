# Investor deck numbers — the targets this marketing plan answers to

Every figure below is copied from `/investors` (`src/app/investors/page.tsx`) and the
investor dashboard (`src/app/investors/dashboard/page.tsx`), as of 26 Sep 2026. The
right-hand column says how the marketing plan uses it. Where the live product
differs from the deck, the gap is flagged, because ads and captions have to promise what the
product actually does.

## Company goals

| Figure (deck) | Where | Marketing use |
|---|---|---|
| Mission: **100 million Indian viewers by 2027** | Vision & Mission | North-star reach target. Paid spend alone cannot buy this, so organic + character accounts + creator reposts must carry most of it (see master plan §3). |
| **877M** smartphone users in India | Hero, Opportunity | Top of the addressable funnel (Meta/Google broad targeting). |
| Positioning: "India's first dedicated vertical entertainment channel", "Short Format. Massive Impact.", "Built for the scroll generation." | USP / Vision | Brand-account bio lines and brand-post taglines. |
| Tags: Vertical · 2–3 min episodes · Daily drops · Tier 1 · 2 · 3 | Hero | Brand promise. "Daily drops" means a daily posting cadence on the brand account. |

## Market and audience (used for targeting and copy, never as consumer claims)

| Figure | Where |
|---|---|
| **+186%** vertical short-drama download growth while traditional OTT downloads **fell 7%** in Q4 2025 | Problem |
| **80%** of Indians consume on phones; **90%** of content built horizontal | Problem |
| Gen Z attention **under 8 seconds**, so the hook must land inside it | Problem. This drives the 0–3 s hook rule for every short and ad |
| **500 million** Indians priced out of paid OTT | Problem. This drives the "Episode 1 free" and ₹-sachet messaging |
| Global vertical-drama market **$1.4B → $9.5B** (2024 → 2030), **28% CAGR** | Market |
| **+278%** surge in short-drama downloads in 2025; **+115%** global in-app revenue growth | Market |
| India digital-video market **$19.3B → $46.4B** by 2033 | Market |
| India vertical drama **$300M** in Year 1, **450M downloads**, **100M MAU** | Market |
| India micro-drama market ($B): 2024 **0.3** · 2025 **0.6** · 2026 **1.1** · 2027 **1.8** · 2028 **2.7** · 2029 **3.6** · 2030 **4.5** (**15×**) | Market |
| **10×** lower cost per minute than traditional TV | Unit economics |
| MX Fatafat · ZEE5 Bullet: **280M+** users; Kuku TV · QuickTV lead early adoption | Competition |
| **60%** of Indians aged 16–40 watch short video daily | Opportunity |
| **4.7 hrs** average daily mobile time | Opportunity |
| **80%** of mobile video consumed is vertical | Opportunity |
| **70%** of OTT consumption is drama & regional | Opportunity |
| **65%** of new internet users are Tier 2 & 3 | Opportunity |
| Audience: **age 16–40**, reels-native, pan-India Tier 1/2/3 | Who we reach. This sets the ad-set age range to 18–40 (Meta ads can't target under 18) |
| **15 states**: Maharashtra, Delhi, Rajasthan, Uttar Pradesh, Gujarat, Karnataka, Bihar, Jharkhand, Assam, West Bengal, J&K, Odisha, Punjab, Uttarakhand, Himachal | Footprint. These are the geo list for the first Hindi-belt ad sets |
| Genres: Family Drama, Romance, Crime & Noir, Horror, Thriller, Comedy, Suspense, Crime, Emotional Drama, Mystery, Action Drama | USP |
| Seasons: **52 episodes × 2–3 min** | Highlights |

## Monetisation (what ads can promise)

| Figure (deck) | Live product (26 Sep 2026) | Flag |
|---|---|---|
| First **5** episodes free | Pilots: **1** free episode (ep 1), ep 2 locked. Pishachini: **1** free of 20 | ⚠️ Mismatch. Ads must say "Episode 1 free", not "5 free". Schema default is `freeEpisodes = 5`, so the live data was set lower on purpose or by accident. Decide before launch. |
| ~**10 coins** (≈ **₹8–12**) per episode | `coinPrice` default 10 | ✅ |
| Rewarded ad = **+5 coins** | `AD_REWARD_COINS = 5` | ✅ |
| Starter **100** coins **₹149 / $1.99** (≈₹1.49/coin, ~10 eps) | same | ✅ Entry price. Research suggests ₹9–₹49 sachets convert Tier 2/3 better (see research report) |
| Popular **500** coins **₹599 / $7.99** (≈₹1.20/coin, ~50 eps) | same | ✅ |
| Super **1,200** coins **₹1,099 / $14.99** (≈₹0.92/coin, ~120 eps) | same | ✅ |
| Mega **3,000** coins **₹2,499 / $29.99** (≈₹0.83/coin, ~300 eps) | same | ✅ |
| VIP weekly / monthly / yearly | **₹399 / wk**, **₹1,199 / mo**, **₹9,599 / yr** (`src/lib/vip-plans.ts`) | ⚠️ ₹399/week is high for Tier 2/3. Test a ₹49–₹99 first-week trial before scaling paid traffic |

## Production cost (why an aggressive pilot-test strategy is affordable)

| Figure | Where |
|---|---|
| **$6–9 (≈ ₹500–750)** per 90-second episode | Cost structure |
| **$350–470 (≈ ₹30–40k)** per 52-episode season | Cost structure |
| Kling 2.5 **~$0.35 / 5 s shot**, Nano Banana **~$0.04 / still**, ElevenLabs **~$0.04 / line**, Sync lip-sync **~$0.50 / shot** | Cost structure |
| **₹10–25 lakh** per traditional TV episode vs **< ₹40,000** per full Gulel season | Cost structure |
| Production Budget v3 (FX ₹95.98/$): **₹3,380 / episode** on Seedance 2.5 via Higgsfield Ultra credits; **₹709 / episode** on Seedance 2.5 Unlimited pass + ElevenLabs Hindi | Investor dashboard |

⚠️ The dashboard's ₹3,380 credits path is 4.5–6.8× the deck's ₹500–750. The ₹709 path matches the deck.
Either way, a full 52-episode season costs **₹37k–₹1.76 lakh**. That is less than a single
day of launch-scale ad spend, so it pays to greenlight fast when a pilot wins.

## Capital plan (the marketing budget envelope)

| Year | Content | **Marketing** | Total | Note (deck) |
|---|---|---|---|---|
| Year 1 | ₹25 Cr | **₹15 Cr** | ₹40 Cr | Aggressive content + market entry |
| Year 2 | ₹20 Cr | **₹10 Cr** | ₹30 Cr | Scaling, marketing optimized to ₹10 Cr |
| Year 3 | ₹17 Cr | **₹8 Cr** | ₹25 Cr | Pipeline optimized; spend reduced |

Cost recovery targets: **Year 1 ~30%**, **Year 2 50–60% (55%)**, **Year 3 105%** (net profitable).
The ask: **₹40 Cr (~$5M) Series A**, which funds Year 1.

## GTM in the deck, and how this plan implements it

| Deck phase | Deck items | This plan |
|---|---|---|
| **01 · Pre-launch (Month 1): Build the hype** | Teasers & trailers · Social setup (IG, YT Shorts, FB) · Influencer outreach · Polls/countdowns · Meta + Google Ads setup | Weeks 0–4: channels, character accounts, tracking, pilot blast, creative testing (master plan §6) |
| **02 · Launch (Month 2): Go live, loud** | Official launch + creator collabs · Scale Reels/Shorts/Meta ads · Consistent episode drops · Regional creators · Conversion-focused Google & Meta | Weeks 5–8: greenlight winners, scale spend on winning pilots, creator wave |
| **03 · Post-launch (Month 3): Retain & scale** | Push/episode reminders · High-frequency Shorts · Fan communities · Brand collabs · Analytics & scaling | Weeks 9–12: retention loops (WhatsApp Channel, web push), brand-integration pitches using the investor dashboard's showcase |
