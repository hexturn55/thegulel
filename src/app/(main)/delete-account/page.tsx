import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Delete Your Account',
  description:
    'How to delete your Gulel account and what data is removed, for the Gulel website and the iOS and Android apps.',
};

/**
 * Public account-deletion instructions (no login required). Linked from the
 * privacy policy, the mobile apps and the Google Play / App Store listings.
 */
export default async function DeleteAccountPage() {
  const lastUpdated = '26 September 2026';
  const t = await getTranslations('legal');
  const tc = await getTranslations('common');

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Delete your Gulel account</h1>
        <p className="text-gray-500 text-sm mb-10">{t('lastUpdated', { date: lastUpdated })}</p>

        <div className="space-y-8 text-gray-400 leading-relaxed">
          <section>
            <p>
              You can permanently delete your Gulel account at any time, from the Gulel app on
              iOS or Android or from our website. This page explains how, and what happens to
              your data.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">1. How to delete your account</h2>
            <p className="font-semibold text-gray-300">In the Gulel app (iOS &amp; Android)</p>
            <ol className="list-decimal list-inside space-y-1 mt-1 mb-4">
              <li>Open the app and sign in.</li>
              <li>Go to <strong className="text-gray-300">Account</strong>.</li>
              <li>Tap <strong className="text-gray-300">Delete account</strong> and confirm.</li>
            </ol>
            <p className="font-semibold text-gray-300">On the web</p>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>
                <Link href="/auth/login?redirectTo=/profile" className="text-red-400 hover:text-red-300 transition">
                  Sign in
                </Link>{' '}
                at thegulel.com.
              </li>
              <li>Go to <strong className="text-gray-300">Profile</strong>.</li>
              <li>Select <strong className="text-gray-300">Delete account</strong> and confirm.</li>
            </ol>
            <p className="mt-4">
              Deletion takes effect immediately and cannot be undone.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">2. What is deleted</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Your Gulel account and profile (name, email, phone number, avatar, language).</li>
              <li>Your login identity (phone, Google or Sign in with Apple sign-in), including revoking Sign in with Apple access.</li>
              <li>Your coin balance and coin transaction history.</li>
              <li>Episodes you have unlocked.</li>
              <li>Your watch history and progress, and your search history.</li>
              <li>Your subscription records with Gulel, and your purchase customer record at our in-app purchase processor.</li>
            </ul>
            <p className="mt-2">
              Unused coins and unlocked episodes are lost and are not refunded. To prevent abuse of
              sign-up bonuses, we keep a one-way cryptographic hash of your phone number and email
              address; it cannot be turned back into your details. Records we are legally required
              to keep (for example tax records of payments) are retained only for the period the law
              requires.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">3. Subscriptions bought through the App Store or Google Play</h2>
            <p>
              Deleting your account does <strong className="text-gray-300">not</strong> cancel a
              subscription billed by Apple or Google. To stop future charges, cancel it in the store:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>
                <strong className="text-gray-300">iPhone / iPad:</strong> Settings &gt; your name &gt;
                Subscriptions.
              </li>
              <li>
                <strong className="text-gray-300">Android:</strong> Google Play Store &gt; profile icon
                &gt; Payments &amp; subscriptions &gt; Subscriptions.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">4. Can&apos;t sign in?</h2>
            <p>
              If you can no longer sign in, email{' '}
              <a href="mailto:support@thegulel.com" className="text-red-400 hover:text-red-300 transition">
                support@thegulel.com
              </a>{' '}
              from the email address (or with the phone number) linked to your account, and we will
              delete it for you, normally within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">5. More information</h2>
            <p>
              See our{' '}
              <Link href="/privacy" className="text-red-400 hover:text-red-300 transition">
                Privacy Policy
              </Link>{' '}
              for how we handle your data. Questions:{' '}
              <a href="mailto:support@thegulel.com" className="text-red-400 hover:text-red-300 transition">
                support@thegulel.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 text-gray-600 text-sm">
          {tc('copyright')}
        </div>
      </div>
    </div>
  );
}
