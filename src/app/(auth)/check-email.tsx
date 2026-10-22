import { Link, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { colors, spacing } from '@/constants/theme';
import { AUTH_CALLBACK_URL } from '@/lib/auth-links';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';

export default function CheckEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';
  const [isResending, setIsResending] = useState(false);

  async function handleResend() {
    if (!email) {
      Alert.alert('Email unavailable', 'Return to create account and enter your email again.');
      return;
    }

    setIsResending(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: AUTH_CALLBACK_URL },
        })
      );

      if (error) {
        Alert.alert('Unable to resend email', error.message);
        return;
      }

      Alert.alert('Email sent', 'We sent a new confirmation link.');
    } catch (error) {
      Alert.alert(
        'Unable to reach Supabase',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsResending(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="ONE MORE STEP"
      title="Check your email"
      description={`We sent a confirmation link${email ? ` to ${email}` : ''}. Open it on this device to verify your account.`}>
      <View style={styles.actions}>
        <Button disabled={isResending} onPress={handleResend} variant="secondary">
          {isResending ? 'Sending…' : 'Resend confirmation email'}
        </Button>
        <Text style={styles.help}>
          After confirming, Barbell Battles should open automatically. If you already confirmed your
          account, return to sign in.
        </Text>
      </View>

      <Link href="/sign-in" style={styles.link}>
        Back to sign in
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: spacing.md,
  },
  help: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
