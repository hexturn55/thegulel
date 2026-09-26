// Render every marketing graphic to marketing/assets/.
//
//   node marketing/templates/render.mjs            # everything
//   node marketing/templates/render.mjs ads/pish   # only jobs whose output path contains "ads/pish"
//
// Uses the Chromium that ships with @playwright/test (already a devDependency).
// In sandboxes with a pre-installed browser, point CHROMIUM_PATH at it; set
// PLAYWRIGHT_MODULE to load playwright from somewhere other than node_modules.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
import brandJobs from './brand.mjs';
import characterJobs from './characters.mjs';
import adJobs from './ads.mjs';

const OUT = path.join(ROOT, 'marketing/assets');
const filter = process.argv[2];

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? '@playwright/test');
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || undefined,
  args: ['--allow-file-access-from-files'],
});
const context = await browser.newContext({ deviceScaleFactor: 1 });
const pageObj = await context.newPage();

const jobs = [...brandJobs(), ...characterJobs(), ...adJobs()].filter((j) => !filter || j.out.includes(filter));
const seen = new Set();
let n = 0;
for (const job of jobs) {
  if (seen.has(job.out)) throw new Error(`duplicate output path ${job.out}`);
  seen.add(job.out);
  const file = path.join(OUT, job.out);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  // setContent pages are about:blank, which can't read file:// assets —
  // write the document next to the templates and navigate to it instead.
  const tmp = path.join(ROOT, 'marketing/templates/.render.html');
  fs.writeFileSync(tmp, job.html);
  await pageObj.setViewportSize({ width: job.w, height: job.h });
  await pageObj.goto('file://' + tmp, { waitUntil: 'load' });
  await pageObj.evaluate(() => document.fonts.ready);
  const jpeg = file.endsWith('.jpg');
  await pageObj.screenshot({
    path: file,
    type: jpeg ? 'jpeg' : 'png',
    quality: jpeg ? 84 : undefined,
    omitBackground: !jpeg && job.transparent === true,
    clip: { x: 0, y: 0, width: job.w, height: job.h },
  });
  n++;
  if (n % 20 === 0) console.log(`  ${n}/${jobs.length}`);
}
fs.rmSync(path.join(ROOT, 'marketing/templates/.render.html'), { force: true });
await browser.close();
console.log(`rendered ${n} graphics → marketing/assets/`);
