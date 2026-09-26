// Generate content/calendar-30-days.csv: every post for the brand and the four
// character accounts from Mon 28 Sep to Tue 27 Oct 2026 (week 0 + tournament).
//
//   node marketing/templates/calendar.mjs
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';

const M = (p) => path.join(ROOT, 'marketing', p);
const hooks = Object.fromEntries(JSON.parse(fs.readFileSync(M('data/hooks.json'), 'utf8')).map((h) => [h.alias, h]));
const extra = JSON.parse(fs.readFileSync(M('data/series-copy.json'), 'utf8'));
const chars = JSON.parse(fs.readFileSync(M('data/characters.json'), 'utf8'));
const plain = (h) => h.replace(/<br>/g, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

// Pilot tournament waves (04-paid-media.md §4). Pishachini is the control in every wave.
const WAVES = {
  0: ['pishachini', 'heir', 'bride', 'ceo'],
  1: ['heir', 'bride', 'ceo', 'alliance', 'whispers', 'heart', 'doctor', 'weddings'],
  2: ['fate', 'empress', 'dragon', 'revenge', 'mafia', 'stepmom', 'wife', 'vows'],
  3: ['forbidden', 'obsession', 'beijing', 'heir', 'bride', 'ceo', 'whispers', 'pishachini'],
};
const MOMENTS = {
  '2026-10-11': 'Navratri begins: CPMs +30–50% from here. Tournament budgets stay equal',
  '2026-10-17': 'Last India vs WI T20I: no budget increases tonight',
  '2026-10-20': 'Dussehra',
  '2026-10-26': 'Greenlight review done: 2–4 winners get character + creator budget',
};

const start = new Date('2026-09-28T00:00:00Z');
const rows = [['date', 'day', 'week', 'phase', 'time_ist', 'account', 'platforms', 'format', 'series', 'hook_id', 'copy_line_1', 'asset', 'link', 'notes']];
const VERIFY = new Set(Object.values(hooks).filter((h) => h.verify).map((h) => h.title));
const add = (r) => {
  // Series tagged __demo__ in the live catalog: someone must watch Ep 1 before it's promoted.
  if (VERIFY.has(r[8])) r[13] = ['⚠️ __demo__ series: confirm Ep 1 is a real production before posting', r[13]].filter(Boolean).join(' · ');
  rows.push(r);
};
const link = (alias, source, medium, campaign) =>
  `thegulel.com/go/${alias}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;

// Character pillars rotate Mon→Sun.
const PILLARS = {
  pishachini: ['CF signature (आज का नुस्ख़ा)', 'QA story → reply Reel', 'CF signature (आज का नुस्ख़ा)', 'QA story → reply Reel', 'CF signature (आज का नुस्ख़ा)', 'HC collab clip with @thegulel', 'CD amavasya countdown story'],
  waaris: ['CF usool card', 'PV haveli POV', 'CF usool card', 'QA "किसने कम समझा?"', 'CF usool card', 'TR attitude audio in character', 'CD face-reveal countdown'],
  'undercover-ceo': ['CF undercover diary', 'PL पैसा या प्यार?', 'PV two-phone POV', 'CF undercover diary', 'QA story', 'HC collab clip with @thegulel', 'TR office trend in character'],
  'substitute-bride': ['CF diary page (paper)', 'PV diary voice-over', 'QA "मेरी जगह होतीं तो?"', 'CF diary page (paper)', 'TR wedding-season audio', 'HC collab clip with @thegulel', 'PL story poll'],
};
const CHAR_TIME = { pishachini: '22:00', waaris: '20:30', 'undercover-ceo': '13:30', 'substitute-bride': '21:00' };

for (let d = 0; d < 30; d++) {
  const date = new Date(start.getTime() + d * 86400000);
  const iso = date.toISOString().slice(0, 10);
  const dow = date.getUTCDay(); // 0 Sun
  const dayName = date.toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });
  const week = Math.floor(d / 7);
  const phase = week === 0 ? 'Week 0 · set up + seed' : `Wave ${week} · pilot tournament`;
  const wave = WAVES[Math.min(week, 3)];
  const a = wave[d % wave.length];
  const b = wave[(d + 3) % wave.length];
  const campaign = `202610_pilot-test_${a}`;
  const note = MOMENTS[iso] ?? '';

  if (d === 0) {
    add([iso, dayName, week, phase, '10:00', 'all', 'IG · FB · YT · Threads · WhatsApp', 'SETUP', '', '', 'Create/verify all 5 accounts, upload profile + covers + highlights, switch on the AI-generated profile label on characters', 'assets/brand · assets/characters', '', 'See 02 §2 and §4 for bios and links']);
  }

  // Brand: two Reels / Shorts a day.
  const ha = hooks[a], hb = hooks[b];
  add([iso, dayName, week, phase, '19:00', '@thegulel', 'IG Reel + FB Reel + YT Short', 'HC hook cut', ha.title, extra[a].hooks[d % 5][0],
    plain(ha.hookHi), `cut from ${ha.title} Ep 1 + assets/ads/${a}/endcard-1080x1920.jpg`, link(a, 'instagram', 'organic_post', campaign),
    [a === 'pishachini' ? 'Collab with @pishachini.gulel' : a === 'heir' ? 'Collab with @waaris.gulel' : a === 'ceo' ? 'Collab with @undercover.ceo.gulel' : a === 'bride' ? 'Collab with @badli.dulhan.gulel' : 'Also as IG Trial Reel variant', note].filter(Boolean).join(' · ')]);
  const second = ['FP full Episode 1', 'RC recap', 'PL "which show gets Season 1?"', 'BT how we made it with AI', 'FP full Episode 1', 'CL cliffhanger loop', 'RC recap'][dow];
  add([iso, dayName, week, phase, '21:30', '@thegulel', second.startsWith('FP') ? 'YT long-form + FB video' : 'IG Reel + YT Short', second, hb.title, extra[b].hooks[(d + 2) % 5][0],
    plain(hb.hookHi), second.startsWith('FP') ? `Ep 1 of ${hb.title} + assets/ads/${b}/youtube-thumb-1280x720.jpg` : `cut from ${hb.title} Ep 1`,
    link(b, second.startsWith('FP') ? 'youtube' : 'instagram', 'organic_post', `202610_pilot-test_${b}`), second.startsWith('FP') ? 'Episode 1 only during the tournament, never Ep 2' : '']);
  add([iso, dayName, week, phase, '19:05', '@thegulel', 'IG + FB Stories', 'Story set: link sticker + poll', ha.title, '', 'Episode 1 अभी फ्री देखें ↑',
    `assets/brand/story-link-sticker-1080x1920.jpg · assets/ads/${a}/meta-9x16.jpg`, link(a, 'instagram', 'organic_story', campaign), '']);
  add([iso, dayName, week, phase, '20:00', 'WhatsApp Channel "Gulel"', 'WhatsApp Channel', 'Drop alert', ha.title, '', `🔔 ${plain(ha.hookHi)}`,
    `assets/ads/${a}/meta-1x1.jpg`, link(a, 'whatsapp', 'whatsapp_channel', campaign), '']);
  if ([2, 4, 6].includes(dow)) {
    const feed = d < 7 ? `assets/brand/launch-carousel-1..5 (post once, pin)` : `assets/ads/${b}/meta-4x5.jpg`;
    add([iso, dayName, week, phase, '13:00', '@thegulel', 'IG + FB feed', d < 7 ? 'Launch carousel' : 'Poster post', d < 7 ? 'All' : hb.title, '',
      d < 7 ? 'भारत का अपना वर्टिकल ड्रामा चैनल' : plain(hb.hookHi), feed, link(d < 7 ? '' : b, 'instagram', 'organic_post', d < 7 ? 'always-on_gulel' : `202610_pilot-test_${b}`).replace('/go/?', '/go?'), d < 7 ? 'Pin as post 1 of 3' : '']);
  }

  // Characters: one post each.
  for (const c of chars) {
    const pillar = PILLARS[c.id][(dow + 6) % 7];
    const seed = d < 3 ? ['intro carousel (3 slides)', 'signature post', 'Reel cover + PV intro'][d] : null;
    add([iso, dayName, week, phase, CHAR_TIME[c.id], `@${c.handle}`, c.id === 'pishachini' || c.id === 'waaris' ? 'IG + YT Short + FB' : 'IG + YT Short',
      seed ?? pillar, c.series, '', seed ? plain(c.taglineHi) : plain(pillar.startsWith('QA') || pillar.startsWith('PL') ? c.askHi : c.signature.title),
      seed === 'intro carousel (3 slides)' ? `assets/characters/${c.id}/intro-1..3-1080x1350.jpg` : pillar.startsWith('CF') || seed === 'signature post' ? `assets/characters/${c.id}/signature-${c.signature.slug}-1080x1350.jpg (template; new text daily)` : pillar.startsWith('QA') ? `assets/characters/${c.id}/story-ask-1080x1920.jpg` : `new ${pillar.split(' ')[0]} clip · cover assets/characters/${c.id}/reel-cover-1080x1920.jpg`,
      link(c.alias, 'instagram', 'organic_bio', `always-on_${c.id}`), 'Reply to top 10 comments in character within 60 min']);
  }
}

const csv = rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n') + '\n';
fs.writeFileSync(M('content/calendar-30-days.csv'), '﻿' + csv);
console.log(`✓ ${rows.length - 1} scheduled posts, 28 Sep – 27 Oct 2026`);
