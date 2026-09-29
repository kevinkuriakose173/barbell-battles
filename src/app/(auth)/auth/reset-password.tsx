import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';
import { useAuth } from '@/providers/auth-provider';

export default function ResetPasswordScreen() {
  const { authLinkError, finishPasswordRecovery, isHandlingAuthLink, session } = useAuth();
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handlePasswordUpdate() {
    if (!session) {
      Alert.alert('Reset link unavailable', 'Request a new password-reset email and try again.');
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
      const { error } = await withTimeout(supabase.auth.updateUser({ password }));

      if (error) {
        Alert.alert('Unable to update password', error.message);
        return;
      }

      Alert.alert('Password updated', 'Your new password is ready to use.', [
        { text: 'Continue', onPress: finishPasswordRecovery },
      ]);
    } catch (error) {
      Alert.alert(
        'Unable to reach Supabase',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const linkUnavailable = Boolean(authLinkError) || (!isHandlingAuthLink && !session);

  return (
    <AuthScreen
      eyebrow="ACCOUNT RECOVERY"
      title={linkUnavailable ? 'Reset link unavailable' : 'Choose a new password'}
      description={
        authLinkError ??
        (linkUnavailable
          ? 'Request a new reset link from the sign-in screen.'
          : 'Use a unique password with at least eight characters.')
      }>
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!linkUnavailable && !isHandlingAuthLink}
          label="New password"
          onChangeText={setPassword}
          placeholder="At least 8 characters"
          secureTextEntry
          value={password}
        />
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          editable={!linkUnavailable && !isHandlingAuthLink}
          label="Confirm new password"
          onChangeText={setPasswordConfirmation}
          placeholder="Repeat your password"
          secureTextEntry
          value={passwordConfirmation}
        />
        <Button
          disabled={isSubmitting || isHandlingAuthLink || linkUnavailable}
          onPress={handlePasswordUpdate}>
          {isSubmitting ? 'Updating password…' : 'Update password'}
        </Button>
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: spacing.md,
  },
});
