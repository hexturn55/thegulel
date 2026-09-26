import { Metadata } from 'next';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Gulel OTT.',
  robots: { index: false },
};

export default async function PrivacyPage() {
  const lastUpdated = '26 September 2026';
  const t = await getTranslations('legal');
  const tc = await getTranslations('common');

  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">{t('privacyTitle')}</h1>
        <p className="text-gray-500 text-sm mb-4">{t('lastUpdated', { date: lastUpdated })}</p>
        <p className="text-gray-500 text-xs italic mb-10 border-l-2 border-gray-700 pl-3">
          {t('authoritativeNotice')}
        </p>

        <div className="space-y-8 text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">1. Introduction</h2>
            <p>
              Gulel Entertainment (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) operates Gulel OTT at thegulel.com and the
              Gulel apps for iOS and Android. This
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
              <li>Apple (App Store In-App Purchase), Google (Google Play Billing) and RevenueCat — for purchases made in the mobile apps.</li>
              <li>Google AdMob — to serve rewarded ads in the mobile apps (see section 6).</li>
              <li>Analytics providers (Google Analytics, Meta) — under their respective data processing agreements.</li>
              <li>Infrastructure providers (Vercel, Supabase) — for hosting and database services.</li>
              <li>Law enforcement — where required by law or valid legal process.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">6. Mobile apps (iOS &amp; Android)</h2>
            <p>When you use the Gulel apps for iOS and Android, the following also applies:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>
                <strong className="text-gray-300">Sign-in:</strong> you can sign in with your phone
                number (one-time SMS code, via Supabase), with Google, or with Sign in with Apple. We
                receive your name, email address and/or phone number from the method you choose.
                If you use Sign in with Apple and choose to hide your email, we only receive Apple&apos;s
                private relay address.
              </li>
              <li>
                <strong className="text-gray-300">Rewarded ads:</strong> in the Android app (and on
                the website, where offered) you can choose to watch an ad to earn coins; the iOS app
                currently shows no ads. These ads are served by Google (AdMob / Ad Manager), which
                may use your device&apos;s advertising identifier (AAID on Android), cookies, IP address and device information to show, measure and limit ads. Where the
                law requires it, we ask for your consent first using Google&apos;s User Messaging
                Platform (UMP); if you decline, only non-personalised ads are shown. If we offer ads
                on iOS in the future, we will ask for permission through Apple&apos;s App Tracking
                Transparency (ATT) prompt before using the advertising identifier (IDFA). Where
                available, you can change your ad privacy choices from the app&apos;s Get Coins
                screen (&ldquo;Ad privacy settings&rdquo;); you can also reset or limit the
                advertising identifier in your device settings.
              </li>
              <li>
                <strong className="text-gray-300">Ad reward verification:</strong> when you finish a
                rewarded ad, Google sends a server-side verification callback to our servers that
                includes your Gulel user ID, so we can credit your coins securely and prevent abuse.
              </li>
              <li>
                <strong className="text-gray-300">In-app purchases:</strong> coins and VIP
                subscriptions bought in the apps are paid through Apple In-App Purchase or Google
                Play Billing. Purchases are processed by RevenueCat, which receives your Gulel user
                ID and the purchase details (not your card details) so we can grant what you bought.
                Store subscriptions are managed and cancelled in your App Store or Google Play
                account.
              </li>
              <li>
                <strong className="text-gray-300">Account deletion:</strong> you can delete your
                account in the app (Account &gt; Delete account). See{' '}
                <Link href="/delete-account" className="text-red-400 hover:text-red-300 transition">
                  thegulel.com/delete-account
                </Link>{' '}
                for details.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">7. Data Retention</h2>
            <p>
              We retain your account data for as long as your account is active. Watch history and
              preferences are retained for up to 2 years of inactivity. You can delete your account
              and associated data at any time — see{' '}
              <Link href="/delete-account" className="text-red-400 hover:text-red-300 transition">
                how to delete your account
              </Link>
              . After deletion we keep only a one-way hash of your phone number and email address,
              used solely to prevent repeated sign-up bonus abuse.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request erasure of your data (&quot;right to be forgotten&quot;).</li>
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
            <h2 className="text-lg font-bold text-gray-100 mb-2">9. Cookies</h2>
            <p>
              We use cookies and similar technologies for authentication, analytics, and advertising.
              You can control cookie settings through your browser. Disabling certain cookies may
              affect Service functionality.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">10. Children&apos;s Privacy</h2>
            <p>
              Gulel OTT is not directed to children under 13. We do not knowingly collect personal
              data from children. If you believe we have collected data from a child, please contact
              us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be
              communicated via the app or email. Continued use of the Service after the effective
              date constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-100 mb-2">12. Contact</h2>
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
          {tc('copyright')}
        </div>
      </div>
    </div>
  );
}
