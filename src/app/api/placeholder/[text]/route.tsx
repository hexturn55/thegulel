import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';

// Local poster/thumbnail placeholder generator. Renders a vertical (9:16)
// gradient card with centered text as a PNG — same-origin, so it needs no
// external network access or `remotePatterns` entry and works in any
// environment (dev, CI, prod). The label is taken from the path segment
// (not a query string) so the image is optimizable by next/image without a
// custom `localPatterns` rule. Used by demo seed data and as a graceful
// fallback for series/episodes without a real thumbnail.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ text: string }> },
) {
  const { text: rawText } = await params;
  const text = decodeURIComponent(rawText ?? 'Gulel OTT').slice(0, 80);
  const width = 720;
  const height = 1280;

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          textAlign: 'center',
          color: '#ffffff',
          background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 55%, #334155 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: Math.round(width / 9),
            fontWeight: 700,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          {text}
        </div>
      </div>
    ),
    { width, height },
  );
}
