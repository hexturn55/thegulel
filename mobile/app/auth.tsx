import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/lib/auth';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendCode() {
    setError(null);
    if (!/^\+\d{8,15}$/.test(phone)) {
      setError('Enter your number in international format, e.g. +919876543210');
      return;
    }
    setBusy(true);
    try {
      await signInWithOtp(phone);
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send the code.');
    } finally {
      setBusy(false);
    }
  }

  async function confirm() {
    setError(null);
    setBusy(true);
    try {
      await verifyOtp(phone, code.trim());
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid code.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.heading}>
        {step === 'phone' ? 'Sign in with your phone' : 'Enter the code'}
      </Text>
      <Text style={styles.sub}>
        {step === 'phone'
          ? 'We’ll text you a one-time code.'
          : `Sent to ${phone}`}
      </Text>

      {step === 'phone' ? (
        <TextInput
          style={styles.input}
          placeholder="+91 98765 43210"
          placeholderTextColor="#6B7280"
          keyboardType="phone-pad"
          autoFocus
          value={phone}
          onChangeText={setPhone}
        />
      ) : (
        <TextInput
          style={styles.input}
          placeholder="123456"
          placeholderTextColor="#6B7280"
          keyboardType="number-pad"
          autoFocus
          value={code}
          onChangeText={setCode}
        />
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <Pressable
        style={[styles.button, busy && styles.buttonDisabled]}
        disabled={busy}
        onPress={step === 'phone' ? sendCode : confirm}
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
        <Pressable onPress={() => setStep('phone')} style={styles.link}>
          <Text style={styles.linkText}>Use a different number</Text>
        </Pressable>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B0B0F', padding: 24, justifyContent: 'center' },
  heading: { color: '#fff', fontSize: 24, fontWeight: '700' },
  sub: { color: '#9CA3AF', marginTop: 8, marginBottom: 24 },
  input: {
    backgroundColor: '#1A1A22',
    color: '#fff',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
  },
  error: { color: '#F87171', marginTop: 12 },
  button: {
    backgroundColor: '#E11D48',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  link: { marginTop: 16, alignItems: 'center' },
  linkText: { color: '#9CA3AF' },
});
