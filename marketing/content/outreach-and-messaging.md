# Outreach & messaging kit

Creators, meme pages, press, WhatsApp, push. Every link below uses the taxonomy in
`05-tracking-and-funnel.md` §3. Replace `{alias}` with a series alias (`pishachini`, `bride`, `ceo`, …).

## 1. Creator program

**Who.** The research says 89% of Indian micro-drama viewers discover shows on Instagram/Facebook, the audience is male-skewed
18–34 and Tier II/III. Recruit:
- **Horror storytellers / "real ghost story" narrators** (Hindi, UP/Bihar/MP/Rajasthan) → *Pishachini*
- **Reaction and "drama review" creators** (Hindi/Hinglish) → any pilot
- **Attitude / motivation edit pages** (male 18–30) → revenge and hidden-identity pilots
- **Couple / relationship creators** → *The Substitute Bride*, romance pilots
- **Meme pages** (Hindi) → cliffhanger stills and "what would you do" formats

**Rates (2026 India rate cards, per Reel).** Nano ₹1.5–8k · Micro ₹6–80k · Mid-tier ₹35k–3.5 L · Macro (500k–1M) ₹1.5–4 L.
Usage rights to run the creator's post as a **Partnership ad** add 25–100%. Week-1 budget: 30 nano + 10 micro
creators ≈ ₹3–5 L. Pay on a flat fee, plus a sign-up bonus tracked through their unique link.

**Rules.** Every creator post is published as a **Paid partnership** (IG/FB) with `#ad` or `#collab` in the first line (ASCI).
Creators must say the show is **AI-generated**. No claims that "everything is free".

### DM: first contact (Hindi)
```
नमस्ते {name} 🙏
हम Gulel हैं — भारत का vertical drama चैनल (2-मिनट के हिंदी एपिसोड)।
आपका {content_type} कंटेंट हमें बहुत पसंद है। हमारी नई AI-originals सीरीज़
"{series}" के लिए एक paid collab करना चाहेंगे — आप Episode 1 पर अपना reaction /
कहानी सुनाएँ, हम आपको एक personal link देंगे।
Budget: ₹{fee} + हर sign-up पर bonus। Interested हों तो बताइए, brief भेज देंगे।
— Team Gulel · hello@thegulel.com
```

### DM: first contact (English/Hinglish)
```
Hi {name}! We're Gulel, India's vertical drama channel (2-min Hindi episodes).
Loved your {content_type} videos. We'd like a paid collab for our AI-original series
"{series}": a reaction or retelling of Episode 1, with your own tracked link.
Fee ₹{fee} + a bonus per sign-up. Shall I send the brief?
— Team Gulel · hello@thegulel.com
```

### Creator brief (one page)
- **Series:** {series}. **Watch Episode 1:** `thegulel.com/go/{alias}?utm_source={handle}&utm_medium=creator&utm_campaign={yyyymm}_{alias}_creator`
- **Deliverable:** 1 Reel (20–45 s) + 2 Stories with a link sticker, posted 19:00–22:00 IST on the agreed date.
- **Hook options:** use one of the series hooks in `content/series-kits.md` or your own. Open on emotion in the first 2 seconds.
- **Must include:** "Gulel पर Episode 1 फ्री", the AI mention ("ये AI से बनी सीरीज़ है"), and the Paid-partnership tag with @thegulel.
- **Don't:** spoil Episode 2, claim the whole series is free, show gore, or use copyrighted music outside IG's library.
- **Usage rights:** Gulel may run the post as a Partnership ad for 60 days.
- **Payment:** 50% on approval of the draft, 50% on publishing. Bonus ₹{x} per 100 sign-ups via your link (from our dashboard).

## 2. WhatsApp Channel "Gulel": post templates (free broadcast)

Post daily at 20:00 IST. One poster image + short text + link.

```
🔔 आज का ड्रामा: {series}
{hook_hi}
Episode 1 फ्री 👉 thegulel.com/go/{alias}?utm_source=whatsapp&utm_medium=whatsapp_channel&utm_campaign={yyyymm}_{alias}
(AI-generated Gulel Original)
```
```
😱 कल रात {count} लोगों ने Episode 1 देखा और Episode 2 पर अटक गए…
आप क्या करते? 👇 react करें
Episode 2 → thegulel.com/go/{alias}
```
```
🌑 अमावस्या स्पेशल: पिशाचिनी के 20 एपिसोड, एक साथ।
पहला एपिसोड फ्री 👉 thegulel.com/go/pishachini?utm_source=whatsapp&utm_medium=whatsapp_channel&utm_campaign=202611_festive-diwali_pishachini
```

