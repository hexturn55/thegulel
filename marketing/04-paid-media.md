# 04 · Paid media: Meta + Google campaign blueprint

> Ready-to-paste copy lives in `ads/meta-ads.csv` and `ads/google-ads.csv`. Creatives are in
> `assets/ads/{series}/`. Tracking must be live first (see `05-tracking-and-funnel.md` §5–6).

## 1. Principles (from the research)

1. **Show the story, not the app.** The winning micro-drama ad opens on betrayal, revenge, a reveal or a
   scare in the **first 3 seconds**, uses one clear emotion and ends on an unresolved beat. App features never lead.
2. **Volume + speed beat polish.** Leaders run thousands of creatives. Gulel's edge is AI production cost
   (₹709–₹3,380 per episode, per the investor dashboard), so cut **3–5 hooks per pilot** and refresh weekly (creative fatigues in 2–3 weeks).
3. **Consolidate.** One Advantage+ campaign with broad targeting and 8–15 *conceptually different* ads beats
   many small ad sets. The learning phase needs ~**50 optimisation events per ad set per week**.
4. **Optimise on a proxy until money arrives.** At launch spend, Purchase won't hit 50/week, so optimise on
   **CompleteRegistration** (happens at the Ep 2 paywall) or the custom conversion **EpisodeComplete (ep 1)**.
   Switch to Purchase once it passes 50/week.
5. **Honest "free".** "Episode 1 free" is true. "Free app" and "watch everything free" are not. Qualify with
   "Ep 2+ with coins or VIP" in the description (Google has enforced its Dishonest Pricing policy since 28 Oct 2025).
6. **Label AI.** Keep the on-creative "AI-generated" chip. Tick Meta's AI disclosure and Google's AI-generated asset setting.

## 2. Meta structure

```
Ad account: Gulel · INR · Asia/Kolkata
│
├─ C1  TEST   | Sales (Website) | ABO | objective event: CompleteRegistration
│      ├─ AS  pilot-{series} × 6–8 series per wave | broad 18–40 IN | Advantage+ placements
│      │      budget ₹5,000/day per ad set for 5–7 days
│      └─ Ads: 5 hooks × 9:16 video + 1 static (4:5) per series
│
├─ C2  SCALE  | Advantage+ Sales (unified) | CBO | event: CompleteRegistration → Purchase at 50/wk
│      └─ Winners only (graduated from C1), 8–15 distinct ads, broad IN 18–40, Hindi-belt geo bid-weighting off
│
├─ C3  RETARGET | Sales | event: Purchase
│      ├─ AS  PaywallView 14d – Purchase           ← main pool
│      ├─ AS  ViewContent 7d – PaywallView (dropped before paywall)
│      └─ Ads: "Episode 2 is waiting" / cliffhanger resolution teasers / coin-pack & VIP offers
│
├─ C4  REACH-TO-FOLLOW | Engagement → Video views (ThruPlay) | Reels only
│      └─ Character introductions to seed character accounts and build ThruPlay audiences
│
└─ C5  PARTNERSHIP | Sales | Partnership ads using creator posts (whitelisted handles)
```

**Targeting.**
- Country India, age **18–40**, all genders. The research says the micro-drama audience is >70% male, so
  don't narrow to women even for romance; let Advantage+ find the audience. Languages: none (let creative self-select).
- For Hindi-belt weighting, run separate ad sets geo-targeted to the **15 deck states plus Madhya Pradesh and
  Haryana**. The deck list includes non-Hindi states and misses both. Do this only when a series is clearly regional
  (e.g., *Pishachini* folklore → UP, Bihar, Jharkhand, MP, Rajasthan).
- Placements: Advantage+. Check the breakdown: Reels are typically **25–40% cheaper** than Feed in India.

**Bidding.** Highest volume (lowest cost) in C1–C2. Add a **cost cap** only after two weeks of stable CPA data.
Target cost per registration at the start: ≤ ₹40.

**Dayparting.** Evening is prime (69% watch in the evening). Budget can't be dayparted in Advantage+, but
publish organic posts and schedule creator posts for **19:00–23:30 IST**. Avoid scaling budgets on **India T20I
evenings** (vs West Indies to 17 Oct; vs Sri Lanka in December).

## 3. Google structure

