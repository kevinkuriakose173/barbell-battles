import { Link } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSignIn() {
    if (!email.trim() || !password) {
      Alert.alert('Missing information', 'Enter your email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
      );

      if (error) {
        Alert.alert('Unable to sign in', error.message);
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
      eyebrow="FRIENDLY COMPETITION"
      title="Welcome back"
      description="Sign in to check your standings and keep building your total.">
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
          autoComplete="current-password"
          label="Password"
          onChangeText={setPassword}
          placeholder="Your password"
          secureTextEntry
          value={password}
        />
        <Button disabled={isSubmitting} onPress={handleSignIn}>
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </Button>
      </View>

      <Text style={styles.footer}>
        New to Barbell Battles?{' '}
        <Link href="/(auth)/sign-up" style={styles.link}>
          Create an account
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
