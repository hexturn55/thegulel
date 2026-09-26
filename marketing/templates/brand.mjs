// Gulel brand-account kit: profile pictures, platform covers, highlight
// covers, launch carousel, story templates, Google Ads logos, Play feature
// graphic and the link-preview (og) image.
import { page, poster, wordmark, logo, esc } from './lib.mjs';

// Poster order for collages: flagship first, then the strongest Indian-lead art.
export const COLLAGE = [
  'pishachini-the-healer.png', 'substitute-bride-poster.png', 'ceo-hidden-identity-poster.png',
  'mafia-lords-bride.png', 'stepmothers-lies.png', 'the-secret-alliance-poster.png',
  'billionaires-revenge.png', 'broken-vows.png', 'three-weddings.png', 'medical-genius-poster.png',
  'forbidden-love.png', 'ceos-hidden-wife.png', 'midnight-obsession.png', 'whispers-in-the-dark.png',
  'bound-by-fate.png', 'million-dollar-heart.png', 'the-last-empress.png', 'dragons-blood.png', 'love-in-beijing.png',
];

/** A tilted wall of posters used behind covers and banners. */
function posterWall({ cols, rows, w, gap = 18, rotate = -10, scale = 1.25, opacity = 0.55, offset = 0 }) {
  let cells = '';
  for (let i = 0; i < cols * rows; i++) {
    const p = COLLAGE[(i + offset) % COLLAGE.length];
    cells += `<img src="${poster(p)}" style="width:${w}px;aspect-ratio:9/16;object-fit:cover;border-radius:${w * 0.06}px">`;
  }
  return `<div class="fill" style="display:flex;align-items:center;justify-content:center;opacity:${opacity}">
    <div style="display:grid;grid-template-columns:repeat(${cols},${w}px);gap:${gap}px;transform:rotate(${rotate}deg) scale(${scale})">${cells}</div></div>`;
}

const GRAD = 'linear-gradient(135deg,#ef4444 0%,#f43f5e 45%,#ec4899 100%)';

