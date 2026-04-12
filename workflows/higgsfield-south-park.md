# Higgsfield — South Park Style Workflow

Generate South Park-style animated imagery and video clips using Higgsfield
via Playwright browser control.

---

## Prerequisites

Playwright MCP must be installed and active:

```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

Restart Claude, then verify with `/mcp` — you should see `playwright` listed.

---

## Tools

| Tool | Purpose |
|---|---|
| **NanoBanana Pro** | Image generation |
| **Cinema Studio** | Video generation |

---

## Default Settings (NanoBanana Pro)

| Setting | Value |
|---|---|
| Aspect ratio | 16:9 |
| Image count | 8 |
| 2K unlimited | ON |
| Extra free gens | OFF |

---

## South Park Visual Style Guide

Apply these style descriptors to every prompt:

```
south park animation style, construction paper cutout aesthetic,
flat 2D characters, bold black outlines, limited animation,
saturated primary colors, simple geometric shapes,
kenny parka, cartman-esque proportions, trey parker matt stone
```

### Color Palette
- Background: flat solid colors (sky blue, green grass, grey streets)
- Characters: bold fills, no gradients, thick outlines
- Avoid: photorealism, 3D shading, smooth gradients

### Character Proportions
- Large round heads, small bodies
- Minimal facial detail (dot eyes, simple mouth)
- Oversized winter clothing where applicable

---

## Workflow Steps

### Step 1 — Open Higgsfield

```
Use playwright to open higgsfield.ai
```

Log in manually, then tell Claude to continue.

### Step 2 — Configure NanoBanana Pro

```
Use playwright to open NanoBanana Pro.

Set:
- Aspect ratio: 16:9
- Image count: 8
- 2K unlimited: ON
- Extra free gens: OFF
```

### Step 3 — Generate Images

Provide a scene prompt. Claude will prepend the South Park style guide automatically.

**Example prompt:**
```
Generate 8 images:

Scene: [YOUR SCENE DESCRIPTION]

Style: south park animation style, construction paper cutout aesthetic,
flat 2D characters, bold black outlines, saturated primary colors,
simple geometric shapes, trey parker matt stone art direction

Aspect ratio: 16:9
```

### Step 4 — Select Best Images

Review the 8 outputs. Tell Claude which to keep:

```
Keep images 2, 5, and 7. Discard the rest.
```

### Step 5 — Generate Video (Cinema Studio)

```
Use playwright to open Cinema Studio.

Use selected image [X] as the base frame.

Generate a 5-second clip:
- Motion: subtle character idle animation, slight paper cutout jitter
- Camera: static wide shot
- Style: south park construction paper aesthetic
```

---

## Donald Gump — South Park Scene Prompts

Pre-built prompts for the Donald Gump animated series:

### Scene: The Parking Lot (Pilot)
```
south park style flat 2D animation, construction paper cutout,
a lanky simple-faced man in an oversized american flag pin returning
shopping carts in a piggly wiggly parking lot, small southern town,
sunny day, bold outlines, saturated colors, 16:9
```

### Scene: Press Conference
```
south park style flat 2D animation, construction paper cutout,
bumbling politician at a podium with too many american flags,
confused expression, PBS documentary camera crew visible,
bold outlines, saturated primary colors, 16:9
```

### Scene: Senate Chamber
```
south park style flat 2D animation, construction paper cutout,
dim lovable southerner sitting in a giant senate chamber looking lost,
surrounded by serious-looking senators, construction paper cutout aesthetic,
bold outlines, 16:9
```

### Scene: Debate Stage
```
south park style flat 2D animation, construction paper cutout,
two politicians on a debate stage, one calm and oblivious,
one visibly furious and red-faced, bright studio lights,
bold outlines, flat colors, 16:9
```

---

## Batch Generation (Multiple Scenes)

To generate all Donald Gump scenes in one session:

```
Use playwright to open Higgsfield NanoBanana Pro.

Set: 16:9, 8 images, 2K unlimited ON.

Run the following prompts in sequence, saving outputs between each:

1. [PROMPT 1]
2. [PROMPT 2]
3. [PROMPT 3]

After each generation, pause for me to review before continuing.
```

---

## Output Organization

After generation, Claude will save selected outputs to:

```
/public/pitch/donald-gump/
  images/     ← selected stills from NanoBanana Pro
  videos/     ← exported clips from Cinema Studio
```

---

## Quick Start

```
Use playwright to open higgsfield.ai, log in, then open NanoBanana Pro.

Set aspect ratio to 16:9, image count to 8, 2K unlimited ON.

Generate the Donald Gump parking lot scene using the south park style prompt
from the workflow file.
```
