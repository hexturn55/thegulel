# DONALD GUMP — Production CLAUDE.md

# Animated Series · Season 1 · Higgsfield Pipeline

-----

## 1. PROJECT IDENTITY

**Show:** Donald Gump
**Format:** Satirical animated mockumentary
**Style reference:** Bojack Horseman (flat, expressive) × early-era Veep energy
**Tone:** Warm absurdism. Never mean. Always pointed.
**Episodes:** 6 × 30 min

-----

## 2. TOOLS

|Task                          |Tool                                  |
|------------------------------|--------------------------------------|
|Character image generation    |Higgsfield NanoBanana Pro             |
|Scene / environment generation|Higgsfield NanoBanana Pro             |
|Animated shot generation      |Higgsfield Cinema Studio              |
|Talking head sequences        |Higgsfield Cinema Studio              |
|Asset organization            |Local folder structure (see Section 7)|

-----

## 3. DEFAULT GENERATION SETTINGS

**Always apply these unless I say otherwise:**

```
Model:        NanoBanana Pro
Aspect ratio: 16:9
Image count:  8 per prompt
Resolution:   2K Unlimited ON
Extra free gens: OFF
Style lock:   ON (after first approved character frame)
```

**For video shots (Cinema Studio):**

```
Duration:     4–6 seconds per shot
Motion:       Subtle — characters breathe, blink, hair moves slightly
Camera:       Locked off for talking heads / slow push for dramatic beats
FPS:          24
```

-----

## 4. CHARACTER BIBLE — VISUAL SPECS

### DON GUMP

```
Hair:         Oversized golden-blond bouffant. Rigid. Moves as one object. Never flows.
Skin:         Warm peach-tan (#F5C89A)
Height:       Tallest in frame. 6.5 head ratio. Lanky.
Clothes:      White Oxford shirt, slightly untucked. Blue pants, 1" too short.
              White socks always visible. Oversized American flag lapel pin.
Hands:        Noticeably small. Never comment on this in prompts.
Expression:   Default = gentle confused smile. Like a golden retriever.
Eyes:         Wide-set, earnest, slightly too far apart.
```

### CHERYL GUMP

```
Hair:         Severe dark chignon. Never a strand loose (until Ep 5).
Skin:         Warm medium tone (#E8B88A)
Height:       5'7" — drawn perfectly proportioned. 7 head ratio.
Clothes:      Navy power suit. Always. Small gold stud earrings. Clipboard in hand.
Expression:   Controlled thin smile. Right eye twitches 0.3s after misleading statements.
Eyes:         Sharp, slightly narrow. Always calculating.
```

### BRAD KOWALSKI

```
Hair:         Thinning brown. Disheveled. Gets progressively worse each episode.
Skin:         Medium warm tone (#D4A882). Stubble grows across season.
Height:       5'10" — slight hunch by Ep 4.
Clothes:      Olive field jacket. Dark chinos. Scuffed boots. Press badge. Camera always present.
Glasses:      Round, wire-frame. One lens slightly smudged by Ep 5.
Expression:   Haunted. Tired. Like someone doing a risk assessment on everything.
```

### SENATOR WHITMORE

```
Hair:         Immaculate silver at temples. Presidential. $800 haircut energy.
Skin:         Classic patrician tone (#E8C89A)
Height:       6'1" — 7.5 head ratio. Classically "presidential." Posture degrades by Ep 4.
Clothes:      Midnight navy suit ($4,000 energy). Crimson tie. Mirror-shined Oxford shoes.
              Pocket square: white, perfect fold. Flag pin (larger than Don's).
Expression:   Starts confident. Temple vein appears under stress (grows each episode).
```

-----

## 5. WORLD & ENVIRONMENT SPECS

### Beaufort, SC (Don's world)

```
Color palette:  Warm ochres, dusty sage greens, Southern Gothic haze
Light:          Golden hour whenever possible. Soft, nostalgic.
Architecture:   Wood-frame houses, Spanish moss, wide porches, Piggly Wiggly parking lots
Mood:           America as a memory of itself
```

### Washington DC (Political world)

```
Color palette:  Cold institutional blues, fluorescent whites, marble greys
Light:          Harsh overhead. Unflattering. Intentional.
Architecture:   Monumental. Columns. Flags. Everything slightly too large for humans.
Mood:           A machine that forgot people run it
```

### Talking Head Setup (Documentary layer)

```
Don:        Slightly crooked frame. Warm lamp light. Background: living room.
Cheryl:     Perfectly centered. Symmetric. Flag in background. Navy.
Brad:       Ep 1 = perfect framing. Degrades each episode. Off-center by Ep 6.
Whitmore:   Formal. American flag. Immaculate. Until Ep 5.
```

-----

## 6. PROMPT WRITING RULES

**Always follow these when generating prompts:**

1. **Lead with style:** Start every prompt with `Bojack Horseman animation style, flat colors, expressive character design,`
1. **State the character first:** `DON GUMP — [description]`
1. **Include color grounding:** Always reference the character's palette hex or descriptor
1. **Specify shot type:** `close-up`, `medium shot`, `wide establishing`, `talking head — centered`
1. **Include lighting:** `warm golden hour` (Beaufort) or `cold fluorescent` (DC)
1. **No photo-realism:** Add `NOT photorealistic, NOT 3D render` to every prompt
1. **Consistency lock:** After first approved frame of any character, add `style-locked reference [filename]`

