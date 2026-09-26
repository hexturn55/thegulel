# Gulel: live catalog snapshot

Fetched 2026-09-26, about 10:35 to 10:50 UTC, from https://thegulel.com through the Vercel MCP (GET requests only). Read-only snapshot; nothing on the site or in `src/` was changed.

**Sources:** `/api/series?limit=50` (list, featured flag, thumbnail); `/series/{id}` HTML (the synopsis comes from the TVSeries JSON-LD, which carries the full `description` and matches the on-page `<p>` exactly; `<meta name="description">` and `og:description` are the same text cut to 160 characters); `/api/series/{id}/episodes` (episodes); `/api/search` (the only public, non-admin route that returns `titleHi`, `tags`, `freeEpisodes` and `coinPrice`, since the series page renders none of these).

**Language:** there is no per-series language field. Every series page is served with `<html lang="en">` and renders only the English `description`. Hindi appears only in `titleHi` (series and episodes).

**Totals:** 23 published series, 64 episodes, 10 featured.

## Summary

| Title | Genre | Total eps | Free eps | Ep1 duration | Featured | Series URL | Ep1 watch URL | Poster path |
|---|---|---|---|---|---|---|---|---|
| The Secret Alliance | Thriller | 2 | 1 | 1:54 (114s) | yes | https://thegulel.com/series/cmnsrbgyz000004i3tbol5dc2 | https://thegulel.com/watch/cmq2fko6q0000glj25iu8z6ga | `public/thumbnails/the-secret-alliance-poster.png` |
| The Substitute Bride | Romance | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmnsrbgip000004jo9um6h52o | https://thegulel.com/watch/cmugxhjjt000lpgkdci9w3e78 | `public/thumbnails/substitute-bride-poster.png` |
| Pishachini: The Healer | Horror | 20 | 1 | 1:36 (96s) | yes | https://thegulel.com/series/cmn2fgykv000204l2xhoqfozy | https://thegulel.com/watch/cmn2fhng3000304l26wvruij4 | `public/thumbnails/pishachini-the-healer.png` |
| Dragon's Blood | Action | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn1ugxhr0004z5nqux7yckcq | https://thegulel.com/watch/cmugxg2150004pgkdekpic2iu | `public/thumbnails/dragons-blood.png` |
| The Last Empress | Period Drama | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn1ugx1m0001z5nqh9h0tphe | https://thegulel.com/watch/cmugxhhpo000kpgkd2d3rzg7m | `public/thumbnails/the-last-empress.png` |
| Bound By Fate | Romance | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn1ugwvx0000z5nqmq5rbozn | https://thegulel.com/watch/cmugpcn6f0000dokd10a377eb | `public/thumbnails/bound-by-fate.png` |
| Forbidden Love | Romance | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn2dj8kj000004l4nklj88fx | https://thegulel.com/watch/cmugxg2bu0005pgkdzu8v4yue | `public/thumbnails/forbidden-love.png` |
| The CEO's Hidden Wife | Drama | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn2djc7u000p04l4dhc166hs | https://thegulel.com/watch/cmugxfk6o0001pgkd7gtzxuuw | `public/thumbnails/ceos-hidden-wife.png` |
| The Billionaire's Revenge | Thriller | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn2djv3o004b04l4f18wca5s | https://thegulel.com/watch/cmugxfo6q0003pgkdxyr18dnc | `public/thumbnails/billionaires-revenge.png` |
| The Mafia Lord's Bride | Crime Romance | 2 | 1 | 0:36 (36s) | yes | https://thegulel.com/series/cmn2djhr0001r04l46bfk9th0 | https://thegulel.com/watch/cmugxglwk000dpgkdcm8koa92 | `public/thumbnails/mafia-lords-bride.png` |
| Revenge of the Heir | Drama | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmugxh41y000hpgkdz3cpv8bm | https://thegulel.com/watch/cmugxh45q000ipgkd5qshctdo | Cloudflare Stream frame grab (no poster file): https://videodelivery.net/950514a24254c179d2f82a44dbf33423/thumbnails/thumbnail.jpg?time=4s&height=1280 |
| Love in Shanghai | Romance | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmugxgl1c000bpgkdf2ind6s5 | https://thegulel.com/watch/cmugxgl55000cpgkdzzgandpn | Cloudflare Stream frame grab (no poster file): https://videodelivery.net/1f9df6fe3243e5ceda66ce6cf3966cf3/thumbnails/thumbnail.jpg?time=4s&height=1280 |
| Mafia King's Heart | Crime Romance | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmugxgicf0009pgkd1x9wel34 | https://thegulel.com/watch/cmugxgivc000apgkddqrno8uc | Cloudflare Stream frame grab (no poster file): https://videodelivery.net/ac3fc639e8f7f83ca0d818e990b7c4e1/thumbnails/thumbnail.jpg?time=4s&height=1280 |
| Imperial Palace Secrets | Historical | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmugxg4dq0007pgkdzg5q9pkl | https://thegulel.com/watch/cmugxg4hi0008pgkdc1sm7vl6 | Cloudflare Stream frame grab (no poster file): https://videodelivery.net/b5698ead870f7112916ce2144c331250/thumbnails/thumbnail.jpg?time=4s&height=1280 |
| CEO's Hidden Identity | Romance | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmnsrbgwz000004kwk9n6jkay | https://thegulel.com/watch/cmugxfj6p0000pgkdk2vfspf3 | `public/thumbnails/ceo-hidden-identity-poster.png` |
| Medical Genius | Drama | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmnsrbgu7000004i8t5zz7dkd | https://thegulel.com/watch/cmugxgnyb000epgkdbj94em8d | `public/thumbnails/medical-genius-poster.png` |
| Three Weddings | Family | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn1ugxn60005z5nqgb8u338n | https://thegulel.com/watch/cmugxhmqb000mpgkdfzdin7eq | `public/thumbnails/three-weddings.png` |
| Whispers in the Dark | Horror | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn1ugxce0003z5nqceusvlmh | https://thegulel.com/watch/cmugxhop0000npgkdevw5l1ej | `public/thumbnails/whispers-in-the-dark.png` |
| Million Dollar Heart | Romance | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn1ugx710002z5nqytgnfi1d | https://thegulel.com/watch/cmugxh394000gpgkdo48dqypg | `public/thumbnails/million-dollar-heart.png` |
| Midnight Obsession | Thriller | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn2djfa2001a04l4s0r71bns | https://thegulel.com/watch/cmugxh15t000fpgkddzkhq898 | `public/thumbnails/midnight-obsession.png` |
| Broken Vows | Drama | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn2djpam003704l4gl4acmni | https://thegulel.com/watch/cmugxfkad0002pgkdr91tj3lc | `public/thumbnails/broken-vows.png` |
| Love in Beijing | Romance | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn2djlyi002k04l4jrbni7cn | https://thegulel.com/watch/cmugxg2zr0006pgkd67siclwl | `public/thumbnails/love-in-beijing.png` |
| My Stepmother's Lies | Drama | 2 | 1 | 0:36 (36s) | no | https://thegulel.com/series/cmn2djs1y003q04l4180kgzuc | https://thegulel.com/watch/cmugxh5ri000jpgkdjnxtv4el | `public/thumbnails/stepmothers-lies.png` |

