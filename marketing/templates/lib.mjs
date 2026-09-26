// Shared design system for every Gulel marketing graphic.
//
// Each template is a function that returns a full HTML document sized to the
// exact pixel canvas of its placement (profile picture, Reel, Meta ad...).
// render.mjs screenshots those documents with headless Chromium, so the
// graphics stay editable as code: change a hook line or a colour here and
// re-render the whole kit.
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, '../..');
export const THUMBS = path.join(ROOT, 'public/thumbnails');

export const TOKENS = {
  ink: '#0a0a0f',
  ink2: '#15151d',
  rose: '#f43f5e',
  roseDeep: '#e11d48',
  pink: '#ec4899',
  amber: '#fbbf24',
  teal: '#2dd4bf',
  violet: '#8b5cf6',
  jade: '#34d399',
};

/** file:// URL for a local file, so the headless page can load posters and fonts. */
export const fileUrl = (p) => 'file://' + path.resolve(p);
/** Series key art: a file in public/thumbnails, or `assets/…` for art kept with the templates. */
export const poster = (name) => fileUrl(name.startsWith('assets/') ? path.join(HERE, name) : path.join(THUMBS, name));
export const asset = (name) => fileUrl(path.join(HERE, 'assets', name));

export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const BASE_CSS = `
:root{--ink:${TOKENS.ink};--ink2:${TOKENS.ink2};--rose:${TOKENS.rose};--rose-deep:${TOKENS.roseDeep};
--pink:${TOKENS.pink};--amber:${TOKENS.amber};--teal:${TOKENS.teal};--violet:${TOKENS.violet};--jade:${TOKENS.jade}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:100%;height:100%;overflow:hidden;background:var(--ink);color:#fff;
  font-family:'Inter','Mukta',sans-serif;-webkit-font-smoothing:antialiased;text-rendering:geometricPrecision}
.canvas{position:relative;width:100%;height:100%;overflow:hidden}
.fill{position:absolute;inset:0}
.cover{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hi{font-family:'Mukta',sans-serif}
.display{font-family:'Anton',sans-serif;letter-spacing:.01em;text-transform:uppercase;line-height:.95}
.serif{font-family:'Playfair Display',serif}
.cinzel{font-family:'Cinzel',serif}
.hand{font-family:'Kalam',cursive}
.rozha{font-family:'Rozha One',serif}
.oswald{font-family:'Oswald',sans-serif}
.pill{display:inline-flex;align-items:center;gap:.45em;border-radius:999px;font-weight:800;white-space:nowrap}
.cta{background:var(--rose);color:#fff;box-shadow:0 10px 40px rgba(244,63,94,.45)}
.chip{border:2px solid rgba(255,255,255,.35);background:rgba(0,0,0,.35);backdrop-filter:blur(6px);color:#fff}
.ai-chip{position:absolute;display:inline-flex;align-items:center;gap:.4em;padding:.35em .8em;border-radius:999px;
  background:rgba(0,0,0,.55);border:1.5px solid rgba(255,255,255,.4);color:#fff;font-weight:700;letter-spacing:.02em}
.shadow-text{text-shadow:0 4px 24px rgba(0,0,0,.85),0 2px 6px rgba(0,0,0,.9)}
.grad-bottom{background:linear-gradient(180deg,rgba(10,10,15,0) 0%,rgba(10,10,15,.55) 45%,rgba(10,10,15,.96) 100%)}
.grad-top{background:linear-gradient(0deg,rgba(10,10,15,0) 0%,rgba(10,10,15,.75) 100%)}
.play{display:inline-block;width:0;height:0;border-top:.5em solid transparent;border-bottom:.5em solid transparent;border-left:.8em solid currentColor}
`;

/** Wrap a body fragment into a full document. `css` is template-specific. */
export function page(body, css = '') {
  return `<!doctype html><html><head><meta charset="utf-8">
<link rel="stylesheet" href="${fileUrl(path.join(HERE, 'fonts.css'))}">
<style>${BASE_CSS}${css}</style></head><body><div class="canvas">${body}</div></body></html>`;
}

/**
 * Visible synthetic-media label. Kept on every character and ad graphic that
 * shows an AI-generated person; sizing follows the disclosure notes in the
 * master plan (visible, legible, not hidden in a corner at 6px).
 */
export function aiLabel({ size = 26, top, right, bottom, left, text = 'AI-generated · Gulel Original' } = {}) {
  const pos = [
    top != null ? `top:${top}px` : '',
    right != null ? `right:${right}px` : '',
    bottom != null ? `bottom:${bottom}px` : '',
    left != null ? `left:${left}px` : '',
  ].filter(Boolean).join(';') || 'position:relative'; // no coordinates → sits in normal flow
  return `<div class="ai-chip" style="${pos};font-size:${size}px"><span style="display:inline-block;width:.55em;height:.55em;border-radius:50%;background:var(--teal)"></span>${esc(text)}</div>`;
}

/** The "gulel" wordmark (white, transparent PNG) at a given width. */
export const wordmark = (w, extra = '') =>
  `<img src="${asset('gulel-word.png')}" style="width:${w}px;height:auto;display:block;${extra}" alt="">`;

/** The full "thegulel.com" logo. */
export const logo = (w, extra = '') =>
  `<img src="${asset('logo-white.png')}" style="width:${w}px;height:auto;display:block;${extra}" alt="">`;

export const slugify = (s) =>
  s.toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