## 3. WhatsApp Business API templates (paid, opt-in users only)

Marketing template ≈ ₹0.86 + GST per message (2026). Utility ≈ ₹0.115. Use utility only for transactional messages.

| Name | Category | Body |
|---|---|---|
| `unlock_reminder` | Marketing | `{{1}}, "{{2}}" का Episode 2 आपका इंतज़ार कर रहा है। 10 coins में unlock करें या एक ad देखकर 5 coins पाएँ: {{3}}` |
| `new_episode_drop` | Marketing | `नया एपिसोड आ गया है: "{{1}}" — Episode {{2}}. अभी देखें: {{3}}` |
| `purchase_receipt` | Utility | `आपके Gulel wallet में {{1}} coins जुड़ गए हैं। Order {{2}}. Balance: {{3}} coins.` |
| `vip_renewal` | Utility | `आपका Gulel VIP {{1}} को renew होगा (₹{{2}}). Manage: {{3}}` |

Consent: WhatsApp and SMS marketing need a separate opt-in (DPDP), and every template needs Meta approval before use.

## 4. Web push / in-app notifications (opt-in)

| Trigger | Title | Body |
|---|---|---|
| Watched Ep 1, no unlock (+2 h) | एपिसोड 2 तैयार है 👀 | "{series}" में आगे क्या हुआ? 10 coins या एक ad — आपकी मर्ज़ी। |
| Coins left, no watch (+24 h) | आपके {n} coins इंतज़ार में | {n/10} एपिसोड अभी unlock करें। |
| New episode of a followed series | नया एपिसोड: {series} | Episode {n} अभी live है। |
| Diwali offer (6–8 Nov) | दिवाली धमाका 🪔 | हर coin pack पर bonus coins — सिर्फ़ 8 नवंबर तक। |
| Lapsed 7 days | आपकी कहानी अधूरी है | "{series}" वहीं रुकी है जहाँ आपने छोड़ा था। |

iOS web push only works for Home-Screen-installed PWAs. On iOS, rely on WhatsApp and retargeting ads instead.

## 5. Press pitch (launch week)

**Subject:** Gulel is making Hindi TV-grade drama with AI for under ₹40,000 a season, and letting viewers pick which shows get made

> Gulel (thegulel.com) is India's vertical drama channel: 2-minute Hindi episodes built for the phone.
> Every Gulel Original is produced with generative AI video and voice, at a cost of roughly ₹500–750 per
> 90-second episode against ₹10–25 lakh for a traditional TV episode.
>
> This month Gulel is releasing **22 pilots at once**, from horror to revenge to romance, and letting the audience's viewing
> decide which ones become full 52-episode seasons. The flagship horror series *Pishachini: The Healer* is streaming
> all 20 episodes now. Episode 1 of every show is free.
>
> India's micro-drama market grew to roughly $300M, 450M downloads and 100M monthly users in its first year
> (industry estimates), and is projected to reach $4.5B by 2030.
> Founders are available for interviews. Contact: hello@thegulel.com

Targets: Inc42, YourStory, Entrackr, Economic Times BrandEquity, afaqs, exchange4media, Storyboard18, Social Samosa, Medianama.
Angle for trade press: *AI-native production economics + audience-greenlit pilots*.

## 6. Influencer-seeding "cast blitz" (the Kuku TV #DhoniWatchesKukuTV playbook, scaled down)

In launch week (week 6), 20 creators post the same prompt on the same evening. Diwali (Lakshmi Puja,
8 Nov 2026) falls on amavasya, the new-moon night of folklore, so post on **Sat 7 Nov, 21:00 IST**:
"**#AmavasyaKiRaat** — पिशाचिनी का Episode 1 अकेले मत देखना।" Each creator uses their own tracked link.
The brand account reposts the best ones (native Repost button) and the Pishachini account replies to each in character.
