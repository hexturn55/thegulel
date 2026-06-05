import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'About Gulel OTT',
  description: 'Learn about Gulel OTT — the home of addictive vertical micro dramas.',
};

export default async function AboutPage() {
  const t = await getTranslations('about');
  const tc = await getTranslations('common');
  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-red-500 font-semibold mb-10">{t('tagline')}</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">{t('whatTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">
            {t('whatBody')}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">{t('contentTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">
            {t('contentBody')}
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">{t('howTitle')}</h2>
          <ul className="text-gray-400 space-y-2 leading-relaxed list-disc list-inside">
            <li>{t('how1')}</li>
            <li>{t('how2')}</li>
            <li>{t('how3')}</li>
            <li>{t('how4')}</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">{t('contactTitle')}</h2>
          <p className="text-gray-400 leading-relaxed">
            {t('contactBody')}
          </p>
          <a
            href="mailto:hello@thegulel.com"
            className="inline-block mt-3 text-red-400 hover:text-red-300 font-semibold transition"
          >
            hello@thegulel.com
          </a>
        </section>

        <div className="border-t border-zinc-800 pt-8 text-gray-600 text-sm">
          {tc('copyright')}
        </div>
      </div>
    </div>
  );
}