## Series

### The Secret Alliance

- **Hindi title:** (none)
- **Genre:** Thriller. **Featured:** yes. **Coin price per locked episode:** 12. **Free episodes:** 1 of 2
- **Tags:** `thriller`, `conspiracy`, `alliance`
- **Series:** https://thegulel.com/series/cmnsrbgyz000004i3tbol5dc2  
  **First free episode:** https://thegulel.com/watch/cmq2fko6q0000glj25iu8z6ga
- **Poster:** `public/thumbnails/the-secret-alliance-poster.png`

**Synopsis (verbatim):**

> Four strangers bound by a deadly conspiracy must trust each other to survive — but loyalty is the most dangerous currency of all.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Dead Man's Switch | मृत व्यक्ति का स्विच | 1:54 | free | https://thegulel.com/watch/cmq2fko6q0000glj25iu8z6ga |
| 2 | Episode 2 | (none) | 1:37 | locked | https://thegulel.com/watch/cmuh3adqm000dv2kdxu9tf148 |

### The Substitute Bride

- **Hindi title:** (none)
- **Genre:** Romance. **Featured:** yes. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `romance`, `period`, `bride`
- **Series:** https://thegulel.com/series/cmnsrbgip000004jo9um6h52o  
  **First free episode:** https://thegulel.com/watch/cmugxhjjt000lpgkdci9w3e78
- **Poster:** `public/thumbnails/substitute-bride-poster.png`

**Synopsis (verbatim):**

