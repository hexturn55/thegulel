// Per-series paid + organic creatives, driven by data/hooks.json.
//
// For every series: Meta 9:16 / 4:5 / 1:1 statics, Google Demand Gen
// 1.91:1 / 1:1 / 4:5, a Shorts/Reels end card and a YouTube full-pilot
// thumbnail. Text stays inside Meta's Reels safe zone (top 14%, bottom 35%).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, poster, wordmark, aiLabel, esc } from './lib.mjs';

const HOOKS = path.join(ROOT, 'marketing/data/hooks.json');

/** Big Hindi hook with an optional Hinglish/English subline. */
function hook(s, size, sub = true) {
  return `<p class="hi shadow-text" style="font-size:${size}px;font-weight:800;line-height:1.08">${s.hookHi}</p>
    ${sub && s.hookEn ? `<p class="shadow-text" style="margin-top:${size * 0.28}px;font-size:${size * 0.42}px;font-weight:600;color:#f4f4f5;line-height:1.25">${esc(s.hookEn)}</p>` : ''}`;
}

const cta = (size, label = 'Episode 1 FREE · अभी देखें') =>
  `<span class="pill cta" style="font-size:${size}px;padding:${size * 0.5}px ${size}px"><span class="play"></span>${label}</span>`;

const titleTag = (s, size) =>
  `<p style="font-size:${size}px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:${s.accent}">${esc(s.genreLabel)}</p>
   <p class="display" style="margin-top:${size * 0.35}px;font-size:${size * 2.6}px">${esc(s.title)}</p>`;

