import { getTranslations } from 'next-intl/server';

export default async function GlobalLoading() {
  const t = await getTranslations('common');
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-4">
      {/* Gulel brand mark */}
      <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-pink-500 rounded-xl flex items-center justify-center mb-2">
        <span className="text-white font-bold text-2xl">G</span>
      </div>

      {/* Spinner */}
      <svg
        className="animate-spin w-8 h-8 text-red-500"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
        />
      </svg>

      <p className="text-gray-500 text-sm">{t('loading')}</p>
    </div>
  );
}