> Sent in place of her sister on the wedding night, a young woman must navigate a loveless arrangement — until desire changes everything.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxhjjt000lpgkdci9w3e78 |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh39pq40007v2kdi8j6cls8 |

### Pishachini: The Healer

- **Hindi title:** पिशाचिनी: द हीलर
- **Genre:** Horror. **Featured:** yes. **Coin price per locked episode:** 10. **Free episodes:** 1 of 20
- **Tags:** `Horror`, `Supernatural`, `Thriller`, `Indian`, `Hindi`, `Village`, `Curse`, `Shiva`
- **Series:** https://thegulel.com/series/cmn2fgykv000204l2xhoqfozy  
  **First free episode:** https://thegulel.com/watch/cmn2fhng3000304l26wvruij4
- **Poster:** `public/thumbnails/pishachini-the-healer.png`

**Synopsis (verbatim):**

> A mysterious healer arrives in a desperate village, performing impossible miracles. But every life saved demands a death in return. When a young devotee of Shiva uncovers the dark truth — a deal with a demon — he must choose between saving the innocent and becoming the next vessel of an ancient curse. Love, power, and survival collide in this supernatural horror-thriller.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | The Arrival | आगमन | 1:36 | free | https://thegulel.com/watch/cmn2fhng3000304l26wvruij4 |
| 2 | The Miracles | चमत्कार | 1:36 | locked | https://thegulel.com/watch/cmn2fhoug000404l2niyerazo |
| 3 | The First Doubt | पहला संदेह | 0:42 | locked | https://thegulel.com/watch/cmn2fhpoz000504l283s8gz31 |
| 4 | The Confrontation | टकराव | 0:44 | locked | https://thegulel.com/watch/cmn2fhqic000604l2oin548is |
| 5 | The Forest Trail | जंगल की राह | 0:58 | locked | https://thegulel.com/watch/cmn2fhrca000704l2aer00gmc |
| 6 | The Truth Unveiled | सच का पर्दाफाश | 0:44 | locked | https://thegulel.com/watch/cmn2fhs4s000804l2ef3sx61v |
| 7 | Raghu's Past | रघु का अतीत | 0:54 | locked | https://thegulel.com/watch/cmn2fhsxk000904l2a5ujpkxt |
| 8 | The Offer | प्रस्ताव | 0:44 | locked | https://thegulel.com/watch/cmn2fhtq3000a04l2igfirzri |
| 9 | The Deception | छल | 0:46 | locked | https://thegulel.com/watch/cmn2fhuil000b04l20g5hymlc |
| 10 | The Ritual Begins | अनुष्ठान की शुरुआत | 0:48 | locked | https://thegulel.com/watch/cmn2fhvbp000c04l28rfasrkx |
| 11 | Breaking the Circle | चक्र टूटा | 0:44 | locked | https://thegulel.com/watch/cmn2fhw49000d04l2i8686pyq |
| 12 | Raghu's End | रघु का अंत | 0:48 | locked | https://thegulel.com/watch/cmn2fhwwp000e04l2nfitcawf |
| 13 | The New Beginning | नई शुरुआत | 0:44 | locked | https://thegulel.com/watch/cmn2fhxq8000f04l26gpu500h |
| 14 | The Curse Awakens | श्राप जागा | 0:44 | locked | https://thegulel.com/watch/cmn2fhyj1000g04l2s4urunp4 |
| 15 | The Binding | बंधन | 0:44 | locked | https://thegulel.com/watch/cmn2fhzbt000h04l2qjh1ccxj |
| 16 | The Struggle | संघर्ष | 0:44 | locked | https://thegulel.com/watch/cmn2fi04a000i04l2o6mc5knb |
| 17 | The Burden | बोझ | 0:40 | locked | https://thegulel.com/watch/cmn2fi0x0000j04l2nsuucfvd |
| 18 | The Possession | कब्ज़ा | 0:38 | locked | https://thegulel.com/watch/cmn2fi1pg000k04l2lkei6pxp |
| 19 | The Turning Point | मोड़ | 0:46 | locked | https://thegulel.com/watch/cmn2fi2i5000l04l2y3rc5j4v |
| 20 | The Final Choice | अंतिम चुनाव | 0:52 | locked | https://thegulel.com/watch/cmn2fi3as000m04l2f4xy2dm5 |

### Dragon's Blood

