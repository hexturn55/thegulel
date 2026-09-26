import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useAuth } from '@/lib/auth';
import { config } from '@/lib/config';

const RESEND_SECONDS = 30;
const CODE_LENGTH = 6;
/** Give up waiting for /me after sign-in (covers timeout + one 404 retry). */
const USER_LOAD_TIMEOUT_MS = 40_000;

/**
 * Build an E.164 number from the country-code and number fields. A number
 * typed/pasted with a leading '+' is taken as already international.
 */
function toE164(countryCode: string, number: string): string {
  const n = number.replace(/[\s().-]/g, '');
  if (n.startsWith('+')) return `+${n.slice(1).replace(/\D/g, '')}`;
  const cc = countryCode.replace(/\D/g, '');
  let national = n.replace(/\D/g, '');
  // Drop the domestic trunk prefix ("0" in 098765...), except in Italy where
  // the leading 0 is part of the number.
  if (cc !== '39') national = national.replace(/^0+/, '');
  return `+${cc}${national}`;
}

function friendlyError(e: unknown, fallback: string): string {
  const err = (e ?? {}) as { code?: unknown; message?: unknown; status?: unknown };
  const code = typeof err.code === 'string' ? err.code : '';
  const message = typeof err.message === 'string' ? err.message : '';
  if (code === 'over_sms_send_rate_limit' || code === 'over_request_rate_limit' || err.status === 429) {
    return 'Too many attempts, try again later';
  }
  if (code === 'otp_expired' || /invalid|expired/i.test(code) || /invalid|expired/i.test(message)) {
    return 'That code is invalid or expired';
  }
  return message || fallback;
}

