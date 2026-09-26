// AI-character account kits, driven by data/characters.json.
//
// Per character: profile picture, Facebook cover, YouTube banner, a 3-slide
// "meet me" intro carousel, an in-world signature post template, a Q&A story
// template and a Reel cover. Faces are cropped from the series key art, so
// the account and the show share one face. Swap in episode frame grabs or a
// locked character sheet as soon as you have them (same crop fields).
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, page, poster, wordmark, aiLabel, esc } from './lib.mjs';

const DATA = path.join(ROOT, 'marketing/data/characters.json');

/**
 * Crop a poster so the face at (fx, fy) — fractions of the poster — sits at
 * (cx, cy) of a box, with `side` = fraction of poster width that spans boxW.
 */
function faceCrop(c, boxW, boxH, { cx = 0.5, cy = 0.45, side = c.face.side } = {}) {
  const imgW = boxW / side;
  const imgH = (imgW * 16) / 9;
  const left = cx * boxW - c.face.x * imgW;
  const top = cy * boxH - c.face.y * imgH;
  return `<img src="${poster(c.poster)}" style="position:absolute;left:${left}px;top:${top}px;width:${imgW}px;height:${imgH}px;max-width:none">`;
}

export default function characterJobs() {
  if (!fs.existsSync(DATA)) return [];
  const chars = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const jobs = [];
  for (const c of chars) {
    const add = (out, w, h, html) => jobs.push({ out: `characters/${c.id}/${out}`, w, h, html });
    const ring = `linear-gradient(135deg,${c.accent} 0%,${c.accent2} 100%)`;
    const font = c.font ?? 'hi';

    // Profile picture — face centred for a circular crop, accent ring.
    add('profile-1080.png', 1080, 1080, page(
      `<div class="fill" style="background:${ring}"></div>
       <div style="position:absolute;inset:34px;border-radius:50%;overflow:hidden;background:#000">${faceCrop(c, 1012, 1012, { cy: 0.46 })}</div>`));

    // Facebook Page cover (1640×624) — face right, persona line left.
    add('facebook-cover-1640x624.jpg', 1640, 624, page(
      `<div class="fill" style="background:${c.bg}"></div>
       <div style="position:absolute;right:0;top:0;width:900px;height:624px;overflow:hidden;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 35%)">
         ${faceCrop(c, 900, 624, { cx: 0.6, cy: 0.45, side: c.face.side * 1.6 })}</div>
       <div style="position:absolute;left:280px;top:0;bottom:0;width:720px;display:flex;flex-direction:column;justify-content:center">
         <p style="font-size:24px;font-weight:800;letter-spacing:.25em;color:${c.accent}">${esc(c.series.toUpperCase())}</p>
         <p class="${font}" style="margin-top:10px;font-size:78px;font-weight:800;line-height:1">${c.nameHi}</p>
         <p class="hi" style="margin-top:16px;font-size:34px;font-weight:600;color:#e4e4e7;line-height:1.25">${c.taglineHi}</p>
         <p style="margin-top:22px;font-size:24px;color:#a1a1aa">AI character · Gulel Original · Episode 1 free → thegulel.com/go/${c.alias}</p>
       </div>`));

    // YouTube banner (2560×1440) — content inside the 1546×423 safe area.
    add('youtube-banner-2560x1440.jpg', 2560, 1440, page(
      `<div class="fill" style="background:${c.bg}"></div>
       <div style="position:absolute;left:0;right:0;top:0;bottom:0;overflow:hidden;opacity:.55">${faceCrop(c, 2560, 1440, { cx: 0.72, cy: 0.42, side: c.face.side * 1.4 })}</div>
       <div class="fill" style="background:radial-gradient(ellipse 45% 40% at 42% 50%,rgba(10,10,15,.92) 0%,rgba(10,10,15,.5) 70%,rgba(10,10,15,.2) 100%)"></div>
       <div class="fill" style="display:flex;align-items:center;justify-content:center">
         <div style="width:1546px;height:423px;display:flex;flex-direction:column;justify-content:center;padding-left:40px">
           <p style="font-size:30px;font-weight:800;letter-spacing:.25em;color:${c.accent}">${esc(c.series.toUpperCase())} · GULEL ORIGINAL</p>
           <p class="${font}" style="margin-top:12px;font-size:120px;font-weight:800;line-height:1">${c.nameHi}</p>
           <p class="hi" style="margin-top:14px;font-size:46px;font-weight:600">${c.taglineHi}</p>
         </div>
       </div>`));

    // Intro carousel (4:5).
    add('intro-1-1080x1350.jpg', 1080, 1350, page(
      `<div class="fill" style="overflow:hidden">${faceCrop(c, 1080, 1350, { cy: 0.36, side: c.face.side * 1.25 })}</div>
       <div class="fill grad-bottom"></div>
       ${aiLabel({ top: 50, right: 50, size: 24, text: 'AI character · एआई किरदार' })}
       <div style="position:absolute;left:70px;right:70px;bottom:80px">
         <p style="font-size:28px;font-weight:800;letter-spacing:.25em;color:${c.accent}">MEET · मिलिए</p>
         <p class="${font} shadow-text" style="margin-top:8px;font-size:112px;font-weight:800;line-height:1">${c.nameHi}</p>
         <p class="hi shadow-text" style="margin-top:16px;font-size:42px;font-weight:600;line-height:1.25">${c.roleHi}</p>
       </div>`));
    add('intro-2-1080x1350.jpg', 1080, 1350, page(
      `<div class="fill" style="background:${c.bg}"></div>
       <div style="position:absolute;right:-60px;bottom:0;width:760px;height:900px;overflow:hidden;opacity:.5;
         -webkit-mask-image:radial-gradient(ellipse 60% 60% at 62% 45%,#000 35%,transparent 72%)">
         ${faceCrop(c, 760, 900, { cx: 0.62, cy: 0.42, side: c.face.side * 1.15 })}</div>
       <div style="position:absolute;left:70px;right:70px;top:100px">
         <p style="font-size:30px;font-weight:800;letter-spacing:.22em;color:${c.accent}">${esc(c.aboutLabel ?? 'ABOUT ME')}</p>
         ${c.facts.map((f) => `<p class="hi shadow-text" style="margin-top:56px;font-size:62px;font-weight:800;line-height:1.2;max-width:820px">
             <span style="color:${c.accent}">—</span> ${f}</p>`).join('')}
       </div>
       <div style="position:absolute;left:70px;right:70px;bottom:70px;display:flex;justify-content:space-between;align-items:center">
         ${wordmark(180)}<span style="font-size:24px;color:#d4d4d8">AI character from ${esc(c.series)}</span></div>`));
    add('intro-3-1080x1350.jpg', 1080, 1350, page(
      `<div class="fill" style="overflow:hidden;filter:brightness(.5)">${faceCrop(c, 1080, 1350, { cy: 0.3, side: Math.min(1, c.face.side * 2.2) })}</div>
       <div class="fill" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:0 80px">
         <p class="hi shadow-text" style="font-size:78px;font-weight:800;line-height:1.1">${c.ctaHi}</p>
         <p class="pill cta" style="margin-top:44px;font-size:38px;padding:20px 40px"><span class="play"></span> Episode 1 FREE</p>
         <p style="margin-top:28px;font-size:34px;font-weight:700">Link in bio → thegulel.com/go/${c.alias}</p>
       </div>
       ${aiLabel({ bottom: 50, left: 50, size: 22, text: 'AI-generated · एआई द्वारा निर्मित' })}`));

    // Signature in-world post template (4:5) — the account's recurring format.
    const sig = c.signature;
    add(`signature-${sig.slug}-1080x1350.jpg`, 1080, 1350, page(
      `<div class="fill" style="background:${sig.bg ?? c.bg}"></div>
       ${sig.paper ? `<div style="position:absolute;inset:60px;background:#f4ead5;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,.5);
           background-image:repeating-linear-gradient(0deg,transparent 0 78px,rgba(90,60,30,.18) 78px 80px)"></div>` : ''}
       ${sig.paper ? '' : `<div style="position:absolute;right:0;top:0;width:620px;height:1350px;overflow:hidden;opacity:.28;-webkit-mask-image:linear-gradient(90deg,transparent 0%,#000 60%)">
         ${faceCrop(c, 620, 1350, { cx: 0.6, cy: 0.4, side: c.face.side * 1.2 })}</div>`}
       <div style="position:absolute;inset:${sig.paper ? '120px 120px' : '100px 80px'};display:flex;flex-direction:column;color:${sig.paper ? '#3a2412' : '#fff'}">
         <p style="font-size:30px;font-weight:800;letter-spacing:.2em;color:${sig.paper ? '#9a3412' : c.accent}">${esc(sig.kicker)}</p>
         <p class="${sig.font ?? 'hi'}" style="margin-top:28px;font-size:${sig.titleSize ?? 96}px;font-weight:800;line-height:1.08">${sig.title}</p>
         <p class="${sig.font ?? 'hi'}" style="margin-top:48px;font-size:${sig.bodySize ?? 60}px;font-weight:${sig.paper ? 400 : 700};line-height:1.4">${sig.body}</p>
         <div style="margin-top:auto;display:flex;align-items:center;gap:22px">
           <div style="width:120px;height:120px;border-radius:50%;overflow:hidden;position:relative;border:4px solid ${c.accent};flex:none">${faceCrop(c, 112, 112, { cy: 0.48 })}</div>
           <div><p class="${font}" style="font-size:40px;font-weight:800">${c.nameHi}</p>
             <p style="font-size:24px;opacity:.75">@${esc(c.handle)} · AI character</p></div>
         </div>
       </div>`));

    // Q&A story (1080×1920) with room for the question sticker.
    add('story-ask-1080x1920.jpg', 1080, 1920, page(
      `<div class="fill" style="overflow:hidden;filter:brightness(.5)">${faceCrop(c, 1080, 1920, { cy: 0.3, side: c.face.side * 1.1 })}</div>
       <div class="fill" style="background:linear-gradient(180deg,rgba(10,10,15,.2) 0%,rgba(10,10,15,.85) 55%,#0a0a0f 100%)"></div>
       <div style="position:absolute;left:80px;right:80px;top:900px;text-align:center">
         <p class="${font} shadow-text" style="font-size:88px;font-weight:800;line-height:1.05">${c.askHi}</p>
         <div style="margin:60px auto 0;width:800px;height:230px;border:5px dashed rgba(255,255,255,.55);border-radius:36px"></div>
       </div>
       ${aiLabel({ top: 270, left: 60, size: 24, text: 'AI character · एआई किरदार' })}`));

    // Reel cover (1080×1920) — title inside the 3:4 grid-safe centre.
    add('reel-cover-1080x1920.jpg', 1080, 1920, page(
      `<div class="fill" style="overflow:hidden">${faceCrop(c, 1080, 1920, { cy: 0.38, side: c.face.side * 1.3 })}</div>
       <div class="fill" style="background:linear-gradient(180deg,rgba(10,10,15,0) 40%,rgba(10,10,15,.9) 75%)"></div>
       <div style="position:absolute;left:70px;right:70px;top:1180px">
         <p class="${font} shadow-text" style="font-size:96px;font-weight:800;line-height:1.02">${c.reelCoverHi}</p>
         <p style="margin-top:14px;font-size:32px;font-weight:700;color:${c.accent}">${esc(c.series)}</p>
       </div>
       ${aiLabel({ top: 270, right: 60, size: 24 })}`));
  }
  return jobs;
}
