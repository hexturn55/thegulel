'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Menu, Bell, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';

interface AdminHeaderProps {
  onMobileMenuToggle: () => void;
}

const BREADCRUMB_MAP: Record<string, string> = {
  admin: 'Dashboard',
  series: 'Series',
  new: 'New',
  episodes: 'Episodes',
  users: 'Users',
  analytics: 'Analytics',
  settings: 'Settings',
};

function getBreadcrumbs(pathname: string) {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: { label: string; href: string }[] = [];
  let path = '';

  for (const segment of segments) {
    path += `/${segment}`;
    // Skip UUIDs / long IDs from label but include in path
    const label = segment.match(/^[0-9a-f-]{20,}$/i)
      ? 'Detail'
      : BREADCRUMB_MAP[segment] ?? segment;
    crumbs.push({ label, href: path });
  }

  return crumbs;
}

export default function AdminHeader({ onMobileMenuToggle }: AdminHeaderProps) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const breadcrumbs = getBreadcrumbs(pathname);

  return (
    <header className="h-14 bg-gray-950 border-b border-gray-800 flex items-center px-4 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMobileMenuToggle}
        className="lg:hidden p-2 rounded-lg text-gray-400 hover:bg-gray-900 hover:text-white transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 flex-1 overflow-x-auto">
        {breadcrumbs.map((crumb, i) => (
          <div key={crumb.href} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <ChevronRight size={14} className="text-gray-600" />}
            {i === breadcrumbs.length - 1 ? (
              <span className="text-sm text-white font-medium">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="p-2 rounded-lg text-gray-400 hover:bg-gray-900 hover:text-white transition-colors relative">
          <Bell size={18} />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name ?? 'Admin'}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center">
              <User size={16} className="text-gray-400" />
            </div>
          )}
          <div className="hidden sm:block">
            <div className="text-xs font-medium text-white leading-none">
              {user?.name ?? 'Admin'}
            </div>
            <div className="text-xs text-gray-500 mt-0.5 leading-none">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