export default function adJobs() {
  if (!fs.existsSync(HOOKS)) return [];
  const series = JSON.parse(fs.readFileSync(HOOKS, 'utf8'));
  const jobs = [];
  for (const s of series) {
    const img = poster(s.poster);
    const pos = s.focus ?? '50% 30%';
    const add = (out, w, h, html, extra = {}) => jobs.push({ out: `ads/${s.alias}/${out}`, w, h, html, ...extra });

    // Meta 9:16 — Reels/Stories. Hook + CTA sit between 14% and 65% of the height.
    add('meta-9x16.jpg', 1080, 1920, page(
      `<img class="cover" src="${img}" style="object-position:${pos}">
       <div class="fill" style="background:linear-gradient(180deg,rgba(10,10,15,.75) 0%,rgba(10,10,15,0) 22%,rgba(10,10,15,0) 38%,rgba(10,10,15,.88) 56%,rgba(10,10,15,.985) 70%,#0a0a0f 100%)"></div>
       ${s.noLogo ? '' : `<div style="position:absolute;top:280px;left:64px">${wordmark(210)}</div>`}
       ${aiLabel({ top: s.chipTop9 ?? 290, right: 60, size: 24 })}
       <div style="position:absolute;left:64px;right:64px;bottom:${s.hookBottom9 ?? 670}px">
         ${titleTag(s, 26)}
         <div style="margin-top:26px">${hook(s, 74)}</div>
         <div style="margin-top:34px">${cta(34)}</div>
       </div>
       <div style="position:absolute;left:64px;right:64px;top:1330px;display:flex;justify-content:space-between;align-items:center;opacity:.8">
         <span style="font-size:30px;font-weight:700">Episode 2 → thegulel.com/go/${s.alias}</span>${wordmark(150)}</div>`));

    // Meta 4:5 — Feed.
    add('meta-4x5.jpg', 1080, 1350, page(
      `<img class="cover" src="${img}" style="object-position:${pos}">
       <div class="fill" style="background:linear-gradient(180deg,rgba(10,10,15,.6) 0%,rgba(10,10,15,0) 18%,rgba(10,10,15,0) 40%,rgba(10,10,15,.9) 68%,rgba(10,10,15,.97) 100%)"></div>
       ${s.noLogo ? '' : `<div style="position:absolute;top:48px;left:56px">${wordmark(190)}</div>`}
       ${aiLabel({ top: s.chipTop45 ?? 56, right: 52, size: 22 })}
       <div style="position:absolute;left:56px;right:56px;bottom:60px">
         ${titleTag(s, 24)}
         <div style="margin-top:22px">${hook(s, 66)}</div>
         <div style="margin-top:30px;display:flex;align-items:center;justify-content:space-between">${cta(30)}
           <span style="font-size:28px;font-weight:700;color:#e4e4e7">thegulel.com/go/${s.alias}</span></div>
       </div>`));

    // Meta 1:1 — split: copy left, poster right.
    const square = (W, scale) => page(
      `<div class="fill" style="background:radial-gradient(circle at 0% 100%,${s.glow ?? '#3b0a17'} 0%,#0a0a0f 60%)"></div>
       <img src="${img}" style="position:absolute;right:0;top:0;height:${W * 1.32}px;width:${W * 0.5}px;object-fit:cover;object-position:50% 0%;
         -webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 22%)">
       <div style="position:absolute;left:${56 * scale}px;top:${56 * scale}px">${wordmark(170 * scale)}</div>
       <div style="position:absolute;left:${56 * scale}px;width:${W * 0.58}px;bottom:${64 * scale}px">
         ${titleTag(s, 22 * scale)}
         <div style="margin-top:${22 * scale}px">${hook(s, 58 * scale)}</div>
         <div style="margin-top:${30 * scale}px">${cta(28 * scale)}</div>
       </div>
       ${aiLabel({ bottom: 20 * scale, right: 20 * scale, size: 18 * scale })}`);
    add('meta-1x1.jpg', 1080, 1080, square(1080, 1));

    // Google Demand Gen / Display.
    add('google-1200x628.jpg', 1200, 628, page(
      `<img class="cover" src="${img}" style="object-position:${pos};filter:blur(18px) brightness(.35);transform:scale(1.1)">
       <img src="${img}" style="position:absolute;right:48px;top:34px;height:560px;aspect-ratio:9/16;object-fit:cover;border-radius:22px;box-shadow:0 20px 60px rgba(0,0,0,.6)">
       <div style="position:absolute;left:56px;top:48px">${wordmark(150)}</div>
       <div style="position:absolute;left:56px;width:760px;bottom:56px">
         ${titleTag(s, 18)}
         <div style="margin-top:16px">${hook(s, 52)}</div>
         <div style="margin-top:24px">${cta(24)}</div>
       </div>
       ${aiLabel({ top: 50, right: 380, size: 16 })}`));
    add('google-1200x1200.jpg', 1200, 1200, square(1200, 1.11));
    add('google-960x1200.jpg', 960, 1200, page(
      `<img class="cover" src="${img}" style="object-position:${pos}">
       <div class="fill" style="background:linear-gradient(180deg,rgba(10,10,15,.55) 0%,rgba(10,10,15,0) 18%,rgba(10,10,15,0) 40%,rgba(10,10,15,.9) 68%,rgba(10,10,15,.97) 100%)"></div>
       ${s.noLogo ? '' : `<div style="position:absolute;top:44px;left:50px">${wordmark(170)}</div>`}
       ${aiLabel({ top: s.chipTop45 ? s.chipTop45 * 0.89 : 50, right: 46, size: 20 })}
       <div style="position:absolute;left:50px;right:50px;bottom:54px">
         ${titleTag(s, 21)}
         <div style="margin-top:20px">${hook(s, 58)}</div>
         <div style="margin-top:26px">${cta(27)}</div>
       </div>`));

    // End card for the last 2 s of every Reel/Short cut from this series.
    add('endcard-1080x1920.jpg', 1080, 1920, page(
      `<img class="cover" src="${img}" style="object-position:${pos};filter:blur(14px) brightness(.4);transform:scale(1.08)">
       <div class="fill" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px 200px">
         <div style="margin-bottom:28px">${aiLabel({ size: 24 })}</div>
         <img src="${img}" style="width:420px;aspect-ratio:9/16;object-fit:cover;border-radius:28px;box-shadow:0 30px 80px rgba(0,0,0,.7)">
         <p class="hi shadow-text" style="margin-top:56px;font-size:78px;font-weight:800;line-height:1.08">${s.endcardHi}</p>
         <p style="margin-top:22px;font-size:40px;font-weight:700">Episode 2 → <span style="color:var(--amber)">thegulel.com/go/${s.alias}</span></p>
         <p style="margin-top:14px;font-size:30px;color:#d4d4d8">Link in bio · Episode 1 FREE</p>
         <div style="margin-top:44px">${wordmark(260)}</div>
       </div>`));

    // YouTube long-form thumbnail for the full-pilot upload.
    add('youtube-thumb-1280x720.jpg', 1280, 720, page(
      `<img class="cover" src="${img}" style="object-position:${pos};filter:blur(20px) brightness(.35);transform:scale(1.1)">
       <img src="${img}" style="position:absolute;left:60px;top:40px;height:640px;aspect-ratio:9/16;object-fit:cover;border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.6)">
       <div style="position:absolute;left:470px;right:60px;top:70px;bottom:70px;display:flex;flex-direction:column;justify-content:center">
         <p class="pill" style="align-self:flex-start;background:var(--amber);color:#111;font-size:30px;padding:10px 26px">FULL EPISODE 1 · पूरा एपिसोड</p>
         <p class="hi shadow-text" style="margin-top:26px;font-size:${s.thumbSize ?? 80}px;font-weight:800;line-height:1.04">${s.thumbHi ?? s.hookHi}</p>
         <p class="display" style="margin-top:22px;font-size:54px;color:${s.accent}">${esc(s.title)}</p>
       </div>
       <div style="position:absolute;right:40px;top:34px">${wordmark(170)}</div>`));
  }
  return jobs;
}