export default function AuthScreen() {
  const router = useRouter();
  const {
    session,
    user,
    loading,
    userError,
    refresh,
    signInWithOtp,
    verifyOtp,
    signInWithGoogle,
    signInWithApple,
  } = useAuth();

  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [countryCode, setCountryCode] = useState('+91');
  const [number, setNumber] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [appleAvailable, setAppleAvailable] = useState(false);
  /** Signed in; waiting for the Gulel user to load before closing. */
  const [awaitingUser, setAwaitingUser] = useState(false);
  /** Signed in, but loading the Gulel user failed. */
  const [loadFailed, setLoadFailed] = useState(false);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (Platform.OS !== 'ios') return;
    let alive = true;
    AppleAuthentication.isAvailableAsync()
      .then((ok) => {
        if (alive) setAppleAvailable(ok);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  // Resend countdown; the interval is cleared on unmount / when it reaches 0.
  const counting = step === 'code' && resendIn > 0;
  useEffect(() => {
    if (!counting) return;
    const t = setInterval(() => setResendIn((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [counting]);

  const close = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  // After a successful sign-in, close once the user record has loaded.
  useEffect(() => {
    if (!awaitingUser || loading) return;
    if (user) {
      setAwaitingUser(false);
      close();
    } else if (userError) {
      setAwaitingUser(false);
      setLoadFailed(true);
    } else if (!session) {
      // The server rejected the new session (/me 401 -> local sign-out): back
      // to the sign-in form instead of waiting out the load timeout.
      setAwaitingUser(false);
      setLoadFailed(false);
      setError('Sign-in failed, please try again.');
    }
  }, [awaitingUser, loading, session, user, userError, close]);

  useEffect(() => {
    if (!awaitingUser) return;
    const t = setTimeout(() => {
      setAwaitingUser(false);
      setLoadFailed(true);
    }, USER_LOAD_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [awaitingUser]);

  const signedIn = () => {
    setLoadFailed(false);
    setAwaitingUser(true);
  };

  async function sendCode() {
    setError(null);
    const phone = toE164(countryCode, number);
    if (!/^\+\d{8,15}$/.test(phone)) {
      setError('Enter a valid mobile number, e.g. +91 98765 43210');
      return;
    }
    setBusy(true);
    try {
      await signInWithOtp(phone);
      setSentTo(phone);
      setCode('');
      setResendIn(RESEND_SECONDS);
      setStep('code');
    } catch (e) {
      setError(friendlyError(e, 'Could not send the code.'));
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    if (resendIn > 0 || busy) return;
    setError(null);
    setBusy(true);
    try {
      await signInWithOtp(sentTo);
      setCode('');
      setResendIn(RESEND_SECONDS);
    } catch (e) {
      setError(friendlyError(e, 'Could not resend the code.'));
    } finally {
      setBusy(false);
    }
  }

  async function confirm(value: string = code) {
    const token = value.replace(/\D/g, '');
    if (token.length !== CODE_LENGTH || verifyingRef.current) return;
    verifyingRef.current = true;
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(sentTo, token);
      signedIn();
    } catch (e) {
      setError(friendlyError(e, 'Invalid code.'));
    } finally {
      verifyingRef.current = false;
      setBusy(false);
    }
  }

  function onCodeChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH);
    setCode(digits);
    if (digits.length === CODE_LENGTH) void confirm(digits);
  }

  function differentNumber() {
    setCode('');
    setError(null);
    setStep('phone');
  }

  async function google() {
    setError(null);
    setBusy(true);
    try {
      if (await signInWithGoogle()) signedIn();
    } catch (e) {
      setError(friendlyError(e, 'Google sign-in failed.'));
    } finally {
      setBusy(false);
    }
  }

  async function apple() {
    setError(null);
    setBusy(true);
    try {
      if (await signInWithApple()) signedIn();
    } catch (e) {
      setError(friendlyError(e, 'Apple sign-in failed.'));
    } finally {
      setBusy(false);
    }
  }

  function retryLoad() {
    signedIn();
    void refresh();
  }

  if (awaitingUser) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color="#fff" />
        <Text style={styles.sub}>Signing you in…</Text>
      </View>
    );
  }

  if (loadFailed) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.heading}>Couldn’t load your account</Text>
        <Text style={styles.sub}>
          You’re signed in, but we couldn’t reach Gulel. Check your connection and try again.
        </Text>
        <Pressable accessibilityRole="button" style={styles.button} onPress={retryLoad}>
          <Text style={styles.buttonText}>Try again</Text>
        </Pressable>
        <Pressable accessibilityRole="button" style={styles.link} onPress={close}>
          <Text style={styles.linkText}>Close</Text>
        </Pressable>
      </View>
    );
  }

  const showApple = Platform.OS === 'ios' && appleAvailable;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.heading}>
          {step === 'phone' ? 'Sign in with your phone' : 'Enter the code'}
        </Text>
        <Text style={styles.sub}>
          {step === 'phone' ? 'We’ll text you a one-time code.' : `Sent to ${sentTo}`}
        </Text>

        {step === 'phone' ? (
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.ccInput]}
              accessibilityLabel="Country code"
              placeholder="+91"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              maxLength={5}
              value={countryCode}
              onChangeText={(t) => setCountryCode(`+${t.replace(/\D/g, '')}`)}
            />
            <TextInput
              style={[styles.input, styles.numberInput]}
              accessibilityLabel="Mobile number"
              placeholder="98765 43210"
              placeholderTextColor="#6B7280"
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              autoFocus
              value={number}
              onChangeText={(t) => setNumber(t.replace(/[^\d+\s().-]/g, ''))}
              onSubmitEditing={() => void sendCode()}
            />
          </View>
        ) : (
          <TextInput
            style={[styles.input, styles.codeInput]}
            accessibilityLabel="Verification code"
            placeholder="123456"
            placeholderTextColor="#6B7280"
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            maxLength={CODE_LENGTH}
            autoFocus
            value={code}
            onChangeText={onCodeChange}
          />
        )}

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          accessibilityRole="button"
          style={[styles.button, busy && styles.buttonDisabled]}
          disabled={busy}
          onPress={step === 'phone' ? () => void sendCode() : () => void confirm()}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {step === 'phone' ? 'Send code' : 'Verify & sign in'}
            </Text>
          )}
        </Pressable>

        {step === 'code' && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ disabled: resendIn > 0 || busy }}
              disabled={resendIn > 0 || busy}
              onPress={() => void resend()}
              style={styles.link}
            >
              <Text style={[styles.linkText, resendIn > 0 && styles.linkDisabled]}>
                {resendIn > 0 ? `Resend code in ${resendIn}s` : 'Resend code'}
              </Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={differentNumber} style={styles.link}>
              <Text style={styles.linkText}>Use a different number</Text>
            </Pressable>
          </>
        )}

        {step === 'phone' && (
          <>
            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.divider} />
            </View>
            {showApple && (
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={12}
                style={styles.appleButton}
                onPress={() => {
                  if (!busy) void apple();
                }}
              />
            )}
            <Pressable
              accessibilityRole="button"
              style={[styles.googleButton, busy && styles.buttonDisabled]}
              disabled={busy}
              onPress={() => void google()}
            >
              <Text style={styles.googleText}>Continue with Google</Text>
            </Pressable>
          </>
        )}

        <Text style={styles.consent}>
          By continuing you agree to our{' '}
          <Text
            accessibilityRole="link"
            style={styles.consentLink}
            onPress={() => void WebBrowser.openBrowserAsync(config.termsUrl)}
          >
            Terms
          </Text>{' '}
          and{' '}
          <Text
            accessibilityRole="link"
            style={styles.consentLink}
            onPress={() => void WebBrowser.openBrowserAsync(config.privacyUrl)}
          >
            Privacy Policy
          </Text>
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#0B0B0F' },
  container: {
    flexGrow: 1,
    backgroundColor: '#0B0B0F',
    padding: 24,
    justifyContent: 'center',
  },
  center: { flex: 1, alignItems: 'center', gap: 12 },
  heading: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sub: { color: '#9CA3AF', marginTop: 8, marginBottom: 24, textAlign: 'left' },
  phoneRow: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: '#1A1A22',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
  },
  ccInput: { width: 84, textAlign: 'center' },
  numberInput: { flex: 1 },
  codeInput: { letterSpacing: 8, textAlign: 'center' },
  error: { color: '#F87171', marginTop: 12 },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#9CA3AF' },
  linkDisabled: { color: '#6B7280' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20, gap: 12 },
  divider: { flex: 1, height: 1, backgroundColor: '#2A2A33' },
  dividerText: { color: '#6B7280' },
  appleButton: { height: 48, width: '100%', marginBottom: 12 },
  googleButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleText: { color: '#1F2937', fontSize: 16, fontWeight: '700' },
  consent: { color: '#6B7280', fontSize: 12, textAlign: 'center', marginTop: 24, lineHeight: 18 },
  consentLink: { color: '#D1D5DB', textDecorationLine: 'underline' },
});
