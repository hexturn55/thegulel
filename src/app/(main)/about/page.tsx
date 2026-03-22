import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Gulel OTT',
  description: 'Learn about Gulel OTT — the home of addictive vertical micro dramas.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white pb-28">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">About Gulel OTT</h1>
        <p className="text-red-500 font-semibold mb-10">Vertical micro dramas, anywhere you go.</p>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">What is Gulel?</h2>
          <p className="text-gray-400 leading-relaxed">
            Gulel OTT is a streaming platform built for the short-attention, always-on generation.
            We deliver bite-sized vertical dramas — think full emotional arcs packed into episodes
            you can finish in under 5 minutes. Romance, thriller, family drama, action: all shot
            vertically, built for your phone, and designed to keep you hooked.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">Our Content</h2>
          <p className="text-gray-400 leading-relaxed">
            We produce and license original Hindi and Chinese micro drama series. Our library spans
            romance, supernatural, revenge, and slice-of-life genres. New series drop regularly.
            The first few episodes of every series are always free — unlock the rest with Gulel Coins.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">How It Works</h2>
          <ul className="text-gray-400 space-y-2 leading-relaxed list-disc list-inside">
            <li>Browse and watch free episodes — no account needed to start.</li>
            <li>Sign in to save your progress and pick up where you left off.</li>
            <li>Purchase Gulel Coins to unlock premium episodes.</li>
            <li>Or watch a short ad to earn free coins.</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-xl font-bold mb-3 text-gray-100">Contact Us</h2>
          <p className="text-gray-400 leading-relaxed">
            Questions, feedback, or partnership enquiries? We&apos;d love to hear from you.
          </p>
          <a
            href="mailto:hello@thegulel.com"
            className="inline-block mt-3 text-red-400 hover:text-red-300 font-semibold transition"
          >
            hello@thegulel.com
          </a>
        </section>

        <div className="border-t border-zinc-800 pt-8 text-gray-600 text-sm">
          © 2026 Gulel Entertainment. All rights reserved.
        </div>
      </div>
    </div>
  );
}