| Campaign | Type | Goal / bidding | Budget rule | Assets |
|---|---|---|---|---|
| G1 Brand + Category Search | Search | Max conversions (`sign_up`) | ₹2–3k/day | Hindi + English keywords: "gulel", "hindi short drama", "vertical drama app", "horror web series hindi", "पिशाचिनी", competitor names in a separate ad group (bid low) |
| G2 Shorts Trailers | Demand Gen (YouTube Shorts-only ad group) | Max conversions → tCPA | ~15× tCPA/day; 4–6 weeks to learn | 9:16 videos ≥ 10 s, headlines ≤ 40 chars (one ≤ 30), descriptions ≤ 90 |
| G3 App Installs | App campaign (ACi), Android first | tCPA on an early in-app event → tROAS (hybrid IAP + AdMob) | 50–100× target CPI per day | 5 headlines (30), 5 descriptions (90), up to 20 images + 20 videos (portrait/square/landscape) |
| G4 Pre-registration | App campaign (pre-reg) | Pre-registrations | Small, while the Play listing is pending | Play feature graphic `assets/brand/play-feature-graphic-1024x500.jpg` |
| G5 App Engagement | ACe | Re-engage lapsed payers | **Hold** until 50k installs | — |

Complete **advertiser verification** (India: GST + business-operations checks) before G1 launches, or ads stop serving.

## 4. The pilot tournament: how 22 pilots become 2–4 greenlit seasons

**Design.** Rank pilots **against each other**, within genre, on equal budgets, in the same week, with the same audience.
No platform publishes greenlight thresholds, and festive CPM inflation raises every pilot's cost equally, so relative
ranking stays valid through Navratri.

| Setting | Value |
|---|---|
| Campaign | One Meta Sales/Traffic campaign, **ABO**, one ad set per pilot, Hindi-belt 18+ (15 deck states + MP + Haryana) |
| Optimisation | Landing-page views or `ViewContent`. No pilot will reach 50 purchases/week |
| Ads per pilot | 3 hook variants cut from the same Episode 1 (5 when the pilot is a priority) + the 4:5 static |
| Budget | **₹1,500–3,500/day × 7 days** per pilot → ~3,000–14,000 landing clicks each at ₹35–60 CPM and ~2% CTR |
| Whole slate | **₹2.2–5.5 lakh** (under 0.4% of the ₹15 Cr Year-1 line) |
| Second read | Mirror the top hooks on **YouTube Shorts** (Demand Gen, Shorts-only channel) at similar cost |
| Free read | Instagram **Trial Reels** (shown to non-followers first) for every hook |
| Waves | 8 pilots/week for 3 weeks (5–25 Oct), *Pishachini* as the control in every wave |

**Scoreboard layers.**

| Layer | Metric | Source |
|---|---|---|
| Ad | Hook rate, hold rate, link CTR, cost per Ep-1 start | Meta custom columns; Google Ads |
| Product | Ep-1 completion, **Ep-1 → Ep-2 continuation**, D1/D3 return | GA4 funnel (`video_start` → `video_complete` → `paywall_view`) |
| Money | **Ep-2 unlock by any method** (coins, rewarded ad, VIP), paid-unlock rate, revenue per Ep-1 viewer | Server ledger joined to first-touch UTM; investor dashboard |
| Demand | "Notify me for Ep 3" opt-ins per 1,000 Ep-2 completions | First-party table (add a notify button on the last pilot episode) |

**Pricing confound.** Episode 2 costs 10 coins (≈ ₹15), but the smallest purchase is the ₹149 pack, so paid-unlock rate measures
tolerance for a ₹149 ticket as much as love for the story. Rank mainly on **unlock by any method + notify-me opt-ins**.
Use paid unlock as the tie-breaker until a ₹19–₹49 sachet exists.

**Decision rules (starting heuristics; calibrate on week-1 data):**

| Call | Rule |
|---|---|
| **Kill** (day 3) | Bottom quartile of the wave on cost per Ep-1 start *and* Ep-1 completion. Stop spend; keep it live organically |
| **Keep testing** | Middle of the pack. Try 2 new hooks before day 7 |
| **Greenlight** (day 7) | Ep-1 completion **and** paywall → sign-up at or above the slate median, **and** D0 revenue ≥ 70% of the best pilot's on matched spend, with notify-me opt-ins in the top third |

Absolute guardrails from `05-tracking-and-funnel.md` §7 (e.g. hook rate < 20%, cost per Ep-1 viewer > ₹12) flag a broken creative
rather than a weak story. Re-cut before killing.

**Greenlight** = produce the full 52-episode season. At ₹709–₹3,380 per episode that costs **₹37k–₹1.76 lakh**,
less than half a day of spend at the planned ₹15 Cr pace. Greenlight 2–4 winners within days and put the creator and
character budget behind them. Organic signals break ties: character-account follower growth, Short retention and comment sentiment.

**YouTube sequencing.** During the tournament, post **only Episode 1 and cliffhanger Shorts**. A free full upload of both pilot episodes
would bypass the web paywall and contaminate the signal. After the read-out, upload killed pilots in full to harvest watch time and
subscribers. For winners, keep Episode 1 free as the on-ramp to paid Episode 2+.

## 5. Budget: the ₹15 Cr Year-1 envelope (investor deck), phased

