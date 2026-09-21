import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignUp() {
    if (!email.trim() || !password || !passwordConfirmation) {
      Alert.alert('Missing information', 'Complete all fields to create your account.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least eight characters.');
      return;
    }

    if (password !== passwordConfirmation) {
      Alert.alert('Passwords do not match', 'Enter the same password in both fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({
          email: email.trim(),
          password,
        })
      );

      if (error) {
        Alert.alert('Unable to create account', error.message);
        return;
      }

      if (!data.session) {
        Alert.alert(
          'Check your email',
          'Confirm your email address, then return to Barbell Battles to sign in.'
        );
      }
    } catch (error) {
      Alert.alert(
        'Unable to reach Supabase',
        error instanceof Error ? error.message : 'Check your network connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthScreen
      eyebrow="JOIN THE BATTLE"
      title="Create your account"
      description="Start tracking your best lifts and competing with friends.">
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
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          label="Password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
        />
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          label="Confirm password"
          onChangeText={setPasswordConfirmation}
          placeholder="Repeat your password"
          secureTextEntry
          value={passwordConfirmation}
        />
        <Button disabled={isSubmitting} onPress={handleSignUp}>
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </Button>
      </View>

      <Text style={styles.footer}>
        Already have an account?{' '}
        <Link href="/(auth)/sign-in" style={styles.link}>
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
