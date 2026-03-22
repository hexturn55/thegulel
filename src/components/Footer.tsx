import Link from 'next/link';
import { Instagram, Youtube, Twitter, Facebook } from 'lucide-react';

// TikTok doesn't have a lucide icon — use SVG inline
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.78 1.52V6.75a4.85 4.85 0 01-1.01-.06z" />
    </svg>
  );
}

export function Footer() {
  const socialLinks = [
    {
      label: 'Instagram',
      href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com',
      icon: <Instagram className="w-5 h-5" />,
    },
    {
      label: 'YouTube',
      href: process.env.NEXT_PUBLIC_YOUTUBE_URL || 'https://youtube.com',
      icon: <Youtube className="w-5 h-5" />,
    },
    {
      label: 'X / Twitter',
      href: process.env.NEXT_PUBLIC_TWITTER_URL || 'https://x.com',
      icon: <Twitter className="w-5 h-5" />,
    },
    {
      label: 'Facebook',
      href: process.env.NEXT_PUBLIC_FACEBOOK_URL || 'https://facebook.com',
      icon: <Facebook className="w-5 h-5" />,
    },
    {
      label: 'TikTok',
      href: process.env.NEXT_PUBLIC_TIKTOK_URL || 'https://tiktok.com',
      icon: <TikTokIcon className="w-5 h-5" />,
    },
  ];

  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 text-gray-400 text-sm">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Brand + tagline */}
        <div className="mb-8 text-center">
          <img src="/logo.png" alt="The Gulel" className="h-10 w-auto mx-auto mb-2" />
          <p className="text-gray-500 text-xs mt-1">Vertical micro dramas, anywhere you go.</p>
        </div>

        {/* Links */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8">
          <Link href="/about" className="hover:text-white transition">About</Link>
          <Link href="/terms" className="hover:text-white transition">Terms</Link>
          <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
          <a href="mailto:hello@thegulel.com" className="hover:text-white transition">Contact</a>
        </nav>

        {/* Social icons */}
        <div className="flex justify-center gap-5 mb-8">
          {socialLinks.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={s.label}
              className="text-gray-500 hover:text-white transition"
            >
              {s.icon}
            </a>
          ))}
        </div>

        {/* Copyright */}
        <p className="text-center text-gray-600 text-xs">
          © 2026 Gulel Entertainment. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