| Phase | Weeks | Spend | What it buys |
|---|---|---|---|
| **Pre-launch / test** (deck Month 1) | 1–4 | **₹30–40 lakh** | Pilot tournament (₹2.2–5.5 L Meta + a similar YouTube Shorts mirror), Pishachini always-on and retargeting, creator seeding (₹8–10 L), Search |
| **Launch / scale winners** (deck Month 2) | 5–8 | **₹90 lakh–1.1 Cr** | Advantage+ scale on 3–4 greenlit series, Demand Gen Shorts, Diwali coin offers, creator wave 2 |
| **Retain & scale** (deck Month 3) | 9–12 | **₹1.2–1.4 Cr** | App campaigns (once the Android app is live), retargeting, Chhath/UP-Bihar push, New-Year binge offer |
| **Months 4–12** | — | **≈ ₹12 Cr** (≈ ₹1.3 Cr/month) | Scale whatever D30 ROAS proves; the deck's Year-2 plan cuts marketing to ₹10 Cr |

**Festive note.** CPMs rise **30–50%** from Navratri (11 Oct) to Diwali (8 Nov). Front-load the pilot tests into
**28 Sep–10 Oct**. During the festival window, put money behind offers (bonus coins on Dhanteras–Diwali
6–8 Nov) rather than cold testing.

**Split guide (weeks 1–12).** Meta 60% · Google 20% · creators 15% · reserve 5%.

## 6. What the deck's numbers imply (and where they're stretched)

| Deck number | Implication at research benchmarks | Verdict |
|---|---|---|
| ₹15 Cr Year-1 marketing | At ~₹6 per paid Episode-1 viewer, that buys **~25M paid viewers** in Year 1 | Achievable if CPMs hold near ₹60 on Reels |
| **100M viewers by 2027** | 25M paid means **~75M must come organically** (≈3 organic per paid) through character accounts, YouTube compilations and creator reposts | Stretch. It depends on the organic engine in the master plan, not on ad spend |
| Year-1 cost recovery **~30%** (≈ ₹12 Cr revenue on ₹40 Cr) | India micro-drama ARPPU ≈ **₹1,300/payer/year**, so ≈ **92k paying users**, i.e. **~0.4% of 25M paid viewers** convert | Plausible only with a better entry price (below) |
| First **5** episodes free (deck) | Live product gives **1** free episode | Pick one and make ads match. Research favours an early paywall *with* a ₹1–₹2 trial |
| Starter pack **₹149** | Indian peers anchor at ₹1–₹2 trials → UPI AutoPay; Kuku TV ₹399/quarter | Add a ₹19–₹49 sachet (e.g. 20–40 coins) and a ₹1–₹2 first-week VIP trial |
| VIP **₹399/week** | Kuku TV ₹399 per **quarter**, ₹899/year | 13× the competitor anchor. Test ₹99/week or ₹199/month |
| Indian peers' spend | Kuku FM spent ₹285 Cr on ads vs ₹242 Cr revenue (FY25); "no major platform is profitable" (Lumikai) | Gulel's advantage is **cheap content, fast greenlights, owned AI IP**. Keep CAC discipline with the kill rules above |
| "100M viewers" | ₹15 Cr buys ~3.3–15M Android installs at ₹10–45 CPI. The whole category had ~100M MAU in 2025 | **Define it.** Count social reach, Episode-1 viewers and registered users separately; this plan reports all three |
| Marketing ₹15 → ₹10 → ₹8 Cr | Even ReelShort projects ~44% of revenue on marketing in 2028 | Needs a near-zero-CAC distribution deal (telco bundle, OEM, owned platform) to hold |
| Content ₹25 Cr vs marketing ₹15 Cr | At ₹709–₹3,380/episode, ₹25 Cr is 1,400–6,750 seasons | Inverted vs category norms unless the content line funds team and tooling. Consider moving budget to marketing once greenlight data exists |
| Audience "16–40" | Under-18s can't be tracked or targeted under DPDP | Paid targeting is 18–40 |

## 7. Creative production spec (per pilot, per week)

| Asset | Spec | Source |
|---|---|---|
| 5 hook cuts | 9:16, 1080×1920, 15–30 s, H.264, burned-in Hindi captions (Mukta ExtraBold, white + black stroke), AI chip top-right, end card last 2 s | Cut from Episode 1; hooks from `03-content-playbook.md` |
| 1 static | 1080×1350 | `assets/ads/{series}/meta-4x5.jpg` |
| Square | 1080×1080 | `assets/ads/{series}/meta-1x1.jpg` |
| Story/Reel static | 1080×1920 | `assets/ads/{series}/meta-9x16.jpg` |
| Google Demand Gen images | 1200×628, 1200×1200, 960×1200 | `assets/ads/{series}/google-*.jpg` |
| End card | 1080×1920 JPG | `assets/ads/{series}/endcard-1080x1920.jpg` |
| Meta safe zones (Reels) | Keep text out of the top 14%, bottom 35% and side 6% | Built into the templates |
