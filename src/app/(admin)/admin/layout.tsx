'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { ToastProvider } from '@/components/admin/Toast';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, checkSession } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkSession().then(() => setAuthChecked(true));
  }, [checkSession]);

  useEffect(() => {
    if (!authChecked) return;

    if (!isAuthenticated) {
      router.replace('/auth/login');
      return;
    }

    // Check for admin role — supports both the current schema and future role field
    const userWithRole = user as (typeof user & { role?: string }) | null;
    if (userWithRole?.role && !['admin', 'superadmin'].includes(userWithRole.role)) {
      router.replace('/');
    }
  }, [authChecked, isAuthenticated, user, router]);

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-950 flex">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          <AdminSidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed((v) => !v)}
          />
        </div>

        {/* Mobile sidebar overlay */}
        {mobileSidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-40 flex">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setMobileSidebarOpen(false)}
            />
            <div className="relative z-10">
              <AdminSidebar
                collapsed={false}
                onToggle={() => setMobileSidebarOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminHeader onMobileMenuToggle={() => setMobileSidebarOpen((v) => !v)} />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
