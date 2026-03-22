'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { Phone, ArrowRight, Loader2, CheckCircle } from 'lucide-react';
import Image from 'next/image';

// Google logo SVG component
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Facebook logo SVG
function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#1877F2" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

// LINE logo (Asian market alternative to WeChat)
function LineIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#06C755" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

type Step = 'providers' | 'phone' | 'otp';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const redirectTo = searchParams.get('redirectTo') ?? '/';

  const [step, setStep] = useState<Step>('providers');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState<string | null>(null); // which provider is loading
  const [error, setError] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const supabase = createClient();

  // Already logged in? Redirect
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace(redirectTo);
    });
  }, []);

  const handleOAuth = async (provider: 'google' | 'facebook' | 'line') => {
    setLoading(provider);
    setError('');

    const siteUrl =
      process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider as any,
      options: {
        redirectTo: `${siteUrl}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
        queryParams:
          provider === 'google'
            ? { access_type: 'offline', prompt: 'select_account' }
            : undefined,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(null);
    }
    // On success, browser navigates away — no need to reset loading
  };

  const handleSendOtp = async () => {
    if (!phone.match(/^\+?[1-9]\d{1,14}$/)) {
      setError('Enter a valid phone number with country code (e.g. +91XXXXXXXXXX)');
      return;
    }

    setLoading('phone');
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
        options: { channel: 'sms' },
      });

      if (error) throw error;

      setOtpSent(true);
      setStep('otp');
    } catch (err: any) {
      setError(err.message ?? 'Failed to send OTP');
    } finally {
      setLoading(null);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading('otp');
    setError('');

    try {
      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: otp,
        type: 'sms',
      });

      if (error) throw error;

      // Trigger DB sync via callback endpoint
      router.push(`/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`);
    } catch (err: any) {
      setError(err.message ?? 'Invalid code');
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-red-950/20 via-black to-black pointer-events-none" />

      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          <Image
            src="/logo.png"
            alt="The Gulel"
            width={220}
            height={60}
            className="h-14 w-auto mx-auto mb-4"
            priority
          />
          <p className="text-gray-400 text-sm mt-1">Continue watching in seconds</p>
        </div>

        <div className="w-full max-w-sm">
          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm text-center">
              {error}
            </div>
          )}

          {/* STEP: Provider selection */}
          {step === 'providers' && (
            <div className="space-y-3">
              <h2 className="text-white font-semibold text-lg text-center mb-6">
                Sign in to continue
              </h2>

              {/* Google */}
              <button
                onClick={() => handleOAuth('google')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-gray-900 font-semibold py-3.5 px-5 rounded-xl transition-all duration-150 shadow-sm"
              >
                {loading === 'google' ? (
                  <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Continue with Google</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleOAuth('facebook')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-[#1877F2] hover:bg-[#166FE5] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-150"
              >
                {loading === 'facebook' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <FacebookIcon />
                )}
                <span>Continue with Facebook</span>
              </button>

              {/* LINE (Asian market) */}
              <button
                onClick={() => handleOAuth('line')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-[#06C755] hover:bg-[#05B34D] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-150"
              >
                {loading === 'line' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <LineIcon />
                )}
                <span>Continue with LINE</span>
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-800" />
                </div>
                <div className="relative flex justify-center">
                  <span className="px-3 bg-black text-gray-600 text-xs uppercase tracking-widest">
                    or
                  </span>
                </div>
              </div>

              {/* Phone OTP */}
              <button
                onClick={() => setStep('phone')}
                disabled={!!loading}
                className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-5 rounded-xl transition-all duration-150"
              >
                <Phone className="w-5 h-5 text-gray-400" />
                <span>Continue with Phone</span>
              </button>

              <p className="text-gray-600 text-xs text-center mt-6 leading-relaxed">
                By continuing, you agree to Gulel's{' '}
                <a href="/terms" className="text-gray-400 hover:text-white underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-gray-400 hover:text-white underline">
                  Privacy Policy
                </a>
              </p>
            </div>
          )}

          {/* STEP: Phone input */}
          {step === 'phone' && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep('providers'); setError(''); }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2"
              >
                ← Back
              </button>
              <h2 className="text-white font-semibold text-lg">
                Enter your phone number
              </h2>
              <p className="text-gray-400 text-sm">
                We'll send a verification code via SMS
              </p>

              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  placeholder="+91 98765 43210"
                  autoFocus
                  className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 text-white placeholder-gray-600 rounded-xl py-3.5 pl-10 pr-4 outline-none transition-colors text-sm"
                />
              </div>

              <button
                onClick={handleSendOtp}
                disabled={!!loading || !phone}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-150"
              >
                {loading === 'phone' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Send Code</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP: OTP verify */}
          {step === 'otp' && (
            <div className="space-y-4">
              <button
                onClick={() => { setStep('phone'); setOtp(''); setError(''); }}
                className="text-gray-400 hover:text-white text-sm flex items-center gap-1 mb-2"
              >
                ← Back
              </button>
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <h2 className="text-white font-semibold text-lg">Code sent!</h2>
              </div>
              <p className="text-gray-400 text-sm">
                Enter the 6-digit code sent to{' '}
                <span className="text-white font-medium">{phone}</span>
              </p>

              <input
                type="number"
                value={otp}
                onChange={(e) => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                placeholder="123456"
                autoFocus
                className="w-full bg-gray-900 border border-gray-700 focus:border-red-500 text-white placeholder-gray-600 rounded-xl py-3.5 px-4 outline-none transition-colors text-center text-2xl font-mono tracking-widest"
              />

              <button
                onClick={handleVerifyOtp}
                disabled={!!loading || otp.length < 6}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-xl transition-all duration-150"
              >
                {loading === 'otp' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleSendOtp}
                disabled={!!loading}
                className="w-full text-gray-400 hover:text-white text-sm py-2 transition-colors"
              >
                Resend code
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
