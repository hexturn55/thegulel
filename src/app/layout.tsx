import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics, GoogleTagManager } from '@/components/Analytics';
import { FacebookPixel } from '@/components/FacebookPixel';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: 'Gulel OTT — Vertical Micro Dramas',
    template: '%s | Gulel OTT',
  },
  description:
    'Watch addictive vertical micro dramas anytime, anywhere. Free episodes, coin-based unlocks, Hindi & Chinese content.',
  metadataBase: new URL('https://thegulel.com'),
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Gulel OTT',
    title: 'Gulel OTT — Vertical Micro Dramas',
    description: 'Watch addictive vertical micro dramas anytime, anywhere.',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Gulel OTT — Vertical Micro Dramas',
    description: 'Watch addictive vertical micro dramas anytime, anywhere.',
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Gulel OTT',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Gulel OTT" />
        {/* MS Tile */}
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-TileImage" content="/icons/icon-192.png" />
      </head>
      <body className={`${inter.className} bg-black antialiased`}>
        {children}

        {/* Analytics */}
        <GoogleAnalytics />
        <GoogleTagManager />
        <FacebookPixel />

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.warn('SW registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