- **Hindi title:** ड्रैगन का खून
- **Genre:** Action. **Featured:** yes. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `Action`, `Martial Arts`, `Revenge`, `Hong Kong`
- **Series:** https://thegulel.com/series/cmn1ugxhr0004z5nqux7yckcq  
  **First free episode:** https://thegulel.com/watch/cmugxg2150004pgkdekpic2iu
- **Poster:** `public/thumbnails/dragons-blood.png`

**Synopsis (verbatim):**

> After her martial arts master is murdered by a shadowy triad, a young fighter goes undercover in Hong Kong's criminal underworld to find the killer. But the deeper she goes, the more she discovers about her own bloodline.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxg2150004pgkdekpic2iu |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31wu80004mmkdqeh0vm8f |

### The Last Empress

- **Hindi title:** अंतिम महारानी
- **Genre:** Period Drama. **Featured:** yes. **Coin price per locked episode:** 12. **Free episodes:** 1 of 2
- **Tags:** `Period Drama`, `Revenge`, `Palace`, `Chinese Drama`
- **Series:** https://thegulel.com/series/cmn1ugx1m0001z5nqh9h0tphe  
  **First free episode:** https://thegulel.com/watch/cmugxhhpo000kpgkd2d3rzg7m
- **Poster:** `public/thumbnails/the-last-empress.png`

**Synopsis (verbatim):**

> In the twilight of a crumbling dynasty, the young empress must navigate palace conspiracies, poisoned alliances, and forbidden love to reclaim her stolen throne. Every smile hides a dagger.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxhhpo000kpgkd2d3rzg7m |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh39v5g000av2kd9zzjz9dp |

### Bound By Fate

- **Hindi title:** किस्मत का बंधन
- **Genre:** Romance. **Featured:** yes. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `Romance`, `Drama`, `Thriller`, `Mumbai`
- **Series:** https://thegulel.com/series/cmn1ugwvx0000z5nqmq5rbozn  
  **First free episode:** https://thegulel.com/watch/cmugpcn6f0000dokd10a377eb
- **Poster:** `public/thumbnails/bound-by-fate.png`

**Synopsis (verbatim):**

> When a chance encounter at a Mumbai gala brings together a fiery journalist and a powerful industrialist, neither expects the dangerous secrets that bind their families. Love, betrayal, and fate collide in this gripping romantic thriller.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugpcn6f0000dokd10a377eb |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31egs0001mmkdy5yxa1q1 |

### Forbidden Love

- **Hindi title:** वर्जित प्यार
- **Genre:** Romance. **Featured:** yes. **Coin price per locked episode:** 8. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2dj8kj000004l4nklj88fx  
  **First free episode:** https://thegulel.com/watch/cmugxg2bu0005pgkdzu8v4yue
- **Poster:** `public/thumbnails/forbidden-love.png`

**Synopsis (verbatim):**

> She married his enemy. He never forgot her. A storm of passion and betrayal across two powerful families.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxg2bu0005pgkdzu8v4yue |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31x8d0005mmkdezgm8my0 |

### The CEO's Hidden Wife

- **Hindi title:** सीईओ की छुपी पत्नी
- **Genre:** Drama. **Featured:** yes. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djc7u000p04l4dhc166hs  
  **First free episode:** https://thegulel.com/watch/cmugxfk6o0001pgkd7gtzxuuw
- **Poster:** `public/thumbnails/ceos-hidden-wife.png`

**Synopsis (verbatim):**

> A contract marriage neither wanted — until they did. Power, desire, and secrets that can destroy everything.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxfk6o0001pgkd7gtzxuuw |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31ysn0007mmkd33loc7rm |

### The Billionaire's Revenge

- **Hindi title:** अरबपति का बदला
- **Genre:** Thriller. **Featured:** yes. **Coin price per locked episode:** 11. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djv3o004b04l4f18wca5s  
  **First free episode:** https://thegulel.com/watch/cmugxfo6q0003pgkdxyr18dnc
- **Poster:** `public/thumbnails/billionaires-revenge.png`

**Synopsis (verbatim):**

> Ten years ago, she destroyed his family. Now he has the power — and she has no idea who she just hired.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxfo6q0003pgkdxyr18dnc |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31efi0000mmkdf9k9v0yh |

### The Mafia Lord's Bride

- **Hindi title:** माफिया की दुल्हन
- **Genre:** Crime Romance. **Featured:** yes. **Coin price per locked episode:** 9. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djhr0001r04l46bfk9th0  
  **First free episode:** https://thegulel.com/watch/cmugxglwk000dpgkdcm8koa92
