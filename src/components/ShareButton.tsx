'use client';

import { useState } from 'react';
import { Share2, MessageCircle, Facebook, Twitter, Link, Check, X } from 'lucide-react';
import { analytics } from '@/lib/analytics';

interface ShareButtonProps {
  url: string;
  title: string;
  description?: string;
  seriesId?: string;
}

export function ShareButton({ url, title, description, seriesId }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = description ? `${title} — ${description}` : title;
  const fullUrl = url.startsWith('http') ? url : `https://thegulel.com${url}`;

  const track = (platform: string) => {
    if (seriesId) analytics.share(platform, seriesId);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: fullUrl });
        track('native');
      } catch {
        // user cancelled or share failed — silently ignore
      }
      return;
    }
    setOpen(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      track('copy_link');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement('textarea');
      ta.value = fullUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const platforms = [
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-600 hover:bg-green-700',
      href: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${fullUrl}`)}`,
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-700 hover:bg-blue-800',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    },
    {
      id: 'twitter',
      label: 'X / Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-zinc-800 hover:bg-zinc-700',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(fullUrl)}`,
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={handleNativeShare}
        className="inline-flex items-center gap-2 border border-white/20 text-white font-semibold px-6 py-3 rounded-full hover:bg-white/10 transition"
        aria-label="Share"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {/* Fallback modal for non-native-share browsers */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={() => setOpen(false)}>
          <div
            className="w-full max-w-md bg-zinc-900 rounded-t-2xl p-6 pb-10 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">Share</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-400 text-sm line-clamp-2">{title}</p>

            <div className="grid grid-cols-3 gap-3">
              {platforms.map((p) => (
                <a
                  key={p.id}
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => { track(p.id); setOpen(false); }}
                  className={`flex flex-col items-center gap-2 ${p.color} text-white rounded-xl py-4 px-2 transition text-sm font-medium`}
                >
                  {p.icon}
                  {p.label}
                </a>
              ))}
            </div>

            <button
              onClick={handleCopyLink}
              className="w-full flex items-center justify-center gap-2 border border-white/20 text-white rounded-xl py-3 hover:bg-white/10 transition font-medium"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Link className="w-5 h-5" />}
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
