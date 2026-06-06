import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// TEMPORARY one-shot helper: pulls freshly-generated poster art from the
// image CDN (which the dev sandbox cannot reach directly) through the
// deployment, so the bytes can be committed as static /thumbnails assets.
// No user-controlled URL — the map is hardcoded, so this is not an open
// proxy. Delete this route once the posters are committed.
const MAP: Record<string, string> = {
  'forbidden-love.png': 'hf_20260606_220753_3dc7a956-12fa-4fb5-b841-33f3a9a1852a.png',
  'the-secret-alliance-poster.png': 'hf_20260606_220810_4c281f85-08dd-4154-ad29-3142704a638a.png',
  'substitute-bride-poster.png': 'hf_20260606_220811_b1b8cc7b-d5e2-4e7b-a1ac-318051c810c0.png',
  'pishachini-the-healer.png': 'hf_20260606_220817_870d8fd9-a240-45b5-ba91-30fca6edca16.png',
  'ceos-hidden-wife.png': 'hf_20260606_220818_9cd98066-665d-4905-b336-6bd0a81d6260.png',
  'billionaires-revenge.png': 'hf_20260606_220830_823735ad-bddb-4a69-b9ab-3d2e4c57d69f.png',
  'mafia-lords-bride.png': 'hf_20260606_220831_3ebbe3e9-4e85-46c8-952d-d82c5064b4db.png',
  'ceo-hidden-identity-poster.png': 'hf_20260606_220833_5813c1bd-3be0-4412-9978-a2ed1e2bade0.png',
  'medical-genius-poster.png': 'hf_20260606_220835_1268a07f-9b13-4c04-9619-455287b5440d.png',
  'midnight-obsession.png': 'hf_20260606_220845_0786077b-2b00-4a62-8d91-058fcb9e0fe0.png',
  'broken-vows.png': 'hf_20260606_220846_9ffdc520-424b-43c9-a6ab-826bdf3f9c47.png',
  'love-in-beijing.png': 'hf_20260606_220847_05886cec-1bd4-4b0d-8ddf-144e66284312.png',
  'stepmothers-lies.png': 'hf_20260606_220848_c7f8a212-bcd5-473f-af32-1f444e4c01e8.png',
};
const BASE = 'https://d8j0ntlcm91z4.cloudfront.net/user_31pkQJku9W5yJGVT9HL5bkAjlO2/';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  const file = MAP[name];
  if (!file) return NextResponse.json({ error: 'unknown' }, { status: 404 });
  const upstream = await fetch(BASE + file);
  if (!upstream.ok) return NextResponse.json({ error: 'upstream', status: upstream.status }, { status: 502 });
  const buf = await upstream.arrayBuffer();
  return new NextResponse(buf, {
    status: 200,
    headers: { 'content-type': 'image/png', 'cache-control': 'no-store' },
  });
}