- **Poster:** `public/thumbnails/mafia-lords-bride.png`

**Synopsis (verbatim):**

> She ran from everything. He owned everything. Their collision was inevitable — and deadly.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxglwk000dpgkdcm8koa92 |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh38oq20001v2kdqge1z9fb |

### Revenge of the Heir

- **Hindi title:** वारिस का बदला
- **Genre:** Drama. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `New`, `Seedance 2.5`
- **Series:** https://thegulel.com/series/cmugxh41y000hpgkdz3cpv8bm  
  **First free episode:** https://thegulel.com/watch/cmugxh45q000ipgkd5qshctdo
- **Poster:** Cloudflare Stream frame grab (no poster file): https://videodelivery.net/950514a24254c179d2f82a44dbf33423/thumbnails/thumbnail.jpg?time=4s&height=1280

**Synopsis (verbatim):**

> Thrown out of the mansion as the servant's son. Ten years later, he walks back in — and buys it.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxh45q000ipgkd5qshctdo |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh39qco0009v2kdy1zq3om4 |

### Love in Shanghai

- **Hindi title:** (none)
- **Genre:** Romance. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `New`, `Seedance 2.5`
- **Series:** https://thegulel.com/series/cmugxgl1c000bpgkdf2ind6s5  
  **First free episode:** https://thegulel.com/watch/cmugxgl55000cpgkdzzgandpn
- **Poster:** Cloudflare Stream frame grab (no poster file): https://videodelivery.net/1f9df6fe3243e5ceda66ce6cf3966cf3/thumbnails/thumbnail.jpg?time=4s&height=1280

**Synopsis (verbatim):**

> A street violinist on the Bund. A billionaire heir who stops to listen. A wedding he forgot to mention.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxgl55000cpgkdzzgandpn |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh38pqa0002v2kd6t59spwa |

### Mafia King's Heart

- **Hindi title:** (none)
- **Genre:** Crime Romance. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `New`, `Seedance 2.5`
- **Series:** https://thegulel.com/series/cmugxgicf0009pgkd1x9wel34  
  **First free episode:** https://thegulel.com/watch/cmugxgivc000apgkddqrno8uc
- **Poster:** Cloudflare Stream frame grab (no poster file): https://videodelivery.net/ac3fc639e8f7f83ca0d818e990b7c4e1/thumbnails/thumbnail.jpg?time=4s&height=1280

**Synopsis (verbatim):**

> She went undercover to bring him down. He knew from day one — and let her in anyway.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxgivc000apgkddqrno8uc |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh38oah0000v2kd5himbb1d |

### Imperial Palace Secrets

- **Hindi title:** (none)
- **Genre:** Historical. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `New`, `Seedance 2.5`
- **Series:** https://thegulel.com/series/cmugxg4dq0007pgkdzg5q9pkl  
  **First free episode:** https://thegulel.com/watch/cmugxg4hi0008pgkdc1sm7vl6
- **Poster:** Cloudflare Stream frame grab (no poster file): https://videodelivery.net/b5698ead870f7112916ce2144c331250/thumbnails/thumbnail.jpg?time=4s&height=1280

**Synopsis (verbatim):**

> She saved the Emperor from a poisoned cup — and was accused of treason for it. Intrigue, loyalty and betrayal inside the Forbidden City.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxg4hi0008pgkdc1sm7vl6 |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh390180003v2kdk9qm9wb8 |

### CEO's Hidden Identity

- **Hindi title:** (none)
- **Genre:** Romance. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `CEO`, `romance`, `drama`
- **Series:** https://thegulel.com/series/cmnsrbgwz000004kwk9n6jkay  
  **First free episode:** https://thegulel.com/watch/cmugxfj6p0000pgkdk2vfspf3
- **Poster:** `public/thumbnails/ceo-hidden-identity-poster.png`

**Synopsis (verbatim):**

> A powerful CEO conceals his true identity to win the heart of the woman he loves — but secrets have a way of surfacing.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxfj6p0000pgkdk2vfspf3 |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31eu50002mmkdd78czr3i |

### Medical Genius

- **Hindi title:** (none)
- **Genre:** Drama. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `medical`, `drama`, `genius`
- **Series:** https://thegulel.com/series/cmnsrbgu7000004i8t5zz7dkd  
  **First free episode:** https://thegulel.com/watch/cmugxgnyb000epgkdbj94em8d
