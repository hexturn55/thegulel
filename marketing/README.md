# Gulel launch marketing kit

Everything needed to launch Gulel's social channels, AI character accounts and paid funnel in Q4 2026:
strategy, research, copy, graphics and tracking. Start with the master plan, then work through the Week-0 checklist at its end.

| File | What it is |
|---|---|
| [`01-master-plan.md`](01-master-plan.md) | Strategy, targets built on the investor-deck numbers, 12-week roadmap, budget, KPIs, team, risks, **Week-0 checklist** |
| [`02-channels-and-characters.md`](02-channels-and-characters.md) | Channel architecture, handles, bios, platform rules, **AI character bibles** (voice, pillars, sample posts, image prompts) |
| [`03-content-playbook.md`](03-content-playbook.md) | Format library, hook formulas, language rules, cadence, community management, production checklist |
| [`04-paid-media.md`](04-paid-media.md) | Meta + Google campaign blueprint, **pilot test-and-greenlight rules**, budget phasing, what the deck numbers imply |
| [`05-tracking-and-funnel.md`](05-tracking-and-funnel.md) | Funnel map, `/go` short links, UTM taxonomy, event map, Meta + Google setup checklists, scoreboard, compliance |
| [`content/series-kits.md`](content/series-kits.md) | Per-series hooks, captions, hashtags and a 5-hook cut list for every pilot |
| [`content/calendar-30-days.csv`](content/calendar-30-days.csv) | Day-by-day posting calendar for the brand and character accounts (import into Sheets) |
| [`content/account-setup-runbook.md`](content/account-setup-runbook.md) | **Create the accounts:** every field to paste and every image to upload, in order (Meta Portfolio → Pages → Instagram → YouTube → WhatsApp) |
| [`content/outreach-and-messaging.md`](content/outreach-and-messaging.md) | Creator DMs and brief, WhatsApp Channel posts, WhatsApp templates, push copy, press pitch |
| [`ads/meta-ads.csv`](ads/meta-ads.csv), [`ads/google-ads.csv`](ads/google-ads.csv) | Ready-to-paste ad copy per series, within each platform's character limits |
| [`reports/Gulel social launch playbook.md`](reports/Gulel%20social%20launch%20playbook.md) | The deep-research report (sources cited), including a check of the investor-deck figures |
| [`research_notes/`](research_notes/) | Raw research notes behind the report |
| [`data/`](data/) | `investor-deck-numbers.md`, the live catalog (`catalog.json`, `live-catalog.md`), and the data files that drive the graphics |
| [`assets/`](assets/) | **All rendered graphics** (brand kit, character kits, per-series ad sets). See below |
| [`templates/`](templates/) | The HTML templates + renderer that produce `assets/`. Edit copy in `data/*.json` and re-render |

## Graphics

```
assets/
  brand/                 profile pictures, YouTube banner + watermark, Facebook cover, WhatsApp Channel icon,
                         IG highlight covers, launch carousel (5), story templates, Google Ads logos,
                         Play feature graphic, link-preview image
  characters/{id}/       per AI character: profile, FB cover, YT banner, 3-slide intro carousel,
                         signature in-world post, Q&A story, Reel cover
  ads/{series}/          per series: Meta 9:16 / 4:5 / 1:1, Google 1200×628 / 1200×1200 / 960×1200,
                         Reel/Short end card, YouTube full-pilot thumbnail
```

Every graphic that shows an AI-generated person carries a visible **"AI-generated · एआई द्वारा निर्मित"** label.
India's IT Amendment Rules 2026, ASCI and the Meta/YouTube/Google policies all require disclosure; see `05` §8.

### Re-rendering and regenerating

```bash
npm ci                                   # @playwright/test is already a devDependency
npx playwright install chromium          # once, if no browser is installed
node marketing/templates/render.mjs      # all graphics → marketing/assets/
node marketing/templates/render.mjs ads/pishachini   # just one folder
node marketing/templates/copy.mjs        # content/series-kits.md + ads/*.csv (fails on any over-limit line)
node marketing/templates/calendar.mjs    # content/calendar-30-days.csv
```

| Data file | Drives |
|---|---|
| `data/catalog.json` | Live synopses, episode IDs, deep links (pulled from thegulel.com on 26 Sep 2026) |
| `data/hooks.json` | Per-series hook, colours and crop for every ad graphic; `verify: true` marks `__demo__`-tagged series |
| `data/series-copy.json` | 5 hook cuts, Hinglish line, hashtags per series → kits, ad CSVs, calendar |
| `data/characters.json` | The four AI character accounts → character kits and calendar |

- Change a hook, name or colour in the data files, then re-render and re-run the generators.
- Layouts live in `templates/brand.mjs`, `templates/characters.mjs` and `templates/ads.mjs`.
- Fonts are bundled in `templates/fonts/`: Anton, Inter, Mukta, Rozha One, Kalam and others, all SIL Open Font License, from Google Fonts.
- Character faces are cropped from the series key art in `public/thumbnails/`. Once you have episode frame grabs or
  a locked character sheet, point `poster` and `face` at the new image.
