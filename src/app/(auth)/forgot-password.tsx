import { type Href, Link, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { PASSWORD_RECOVERY_URL } from '@/lib/auth-links';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleResetRequest() {
    if (!email.trim()) {
      Alert.alert('Email required', 'Enter the email address associated with your account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: PASSWORD_RECOVERY_URL,
        })
      );

      if (error) {
        Alert.alert('Unable to send reset email', error.message);
        return;
      }

      router.replace(`/check-reset-email?email=${encodeURIComponent(email.trim())}` as Href);
    } catch (error) {
      Alert.alert(
        'Unable to reach Supabase',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="ACCOUNT RECOVERY"
      title="Reset your password"
      description="Enter your account email and we’ll send you a secure password-reset link.">
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          label="Email"
          onChangeText={setEmail}
          placeholder="you@example.com"
          value={email}
        />
        <Button disabled={isSubmitting} onPress={handleResetRequest}>
          {isSubmitting ? 'Sending reset email…' : 'Send reset email'}
        </Button>
      </View>

      <Text style={styles.footer}>
        Remembered your password?{' '}
        <Link href="/sign-in" style={styles.link}>
          Sign in
        </Link>
      </Text>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  footer: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: spacing.md,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
});