- **Poster:** `public/thumbnails/medical-genius-poster.png`

**Synopsis (verbatim):**

> A brilliant doctor with a mysterious past navigates hospital politics, life-or-death surgeries, and a forbidden love.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxgnyb000epgkdbj94em8d |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh397250004v2kdxrby8puh |

### Three Weddings

- **Hindi title:** तीन शादियां
- **Genre:** Family. **Featured:** no. **Coin price per locked episode:** 8. **Free episodes:** 1 of 2
- **Tags:** `Family`, `Wedding`, `Comedy`, `Jaipur`, `Romance`
- **Series:** https://thegulel.com/series/cmn1ugxn60005z5nqgb8u338n  
  **First free episode:** https://thegulel.com/watch/cmugxhmqb000mpgkdfzdin7eq
- **Poster:** `public/thumbnails/three-weddings.png`

**Synopsis (verbatim):**

> Three sisters. Three weddings. Three completely different love stories unfolding in one chaotic wedding season in Jaipur. From arranged marriages to forbidden love, this colorful family drama will make you laugh, cry, and believe in love again.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxhmqb000mpgkdfzdin7eq |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh3a8ib000bv2kdxojhb5iv |

### Whispers in the Dark

- **Hindi title:** अंधेरे की फुसफुसाहट
- **Genre:** Horror. **Featured:** no. **Coin price per locked episode:** 8. **Free episodes:** 1 of 2
- **Tags:** `Horror`, `Supernatural`, `Mystery`, `Haveli`
- **Series:** https://thegulel.com/series/cmn1ugxce0003z5nqceusvlmh  
  **First free episode:** https://thegulel.com/watch/cmugxhop0000npgkdevw5l1ej
- **Poster:** `public/thumbnails/whispers-in-the-dark.png`

**Synopsis (verbatim):**

> A young woman inherits her grandmother's ancestral haveli in Rajasthan, only to discover it harbors a 200-year-old curse. As the walls begin to whisper, she must uncover the truth before she becomes the next victim.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxhop0000npgkdevw5l1ej |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh3a9jn000cv2kdqatw9wbe |

### Million Dollar Heart

- **Hindi title:** करोड़ों का दिल
- **Genre:** Romance. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `Billionaire`, `Romance`, `Comedy`, `Bollywood`
- **Series:** https://thegulel.com/series/cmn1ugx710002z5nqytgnfi1d  
  **First free episode:** https://thegulel.com/watch/cmugxh394000gpgkdo48dqypg
- **Poster:** `public/thumbnails/million-dollar-heart.png`

**Synopsis (verbatim):**

> India's youngest tech billionaire has everything — except someone who loves him for who he really is. When he meets a small-town teacher who doesn't know his identity, he discovers what money can't buy.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxh394000gpgkdo48dqypg |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh397u60006v2kd0zevv1kg |

### Midnight Obsession

- **Hindi title:** आधी रात का जुनून
- **Genre:** Thriller. **Featured:** no. **Coin price per locked episode:** 12. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djfa2001a04l4s0r71bns  
  **First free episode:** https://thegulel.com/watch/cmugxh15t000fpgkddzkhq898
- **Poster:** `public/thumbnails/midnight-obsession.png`

**Synopsis (verbatim):**

> He watched her every move. She thought she was safe. A psychological thriller that will keep you breathless.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxh15t000fpgkddzkhq898 |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh397aj0005v2kdjggyswkp |

### Broken Vows

- **Hindi title:** टूटे वादे
- **Genre:** Drama. **Featured:** no. **Coin price per locked episode:** 10. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djpam003704l4gl4acmni  
  **First free episode:** https://thegulel.com/watch/cmugxfkad0002pgkdr91tj3lc
- **Poster:** `public/thumbnails/broken-vows.png`

**Synopsis (verbatim):**

> He betrayed her on their wedding night. Three years later, she returned — as his boss.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxfkad0002pgkdr91tj3lc |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31evz0003mmkdu9tdq3q1 |

### Love in Beijing

- **Hindi title:** (none)
- **Genre:** Romance. **Featured:** no. **Coin price per locked episode:** 8. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djlyi002k04l4jrbni7cn  
  **First free episode:** https://thegulel.com/watch/cmugxg2zr0006pgkd67siclwl
- **Poster:** `public/thumbnails/love-in-beijing.png`

