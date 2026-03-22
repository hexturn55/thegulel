import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import { Footer } from '@/components/Footer';

/**
 * Main app shell layout — wraps all content pages with Header, Footer, and BottomNav.
 * Auth pages live outside this group and render without the shell.
 * Watch pages (full-screen video) are also outside this group.
 */
export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
