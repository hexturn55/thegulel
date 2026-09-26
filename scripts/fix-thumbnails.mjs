// Repair PNGs under public/ that were saved as raw generation-API responses.
//
// Some images (posters, app icons, the social share card) were written as the JSON body the
// image API returned — {"data":"<base64 png>"} — under a .png name, so
// browsers render nothing and cards fall back to the generic placeholder.
// The real artwork is intact inside the wrapper. Run before `next build`
// so every deployment serves the decoded images; already-valid PNGs are
// left untouched, making this a no-op once the repo carries real files.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = new URL('../public', import.meta.url).pathname;

function* pngs(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* pngs(path);
    else if (entry.name.endsWith('.png')) yield path;
  }
}

for (const path of pngs(root)) {
  const name = relative(root, path);
  const head = readFileSync(path).subarray(0, 2).toString('utf8');
  if (!head.startsWith('{')) continue; // real image, leave it alone
  try {
    const wrapped = JSON.parse(readFileSync(path, 'utf8'));
    const buf = Buffer.from(wrapped.data, 'base64');
    if (buf.subarray(1, 4).toString('utf8') !== 'PNG') {
      console.warn(`[fix-thumbnails] ${name}: wrapper does not contain a PNG, skipped`);
      continue;
    }
    writeFileSync(path, buf);
    console.log(`[fix-thumbnails] repaired ${name} (${buf.length} bytes)`);
  } catch (err) {
    console.warn(`[fix-thumbnails] ${name}: could not repair — ${err}`);
  }
}
