import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Demo/seed poster thumbnails are served from placehold.co.
        protocol: 'https',
        hostname: 'placehold.co',
      },
      {
        protocol: 'https',
        hostname: '*.cloudflarestream.com',
      },
      {
        protocol: 'https',
        hostname: 'customer-*.cloudflarestream.com',
      },
      {
        // Cloudflare Stream legacy thumbnail host (e.g. episode poster frames).
        protocol: 'https',
        hostname: 'videodelivery.net',
      },
      {
        protocol: 'https',
        hostname: '*.videodelivery.net',
      },
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
};

export default withNextIntl(nextConfig);
