import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { AccountScreen } from '@/components/account-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';
import { useAuth } from '@/providers/auth-provider';

export default function ChangePasswordScreen() {
  const { session } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleChangePassword() {
    if (!session?.user.email || !currentPassword || !newPassword || !passwordConfirmation) {
      Alert.alert('Missing information', 'Complete all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Password too short', 'Use at least eight characters.');
      return;
    }

    if (newPassword !== passwordConfirmation) {
      Alert.alert('Passwords do not match', 'Enter the same new password in both fields.');
      return;
    }

    if (currentPassword === newPassword) {
      Alert.alert('Choose a new password', 'Your new password must differ from your current one.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: session.user.email,
          password: currentPassword,
        })
      );

      if (signInError) {
        Alert.alert('Current password is incorrect', 'Check your current password and try again.');
        return;
      }

      const { error } = await withTimeout(supabase.auth.updateUser({ password: newPassword }));

      if (error) {
        Alert.alert('Unable to change password', error.message);
        return;
      }

      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      Alert.alert('Password changed', 'Your password was updated successfully.');
    } catch (error) {
      Alert.alert(
        'Unable to change password',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AccountScreen
      title="Change password"
      description="Verify your current password, then choose a new password with at least eight characters.">
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          autoComplete="current-password"
          label="Current password"
          onChangeText={setCurrentPassword}
          secureTextEntry
          value={currentPassword}
        />
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          label="New password"
          onChangeText={setNewPassword}
          secureTextEntry
          value={newPassword}
        />
        <Field
          autoCapitalize="none"
          autoComplete="new-password"
          label="Confirm new password"
          onChangeText={setPasswordConfirmation}
          secureTextEntry
          value={passwordConfirmation}
        />
        <Button disabled={isSubmitting} onPress={handleChangePassword}>
          {isSubmitting ? 'Changing password…' : 'Change password'}
        </Button>
      </View>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
});
