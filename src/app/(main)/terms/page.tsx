import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Gulel OTT.',
  robots: { index: false },
};

export default async function TermsPage() {
  const lastUpdated = '1 March 2026';
  const t = await getTranslations('legal');
  const tc = await getTranslations('common');

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{t('termsTitle')}</h1>
        <p className="text-gray-500 text-sm mb-4">{t('lastUpdated', { date: lastUpdated })}</p>
        <p className="text-gray-500 text-xs italic mb-10 border-l-2 border-gray-700 pl-3">
          {t('authoritativeNotice')}
        </p>

        <div className="space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Gulel OTT ("the Service"), you agree to be bound by these
              Terms of Service. If you do not agree, please do not use the Service. These terms
              apply to all visitors, users, and others who access or use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">2. Use of the Service</h2>
            <p>
              You must be at least 13 years of age to use Gulel OTT. By creating an account, you
              represent that you meet this requirement. You are responsible for maintaining the
              security of your account credentials and for all activities that occur under your
              account.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">3. Coins and Payments</h2>
            <p>
              Gulel Coins are a virtual currency used to unlock premium episodes. Coins are
              non-refundable unless required by applicable law. Coins have no cash value and cannot
              be transferred between accounts. We reserve the right to modify coin pricing and
              availability at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">4. Content Licensing</h2>
            <p>
              All content on Gulel OTT — including videos, images, and text — is owned by Gulel
              Entertainment or its licensors. You are granted a limited, personal, non-transferable
              licence to stream content for personal, non-commercial use. Downloading, copying,
              re-distributing, or sharing content outside the platform is strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">5. Prohibited Conduct</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Circumventing or attempting to circumvent our paywall or access controls.</li>
              <li>Using automated tools (bots, scrapers) to access the Service.</li>
              <li>Sharing account credentials with others.</li>
              <li>Uploading or distributing malware, spam, or harmful content.</li>
              <li>Impersonating other users or Gulel staff.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">6. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind,
              either express or implied. We do not warrant that the Service will be uninterrupted,
              error-free, or free of viruses. Your use of the Service is at your sole risk.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">7. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by law, Gulel Entertainment shall not be liable for
              any indirect, incidental, special, consequential, or punitive damages arising from
              your use of the Service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">8. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account at any time for violation
              of these Terms, without prior notice. Upon termination, your right to use the Service
              ceases immediately. Unused coins are forfeited upon termination for cause.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">9. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. We will notify users of material changes
              via the app or email. Continued use of the Service after changes constitutes acceptance
              of the updated Terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">10. Contact</h2>
            <p>
              For questions about these Terms, please contact us at{' '}
              <a href="mailto:hello@thegulel.com" className="text-red-400 hover:text-red-300 transition">
                hello@thegulel.com
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