**Example prompt (Don, talking head):**

```
Bojack Horseman animation style, flat colors, expressive character design,
DON GUMP talking head shot — centered medium shot, slightly crooked frame,
lanky tall man, oversized golden-blond rigid bouffant hair, wide earnest eyes,
gentle confused smile, white Oxford shirt with American flag pin, warm peach skin,
warm lamp light background, living room setting, NOT photorealistic, NOT 3D render
```

-----

## 7. FOLDER STRUCTURE

```
donald-gump-production/
├── CLAUDE.md                  ← this file
├── reference/
│   ├── characters/
│   │   ├── don-gump/
│   │   ├── cheryl-gump/
│   │   ├── brad-kowalski/
│   │   └── senator-whitmore/
│   ├── environments/
│   │   ├── beaufort-sc/
│   │   └── washington-dc/
│   └── style-frames/          ← approved look-dev frames
├── episodes/
│   ├── ep01-the-cart/
│   ├── ep02-the-wallet/
│   ├── ep03-the-debate/
│   ├── ep04-deep-state/
│   ├── ep05-brads-crisis/
│   └── ep06-super-tuesday/
├── assets/
│   ├── images/                ← approved stills
│   └── videos/                ← generated shots
└── output/
    └── selects/               ← final approved assets
```

**File naming convention:**

```
[ep##]-[scene##]-[character]-[shot-type]-[take##].png
Example: ep01-sc03-don-talking-head-v02.png
```

-----

## 8. WORKFLOW — STANDARD SHOT GENERATION

**Default sequence. Follow this unless I say otherwise:**

```
Step 1 — PROMPT REVIEW
  Generate prompts. Show me first. Do NOT generate yet.
  Wait for my approval or edits.

Step 2 — IMAGE GENERATION
  Open NanoBanana Pro in Higgsfield.
  Apply default settings (Section 3).
  Generate 8 images per approved prompt.
  Save all to /assets/images/[episode folder]/

Step 3 — SELECTION
  Present the 8 images. Ask me to pick 1–3 selects.
  Move selects to /output/selects/
  Discard the rest.

Step 4 — VIDEO GENERATION (if needed)
  Open Cinema Studio.
  Use approved select as input frame.
  Apply video settings (Section 3).
  Save to /assets/videos/[episode folder]/

Step 5 — REVIEW
  Present output. Wait for notes.
```

**Key rule:** Never skip Step 1. Always show prompts before generating.

-----

## 9. EPISODE-SPECIFIC NOTES

|Episode|Key Visual                             |Color Emphasis                   |Special Notes                                              |
|-------|---------------------------------------|---------------------------------|-----------------------------------------------------------|
|Ep 01  |Piggly Wiggly parking lot, golden hour |Warm ochre                       |Establish Don's palette here. Style lock from this episode.|
|Ep 02  |DC establishing shots, Capitol building|Cold blue shift begins           |First Don-in-DC contrast shots                             |
|Ep 03  |Debate stage                           |High contrast, harsh key light   |Whitmore temple vein appears. Brad's stubble visible.      |
|Ep 04  |Intelligence office interiors          |Fluorescent green-tint           |Paranoid framing. Low angles.                              |
|Ep 05  |Brad's apartment                       |Desaturated, 2am light           |Cheryl's one escaped hair strand. Brad puts camera down.   |
|Ep 06  |Rally stage → quiet room               |Full contrast between both worlds|Whitmore's 11-second void stare. Hold the frame.           |

-----

## 10. RULES — ALWAYS FOLLOW

- **Never generate without showing prompts first**
- **Never use photorealistic style** — always flat animation
- **Always maintain character consistency** — reference approved frames
- **Always ask before deleting any asset**
- **Hair is sacred** — Don's hair is rigid, Cheryl's is perfect (until Ep 5 sc 4)
- **Whitmore degrades** — his posture and expression must visibly worsen each episode
- **Brad's stubble grows** — track this across episodes, never reset it
- **Show, don't tell** — environmental color shift IS the tonal shift, don't add text overlays

-----

## 11. QUICK COMMANDS

|Say this                                        |Claude does this                                                    |
|------------------------------------------------|--------------------------------------------------------------------|
|`Generate talking heads for [character] Ep [##]`|Prompts → approval → generate 8 → present selects                   |
|`Environment: [location] [episode]`             |Generates establishing shots with correct color palette             |
|`Debate scene, shot list`                       |Generates full sequence prompt set for review                       |
|`Style lock [character]`                        |Saves approved frame as reference, applies to all future generations|
|`Show me selects`                               |Opens /output/selects/ and displays current approved assets         |
|`Run full Ep [##] batch`                        |Queues all scenes for that episode, waits for approval at each step |

-----

*Last updated: Season 1 Pre-Production*
*Claude Code + Higgsfield Cinema Studio + NanoBanana Pro*

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
