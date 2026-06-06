// Generates branded vertical (9:16) poster placeholders for catalog series
// whose /thumbnails/*.png file is missing from the repo. Self-contained
// (sharp + system DejaVu font) so it needs no external image service.
//
// Usage: node scripts/gen-thumbnails.mjs
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const OUT_DIR = path.resolve('public/thumbnails');
const W = 720;
const H = 1280;

// title, genre, output filename — the set missing from public/thumbnails.
const ITEMS = [
  ['The Secret Alliance', 'Thriller', 'the-secret-alliance-poster.png'],
  ['The Substitute Bride', 'Romance', 'substitute-bride-poster.png'],
  ['Pishachini: The Healer', 'Horror', 'pishachini-the-healer.png'],
  ['Forbidden Love', 'Romance', 'forbidden-love.png'],
  ["The CEO's Hidden Wife", 'Drama', 'ceos-hidden-wife.png'],
  ["The Billionaire's Revenge", 'Thriller', 'billionaires-revenge.png'],
  ["The Mafia Lord's Bride", 'Crime Romance', 'mafia-lords-bride.png'],
  ["CEO's Hidden Identity", 'Romance', 'ceo-hidden-identity-poster.png'],
  ['Medical Genius', 'Drama', 'medical-genius-poster.png'],
  ['Midnight Obsession', 'Thriller', 'midnight-obsession.png'],
  ['Broken Vows', 'Drama', 'broken-vows.png'],
  ['Love in Beijing', 'Romance', 'love-in-beijing.png'],
  ["My Stepmother's Lies", 'Drama', 'stepmothers-lies.png'],
];

// genre -> [top color, bottom color, accent]
const THEMES = {
  Romance: ['#3b0a2a', '#7a1f4b', '#ff7ab8'],
  Thriller: ['#0b1020', '#1e293b', '#60a5fa'],
  Horror: ['#0a0a0a', '#2a0e0e', '#ef4444'],
  Drama: ['#10131a', '#2a2f3a', '#cbd5e1'],
  Action: ['#1a0e05', '#3a1d0a', '#fb923c'],
  Family: ['#102a1a', '#1f4a30', '#86efac'],
  'Period Drama': ['#1a1205', '#3a2a0a', '#fcd34d'],
  'Crime Romance': ['#1a0a14', '#3a1226', '#f472b6'],
};

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

// crude word wrap targeting ~maxChars per line
function wrap(title, maxChars) {
  const words = title.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > maxChars && line) {
      lines.push(line.trim());
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function svg(title, genre) {
  const theme = THEMES[genre] || THEMES.Drama;
  const [c0, c1, accent] = theme;
  const lines = wrap(title.toUpperCase(), 13);
  const fontSize = lines.length > 2 ? 76 : 92;
  const lineHeight = fontSize * 1.12;
  const blockH = lines.length * lineHeight;
  const startY = H / 2 - blockH / 2 + fontSize * 0.8;
  const tspans = lines
    .map((l, i) => `<tspan x="${W / 2}" y="${startY + i * lineHeight}">${esc(l)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.3" y2="1">
      <stop offset="0%" stop-color="${c0}"/>
      <stop offset="100%" stop-color="${c1}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="42%" r="60%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.28"/>
      <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#glow)"/>
  <text x="${W / 2}" y="120" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"
        font-size="26" letter-spacing="6" fill="${accent}" opacity="0.92">A GULEL ORIGINAL</text>
  <text text-anchor="middle" font-family="DejaVu Sans" font-weight="bold" font-size="${fontSize}"
        fill="#ffffff" letter-spacing="1">${tspans}</text>
  <rect x="${W / 2 - 150}" y="${H - 200}" width="300" height="2" fill="${accent}" opacity="0.7"/>
  <text x="${W / 2}" y="${H - 150}" text-anchor="middle" font-family="DejaVu Sans" font-weight="bold"
        font-size="30" letter-spacing="8" fill="#e5e7eb" opacity="0.9">${esc(genre.toUpperCase())}</text>
</svg>`;
}

fs.mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const [title, genre, file] of ITEMS) {
  const out = path.join(OUT_DIR, file);
  await sharp(Buffer.from(svg(title, genre)))
    .png({ compressionLevel: 9, quality: 90 })
    .toFile(out);
  const kb = (fs.statSync(out).size / 1024).toFixed(0);
  console.log(`✓ ${file}  (${kb} KB)`);
  count++;
}
console.log(`\nGenerated ${count} poster placeholders in public/thumbnails/`);