// ── Icons for highlight covers (simple strokes, lucide-style) ─────────────
const ICONS = {
  play: '<polygon points="7,4 20,12 7,20" fill="currentColor" stroke="none"/>',
  new: '<path d="M12 2l2.4 6.6L21 11l-6.6 2.4L12 20l-2.4-6.6L3 11l6.6-2.4z" fill="currentColor" stroke="none"/>',
  horror: '<path d="M12 2C7 2 4 6 4 11v10l3-2 2.5 2L12 19l2.5 2L17 19l3 2V11c0-5-3-9-8-9z"/><circle cx="9" cy="10" r="1.4" fill="currentColor"/><circle cx="15" cy="10" r="1.4" fill="currentColor"/>',
  romance: '<path d="M12 21s-7.5-4.6-9.5-9.2C1 8 3.4 4.5 7 4.5c2 0 3.6 1.1 5 3 1.4-1.9 3-3 5-3 3.6 0 6 3.5 4.5 7.3C19.5 16.4 12 21 12 21z" fill="currentColor" stroke="none"/>',
  coins: '<circle cx="12" cy="12" r="9"/><path d="M9 9h5.5M9 12h5.5M11 9c2.5 0 2.5 3 0 3H9l4.5 4"/>',
  vip: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z" fill="currentColor" stroke="none"/>',
  cast: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.8 3.4-6 6.5-6s5.7 2.2 6.5 6"/><circle cx="17.5" cy="9" r="2.8"/><path d="M16 14.2c2.9.1 4.9 2.1 5.5 5.3"/>',
  bts: '<rect x="3" y="7" width="13" height="11" rx="2"/><path d="M16 11l5-3v9l-5-3z"/><path d="M5 4h9"/>',
};
const icon = (name, size) =>
  `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

export default function brandJobs() {
  const jobs = [];
  const add = (out, w, h, html, extra = {}) => jobs.push({ out: `brand/${out}`, w, h, html, ...extra });

  // Profile pictures: gradient disc, wordmark sized for a circular crop.
  add('profile-gradient-1080.png', 1080, 1080, page(
    `<div class="fill" style="background:${GRAD}"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">${wordmark(760)}</div>`));
  add('profile-dark-1080.png', 1080, 1080, page(
    `<div class="fill" style="background:radial-gradient(circle at 50% 40%,#2a0d16 0%,#0a0a0f 70%)"></div>
     <div class="fill" style="border-radius:50%;margin:40px;border:26px solid transparent;background:${GRAD} border-box;
       -webkit-mask:linear-gradient(#000 0 0) padding-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">${wordmark(720)}</div>`));

  // YouTube channel banner — everything that matters inside the 1546×423 TV/desktop/mobile safe area.
  add('youtube-banner-2560x1440.jpg', 2560, 1440, page(
    `${posterWall({ cols: 12, rows: 3, w: 300, scale: 1.1, opacity: 0.5 })}
     <div class="fill" style="background:radial-gradient(ellipse 60% 45% at 50% 50%,rgba(10,10,15,.92) 0%,rgba(10,10,15,.55) 70%,rgba(10,10,15,.35) 100%)"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">
       <div style="width:1546px;height:423px;display:flex;align-items:center;justify-content:space-between;padding:0 40px">
         <div>${wordmark(620)}
           <p class="hi" style="margin-top:22px;font-size:56px;font-weight:800;line-height:1.1">हर दिन नया ड्रामा <span style="color:var(--amber)">·</span> Episode 1 <span style="color:var(--rose)">FREE</span></p>
         </div>
         <div style="text-align:right">
           <p class="display" style="font-size:88px;line-height:.95">India's vertical<br><span style="color:var(--rose)">drama channel</span></p>
           <p style="margin-top:20px;font-size:38px;font-weight:600;color:#e4e4e7">Watch free → <b style="color:#fff">thegulel.com/go</b></p>
         </div>
       </div>
     </div>`));

  // Facebook Page cover — 1640×624 upload; mobile shows the centre ~1110px.
  add('facebook-cover-1640x624.jpg', 1640, 624, page(
    `${posterWall({ cols: 10, rows: 2, w: 210, scale: 1.2, opacity: 0.55, offset: 3 })}
     <div class="fill" style="background:linear-gradient(90deg,rgba(10,10,15,.2) 0%,rgba(10,10,15,.88) 26%,rgba(10,10,15,.88) 74%,rgba(10,10,15,.2) 100%)"></div>
     <div class="fill" style="display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">
       ${wordmark(440)}
       <p class="hi" style="margin-top:18px;font-size:46px;font-weight:800">हर दिन नया ड्रामा · <span style="color:var(--rose)">Episode 1 FREE</span></p>
       <p style="margin-top:10px;font-size:28px;color:#d4d4d8">Horror · Romance · Revenge · Family — 2-minute episodes, made for your phone</p>
     </div>`));

  // WhatsApp Channel / Threads / Google profile (square, reuses gradient mark).
  add('whatsapp-channel-640.png', 640, 640, page(
    `<div class="fill" style="background:${GRAD}"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">${wordmark(450)}</div>`));

  // YouTube branding watermark (shown on every video; transparent).
  add('youtube-watermark-150.png', 150, 150, page(
    `<style>html,body{background:transparent!important}</style>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">
       <div style="width:140px;height:140px;border-radius:50%;background:${GRAD};display:flex;align-items:center;justify-content:center">${wordmark(104)}</div></div>`),
    { transparent: true });

  // Google Ads logos (square 1:1 and landscape 4:1).
  add('google-ads-logo-1200.png', 1200, 1200, page(
    `<div class="fill" style="background:${GRAD}"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">${wordmark(860)}</div>`));
  add('google-ads-logo-landscape-1200x300.png', 1200, 300, page(
    `<div class="fill" style="background:#0a0a0f"></div>
     <div class="fill" style="display:flex;align-items:center;justify-content:center">${logo(980)}</div>`));

  // Google Play feature graphic.
  add('play-feature-graphic-1024x500.jpg', 1024, 500, page(
    `${posterWall({ cols: 9, rows: 2, w: 150, scale: 1.25, opacity: 0.6, offset: 1 })}
     <div class="fill" style="background:linear-gradient(90deg,rgba(10,10,15,.95) 0%,rgba(10,10,15,.85) 52%,rgba(10,10,15,.2) 100%)"></div>
     <div class="fill" style="padding:0 60px;display:flex;flex-direction:column;justify-content:center">
       ${wordmark(330)}
       <p class="display" style="margin-top:18px;font-size:58px">Drama that<br><span style="color:var(--rose)">won't let go</span></p>
       <p class="hi" style="margin-top:12px;font-size:28px;font-weight:700;color:#e4e4e7">हर शो का Episode 1 FREE</p>
     </div>`));

  // Link-preview image (WhatsApp / Facebook / X unfurls) — replaces public/og-image.png.
  add('og-share-1200x630.png', 1200, 630, page(
    `${posterWall({ cols: 9, rows: 2, w: 170, scale: 1.2, opacity: 0.6 })}
     <div class="fill" style="background:linear-gradient(90deg,rgba(10,10,15,.96) 0%,rgba(10,10,15,.88) 55%,rgba(10,10,15,.25) 100%)"></div>
     <div class="fill" style="padding:0 70px;display:flex;flex-direction:column;justify-content:center">
       ${logo(470)}
       <p class="display" style="margin-top:30px;font-size:74px">India's vertical<br><span style="color:var(--rose)">drama channel</span></p>
       <p class="hi" style="margin-top:18px;font-size:36px;font-weight:800">हर शो का Episode 1 <span style="color:var(--amber)">FREE</span> · 2-min episodes</p>
     </div>`));

  // Instagram Story highlight covers.
  const HIGHLIGHTS = [
    ['watch', 'play', 'Watch'], ['new', 'new', 'New'], ['horror', 'horror', 'Horror'], ['romance', 'romance', 'Romance'],
    ['coins', 'coins', 'Coins'], ['vip', 'vip', 'VIP'], ['cast', 'cast', 'Cast'], ['bts', 'bts', 'BTS'],
  ];
  for (const [slug, ic, label] of HIGHLIGHTS) {
    add(`highlight-${slug}-1080x1920.png`, 1080, 1920, page(
      `<div class="fill" style="background:#0a0a0f"></div>
       <div class="fill" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px">
         <div style="width:560px;height:560px;border-radius:50%;background:${GRAD};display:flex;align-items:center;justify-content:center;color:#fff">${icon(ic, 300)}</div>
         <p class="display" style="font-size:72px;letter-spacing:.08em;color:#fff">${esc(label)}</p>
       </div>`));
  }

  // Launch carousel (1080×1350, 4:5).
  const S = (n, body, css = '') => add(`launch-carousel-${n}-1080x1350.jpg`, 1080, 1350, page(body, css));
  S(1, `${posterWall({ cols: 5, rows: 3, w: 260, scale: 1.2, opacity: 0.7 })}
    <div class="fill grad-bottom"></div>
    <div class="fill" style="padding:90px 80px;display:flex;flex-direction:column;justify-content:space-between">
      ${wordmark(300)}
      <div>
        <p class="hi shadow-text" style="font-size:96px;font-weight:800;line-height:1.02">भारत का अपना<br><span style="color:var(--rose)">वर्टिकल ड्रामा</span> चैनल</p>
        <p class="shadow-text" style="margin-top:26px;font-size:40px;font-weight:600">Horror. Romance. Revenge. Family.<br>2-minute episodes, made for your phone.</p>
        <p class="pill cta" style="margin-top:40px;font-size:38px;padding:22px 40px"><span class="play"></span> Episode 1 FREE on every show</p>
      </div>
    </div>`);
  S(2, `<div class="fill" style="background:radial-gradient(circle at 20% 0%,#3b0a17 0%,#0a0a0f 60%)"></div>
    <div class="fill" style="padding:100px 80px">
      <p style="font-size:30px;font-weight:700;letter-spacing:.3em;color:var(--amber)">HOW GULEL WORKS</p>
      <p class="hi" style="margin-top:20px;font-size:78px;font-weight:800;line-height:1.05">3 स्टेप। <span style="color:var(--rose)">पूरी कहानी।</span></p>
      ${[
        ['01', 'Swipe', 'Episode 1 of every show is free. No login.', 'var(--rose)'],
        ['02', 'Get hooked', 'Each 2-minute episode ends on a cliffhanger.', 'var(--amber)'],
        ['03', 'Unlock', 'Coins, a free rewarded ad (+5 coins) or VIP for everything.', 'var(--teal)'],
      ].map(([n, h, b, c]) => `<div style="margin-top:56px;display:flex;gap:36px;align-items:flex-start">
          <p class="display" style="font-size:120px;color:${c};line-height:.85">${n}</p>
          <div><p style="font-size:52px;font-weight:800">${h}</p><p style="margin-top:8px;font-size:34px;color:#d4d4d8;line-height:1.3">${b}</p></div></div>`).join('')}
      <div style="position:absolute;left:80px;right:80px;bottom:90px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px">
        ${[
          ['FREE', 'Episode 1, every show', 'var(--rose)'],
          ['₹8–12', '10 coins per episode', 'var(--amber)'],
          ['+5', 'coins per ad watched', 'var(--teal)'],
        ].map(([v, l, c]) => `<div style="border:2px solid #27272a;border-radius:24px;padding:26px 22px;background:#111117">
            <p class="hi" style="font-size:56px;font-weight:800;color:${c};line-height:1">${v}</p>
            <p style="margin-top:10px;font-size:25px;color:#a1a1aa">${l}</p></div>`).join('')}
      </div>
    </div>`);
  S(3, `<img class="cover" src="${poster('pishachini-the-healer.png')}" style="object-position:50% 30%">
    <div class="fill grad-bottom"></div>
    <div class="fill" style="padding:80px;display:flex;flex-direction:column;justify-content:flex-end">
      <p style="font-size:30px;font-weight:800;letter-spacing:.25em;color:var(--jade)">FLAGSHIP · 20 EPISODES · HORROR</p>
      <p class="hi shadow-text" style="margin-top:18px;font-size:84px;font-weight:800;line-height:1.02">वो हर बीमारी ठीक करती है…<br><span style="color:#ef4444">पर कीमत क्या है?</span></p>
      <p class="pill cta" style="margin-top:36px;font-size:36px;padding:20px 38px"><span class="play"></span> Watch Pishachini · Ep 1 free</p>
    </div>`);
  const grid = COLLAGE.slice(0, 15).map((p) => `<img src="${poster(p)}" style="width:100%;aspect-ratio:9/16;object-fit:cover;border-radius:14px">`).join('');
  S(4, `<div class="fill" style="background:#0a0a0f"></div>
    <div class="fill" style="padding:64px 60px">
      <p style="font-size:30px;font-weight:700;letter-spacing:.3em;color:var(--amber)">THE SLATE</p>
      <p class="hi" style="margin-top:10px;font-size:60px;font-weight:800">23 शो। आप तय करें <span style="color:var(--rose)">अगला सीज़न</span>।</p>
      <div style="margin-top:30px;display:grid;grid-template-columns:repeat(5,1fr);gap:16px">${grid}</div>
    </div>`);
  S(5, `<div class="fill" style="background:${GRAD}"></div>
    <div class="fill" style="padding:100px 80px;display:flex;flex-direction:column;justify-content:space-between">
      ${wordmark(340)}
      <div>
        <p class="hi" style="font-size:92px;font-weight:800;line-height:1.02">पहला एपिसोड<br>हमेशा फ्री।</p>
        <p style="margin-top:28px;font-size:44px;font-weight:700">Link in bio → thegulel.com/go</p>
        <p style="margin-top:40px;font-size:32px;font-weight:600;opacity:.9">Follow the characters: @pishachini.gulel · @waaris.gulel<br>@undercover.ceo.gulel · @badli.dulhan.gulel</p>
      </div>
      <p style="font-size:26px;opacity:.85">Gulel Originals are made with AI · एआई द्वारा निर्मित</p>
    </div>`);

  // Story templates (1080×1920) — keep the top/bottom 250px clear for UI.
  add('story-link-sticker-1080x1920.jpg', 1080, 1920, page(
    `<img class="cover" src="${poster('pishachini-the-healer.png')}" style="filter:blur(2px) brightness(.55)">
     <div class="fill" style="padding:280px 80px;display:flex;flex-direction:column;align-items:center;text-align:center">
       ${wordmark(320)}
       <p class="hi shadow-text" style="margin-top:80px;font-size:92px;font-weight:800;line-height:1.05">Episode 1<br><span style="color:var(--rose)">अभी फ्री</span> देखें</p>
       <div style="margin-top:90px;width:640px;height:150px;border:5px dashed rgba(255,255,255,.7);border-radius:32px;display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:700;color:#fff">place LINK sticker here</div>
       <p style="margin-top:40px;font-size:40px;font-weight:800">↑ tap ↑</p>
     </div>`));
  add('story-poll-1080x1920.jpg', 1080, 1920, page(
    `<div class="fill" style="background:linear-gradient(180deg,#1b0710 0%,#0a0a0f 100%)"></div>
     <div class="fill" style="padding:260px 70px;display:flex;flex-direction:column;align-items:center;text-align:center">
       <p style="font-size:30px;font-weight:700;letter-spacing:.3em;color:var(--amber)">YOU DECIDE</p>
       <p class="hi" style="margin-top:22px;font-size:84px;font-weight:800;line-height:1.05">अगला सीज़न<br>किसका बने?</p>
       <div style="margin-top:60px;display:flex;gap:30px">
         <img src="${poster('substitute-bride-poster.png')}" style="width:430px;aspect-ratio:9/16;object-fit:cover;border-radius:28px">
         <img src="${poster('ceo-hidden-identity-poster.png')}" style="width:430px;aspect-ratio:9/16;object-fit:cover;border-radius:28px">
       </div>
       <div style="margin-top:50px;width:760px;height:170px;border:5px dashed rgba(255,255,255,.6);border-radius:32px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700">place POLL sticker here</div>
     </div>`));
  return jobs;
}
