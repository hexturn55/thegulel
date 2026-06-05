import Link from 'next/link';
import { Home } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 text-center">
      {/* Big 404 */}
      <div className="relative mb-6">
        <span className="text-[120px] font-black text-gray-800 leading-none select-none">404</span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-2xl">G</span>
          </div>
        </div>
      </div>

      <h1 className="text-white text-2xl font-bold mb-3">{t('notFoundTitle')}</h1>
      <p className="text-gray-400 text-sm mb-8 max-w-xs">
        {t('notFoundBody')}
      </p>

      <Link
        href="/"
        className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white font-semibold px-6 py-3 rounded-full transition"
      >
        <Home className="w-4 h-4" />
        {t('backHome')}
      </Link>
    </div>
  );
}
