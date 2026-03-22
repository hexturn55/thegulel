import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Gulel OTT.',
  robots: { index: false },
};

export default function PrivacyPage() {
  const lastUpdated = '1 March 2026';

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: {lastUpdated}</p>

        <div className="space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">1. Introduction</h2>
            <p>
              Gulel Entertainment ("we", "us", "our") operates Gulel OTT at thegulel.com. This
              Privacy Policy explains how we collect, use, and protect your personal information
              when you use our Service. We comply with applicable data protection laws including
              the EU General Data Protection Regulation (GDPR) and India&apos;s Digital Personal Data
              Protection Act 2023 (DPDP Act).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">2. Data We Collect</h2>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-gray-300">Account data:</strong> Phone number or email used during sign-up.</li>
              <li><strong className="text-gray-300">Usage data:</strong> Episodes watched, watch progress, search queries.</li>
              <li><strong className="text-gray-300">Transaction data:</strong> Coin purchases, payment method type (not card details — handled by Stripe/Razorpay).</li>
              <li><strong className="text-gray-300">Device data:</strong> Browser type, OS, device identifiers, IP address.</li>
              <li><strong className="text-gray-300">Analytics data:</strong> Page views and interactions via Google Analytics 4 and Facebook Pixel (where consented).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>To provide, personalise, and improve the Service.</li>
              <li>To process payments and manage your coin balance.</li>
              <li>To send service-related notifications (OTP, receipts).</li>
              <li>To analyse usage trends and improve content recommendations.</li>
              <li>To detect and prevent fraud and abuse.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">4. Legal Basis (GDPR)</h2>
            <p>
              For users in the EU/EEA, we process personal data under the following legal bases:
              <br />• <strong className="text-gray-300">Contract performance</strong> — to provide the Service you signed up for.
              <br />• <strong className="text-gray-300">Legitimate interests</strong> — fraud prevention, security, analytics.
              <br />• <strong className="text-gray-300">Consent</strong> — marketing cookies and advertising pixels where required.
              <br />• <strong className="text-gray-300">Legal obligation</strong> — where required by applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">5. Data Sharing</h2>
            <p>
              We do not sell your personal data. We share data only with:
            </p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Payment processors (Stripe, Razorpay) — for transaction processing.</li>
              <li>Analytics providers (Google Analytics, Meta) — under their respective data processing agreements.</li>
              <li>Infrastructure providers (Vercel, Supabase) — for hosting and database services.</li>
              <li>Law enforcement — where required by law or valid legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">6. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Watch history and
              preferences are retained for up to 2 years of inactivity. You can request deletion of
              your account and associated data at any time from the Settings page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">7. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request erasure of your data ("right to be forgotten").</li>
              <li>Object to or restrict certain processing activities.</li>
              <li>Data portability (receive your data in a machine-readable format).</li>
              <li>Withdraw consent where processing is based on consent.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email us at{' '}
              <a href="mailto:hello@thegulel.com" className="text-red-400 hover:text-red-300 transition">
                hello@thegulel.com
              </a>
              . We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">8. Cookies</h2>
            <p>
              We use cookies and similar technologies for authentication, analytics, and advertising.
              You can control cookie settings through your browser. Disabling certain cookies may
              affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">9. Children&apos;s Privacy</h2>
            <p>
              Gulel OTT is not directed to children under 13. We do not knowingly collect personal
              data from children. If you believe we have collected data from a child, please contact
              us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">10. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated via the app or email. Continued use of the Service after the effective
              date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">11. Contact</h2>
            <p>
              For privacy enquiries or to exercise your rights, contact us at{' '}
              <a href="mailto:hello@thegulel.com" className="text-red-400 hover:text-red-300 transition">
                hello@thegulel.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="border-t border-zinc-800 mt-12 pt-8 text-gray-600 text-sm">
          © 2026 Gulel Entertainment. All rights reserved.
        </div>
      </div>
    </div>
  );
}
