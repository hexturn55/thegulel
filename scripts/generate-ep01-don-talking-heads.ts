/**
 * Donald Gump — Ep 01 Talking Heads Generator
 * Sends approved prompts to Atlas Cloud API (NanoBanana Pro via FLUX/Ideogram)
 * Generates 8 images per prompt, saves to assets/images/ep01-the-cart/
 *
 * Usage:
 *   npx ts-node --transpile-only scripts/generate-ep01-don-talking-heads.ts
 *
 * Requires ATLAS_CLOUD_API_KEY in .env.local
 */

import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as http from 'http';
import { config } from 'dotenv';

config({ path: '.env.local' });

const API_KEY = process.env.ATLAS_CLOUD_API_KEY;
if (!API_KEY) throw new Error('Missing ATLAS_CLOUD_API_KEY in .env.local');

const BASE_URL = 'https://api.atlascloud.ai/api/v1/model';

// Ideogram v3 — strong flat illustration / animation style
const MODEL = 'ideogram/ideogram-v3/text-to-image';

// 16:9 at 1024px wide
const WIDTH = 1024;
const HEIGHT = 576;
const IMAGES_PER_PROMPT = 8;

const OUTPUT_DIR = path.join(process.cwd(), 'assets', 'images', 'ep01-the-cart');

// ── Approved prompts (Ep 01 — Don Gump talking heads) ────────────────────────