**Synopsis (verbatim):**

> A small-town girl arrives in Beijing and falls for the city — and the cold, brilliant man who hates distractions.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxg2zr0006pgkd67siclwl |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh31y4v0006mmkd2c3mjx0a |

### My Stepmother's Lies

- **Hindi title:** सौतेली माँ के झूठ
- **Genre:** Drama. **Featured:** no. **Coin price per locked episode:** 9. **Free episodes:** 1 of 2
- **Tags:** `__demo__`
- **Series:** https://thegulel.com/series/cmn2djs1y003q04l4180kgzuc  
  **First free episode:** https://thegulel.com/watch/cmugxh5ri000jpgkdjnxtv4el
- **Poster:** `public/thumbnails/stepmothers-lies.png`

**Synopsis (verbatim):**

> She raised me to be invisible. But the man I'm falling for only sees me. A story of resilience and unexpected love.

| # | Title | Hindi title | Duration | Free | Watch URL |
|---|---|---|---|---|---|
| 1 | Episode 1 | (none) | 0:36 | free | https://thegulel.com/watch/cmugxh5ri000jpgkdjnxtv4el |
| 2 | Episode 2 | (none) | 0:36 | locked | https://thegulel.com/watch/cmuh39pqv0008v2kd2a0savvz |

## Data-quality flags

1. **Leftover demo rows are live.** 8 published series have the tag `__demo__` and no other tags: Forbidden Love, The CEO's Hidden Wife, The Billionaire's Revenge, The Mafia Lord's Bride, Midnight Obsession, Broken Vows, Love in Beijing, My Stepmother's Lies. 4 of them are **featured**: Forbidden Love, The CEO's Hidden Wife, The Billionaire's Revenge, The Mafia Lord's Bride.
2. **An internal production tag is visible to the public.** 4 series tagged `New` and `Seedance 2.5` (the name of an AI video model), created 2026-09-25 per the API: Revenge of the Heir, Love in Shanghai, Mafia King's Heart, Imperial Palace Secrets. Search results expose these tags. The same 4 series use a Cloudflare Stream frame grab (at 4s) as the thumbnail, not a designed poster.
3. **Generic episode titles.** 43 of 64 episodes are titled plainly "Episode N" and have no Hindi title. Only Pishachini (all 20) and The Secret Alliance ep 1 have real titles.
4. **The same placeholder-looking duration everywhere.** 42 episodes are exactly 36s long, which is every episode in 21 series. The only exceptions are Pishachini (38 to 96s) and The Secret Alliance (114s and 97s).
5. **Thin catalogue.** 22 of 23 series have exactly 2 episodes (1 free, 1 locked). Pishachini: The Healer is the only full season (20 episodes).
6. **Missing Hindi title** on 8 series, on a Hindi-first platform: The Secret Alliance, The Substitute Bride, Love in Shanghai, Mafia King's Heart, Imperial Palace Secrets, CEO's Hidden Identity, Medical Genius, Love in Beijing. The series page does not render `descriptionHi` at all (it shows only `description`, per `page.tsx`).
7. **The Secret Alliance is inconsistent.** Ep 1's Hindi title "मृत व्यक्ति का स्विच" is a literal translation of "Dead Man's Switch", while ep 2 is "Episode 2" with no Hindi. `src/app/api/series/route.ts` also carries a guard hiding a leftover `demo-series` duplicate of this title. That duplicate is not in the live list, but the live row itself has no Hindi title.
8. **Truncated share and SEO text.** `meta description` and `og:description` are cut to 160 characters mid-word on 7 series (Pishachini: The Healer, Dragon's Blood, The Last Empress, Bound By Fate, Three Weddings, Whispers in the Dark, Million Dollar Heart). For example, Pishachini's ends "…When a young devotee of Shiv".
9. **Suspect duration.** Pishachini eps 1 and 2 are both exactly 96s, while eps 3 to 20 run 38 to 58s. Ep 2's duration may have been copied from ep 1.
10. **Inconsistent tags.** Some tags are lowercase (`romance`, `thriller`, `drama`) and some are Title Case (`Romance`, `Drama`). The Substitute Bride is tagged `period` although its genre is Romance.
11. **No named characters.** None of the 23 synopses names a character. The only character name anywhere in the live data is **Raghu**, from Pishachini's episode titles (ep 7 "Raghu's Past" / रघु का अतीत, ep 12 "Raghu's End" / रघु का अंत).