const PROMPTS = [
  {
    id: 'A',
    scene: 'sc01',
    slug: 'neutral',
    text: [
      'Bojack Horseman animation style, flat colors, expressive character design,',
      'DON GUMP talking head — centered medium shot, slightly crooked frame,',
      'lanky tall man, 6.5 head ratio, oversized rigid golden-blond bouffant hair',
      '(moves as one solid object), wide-set earnest eyes slightly too far apart,',
      'gentle confused smile, warm peach-tan skin (#F5C89A),',
      'white Oxford shirt slightly untucked, oversized American flag lapel pin,',
      'warm lamp light, cozy living room background, warm ochre tones,',
      'NOT photorealistic, NOT 3D render',
    ].join(' '),
  },
  {
    id: 'B',
    scene: 'sc02',
    slug: 'viral-reaction',
    text: [
      'Bojack Horseman animation style, flat colors, expressive character design,',
      'DON GUMP talking head — centered medium shot, slightly crooked frame,',
      'lanky tall man, rigid golden-blond bouffant hair, wide eyes wider than usual,',
      'expression: pure baffled delight, mouth slightly open, golden retriever energy,',
      'warm peach-tan skin (#F5C89A), white Oxford shirt untucked, American flag pin,',
      'warm lamp light, living room background, warm ochre,',
      'NOT photorealistic, NOT 3D render',
    ].join(' '),
  },
  {
    id: 'C',
    scene: 'sc03',
    slug: 'candidacy',
    text: [
      'Bojack Horseman animation style, flat colors, expressive character design,',
      'DON GUMP talking head — centered medium shot, slightly crooked frame,',
      'lanky tall man, rigid golden-blond bouffant hair, sincere wide-eyed expression,',
      'slight proud smile like someone who just returned a library book on time,',
      'warm peach-tan skin (#F5C89A), white Oxford shirt untucked,',
      'American flag lapel pin prominent, warm lamp light, living room background,',
      'warm ochre tones, NOT photorealistic, NOT 3D render',
    ].join(' '),
  },
  {
    id: 'D',
    scene: 'sc04',
    slug: 'polls',
    text: [
      'Bojack Horseman animation style, flat colors, expressive character design,',
      'DON GUMP talking head — centered medium shot, slightly crooked frame,',
      'lanky tall man, rigid golden-blond bouffant hair, enormous genuine smile,',
      'eyes crinkled with joy, total innocence,',
      'warm peach-tan skin (#F5C89A), white Oxford shirt, American flag pin,',
      'warm lamp light, living room background, warm ochre tones,',
      'NOT photorealistic, NOT 3D render',
    ].join(' '),
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function downloadFile(url: string, filepath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proto = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    proto
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          return downloadFile(res.headers.location!, filepath)
            .then(resolve)
            .catch(reject);
        }
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

function extractImageUrl(data: Record<string, unknown>): string | null {
  const out = data.output as Record<string, unknown> | undefined;
  if (!out) return null;
  if (typeof out.image_url === 'string') return out.image_url;
  if (typeof out.url === 'string') return out.url;
  if (Array.isArray(out) && typeof out[0] === 'string') return out[0] as string;
  if (Array.isArray(out.images)) return (out.images as { url: string }[])[0]?.url ?? null;
  return null;
}

async function poll(requestId: string): Promise<string> {
  const url = `${BASE_URL}/prediction/${requestId}/get`;
  for (let i = 0; i < 60; i++) {
    await sleep(3000);
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = (await res.json()) as Record<string, unknown>;
    const status = data.status as string;
    process.stdout.write(`    polling (${i + 1}) status=${status}\r`);
    if (status === 'completed') {
      process.stdout.write('\n');
      const imgUrl = extractImageUrl(data);
      if (!imgUrl) throw new Error(`Completed but no image URL: ${JSON.stringify(data)}`);
      return imgUrl;
    }
    if (status === 'failed') {
      throw new Error(`Generation failed: ${JSON.stringify(data)}`);
    }
  }
  throw new Error('Polling timed out after 3 minutes');
}

async function generateOne(prompt: string, seed: number): Promise<string> {
  const res = await fetch(`${BASE_URL}/generateImage`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      prompt,
      width: WIDTH,
      height: HEIGHT,
      seed,
      negative_prompt: 'photorealistic, 3D render, photograph, CGI, realistic skin texture, hyperrealistic',
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${body}`);
  }

  const data = (await res.json()) as Record<string, unknown>;

  // Sync path
  const direct = extractImageUrl(data);
  if (direct) return direct;

  // Async path — poll
  const requestId = (data.request_id ?? data.id) as string | undefined;
  if (requestId) return poll(requestId);

  throw new Error(`Unexpected response shape: ${JSON.stringify(data)}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`\nDONALD GUMP — Ep 01 Talking Heads`);
  console.log(`Model:  ${MODEL}`);
  console.log(`Size:   ${WIDTH}x${HEIGHT} (16:9)`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  const manifest: { file: string; prompt: string; seed: number }[] = [];

  for (const prompt of PROMPTS) {
    console.log(`\n── PROMPT ${prompt.id} [${prompt.slug}] ──────────────────`);
    console.log(`   ${prompt.text.slice(0, 80)}…\n`);

    for (let take = 1; take <= IMAGES_PER_PROMPT; take++) {
      const seed = Math.floor(Math.random() * 2 ** 31);
      const filename = `ep01-${prompt.scene}-don-talking-head-${prompt.slug}-v${String(take).padStart(2, '0')}.png`;
      const filepath = path.join(OUTPUT_DIR, filename);

      process.stdout.write(`  [${take}/${IMAGES_PER_PROMPT}] seed=${seed} generating...`);

      try {
        const imageUrl = await generateOne(prompt.text, seed);
        await downloadFile(imageUrl, filepath);
        manifest.push({ file: filename, prompt: prompt.text, seed });
        console.log(` ✓ ${filename}`);
      } catch (err) {
        console.error(` ✗ FAILED: ${err}`);
      }

      if (take < IMAGES_PER_PROMPT) await sleep(800);
    }
  }

  // Write manifest for selection step
  const manifestPath = path.join(OUTPUT_DIR, '_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  console.log(`\n✓ Done — ${manifest.length} images saved`);
  console.log(`  Manifest: ${manifestPath}`);
  console.log(`\nStep 3 — review images and tell me which to keep (e.g. "Keep A3, B7, D2")`);
}

main().catch((err) => {
  console.error('\nFatal:', err.message);
  process.exit(1);
});
