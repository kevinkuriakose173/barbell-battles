import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { AccountScreen } from '@/components/account-screen';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { withTimeout } from '@/lib/with-timeout';
import { useAuth } from '@/providers/auth-provider';

export default function DeleteAccountScreen() {
  const { session } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleDeleteRequest() {
    if (!session?.user.email || !password) {
      Alert.alert('Password required', 'Enter your password to verify this request.');
      return;
    }

    if (confirmation.trim().toUpperCase() !== 'DELETE') {
      Alert.alert('Confirmation required', 'Type DELETE to confirm permanent account deletion.');
      return;
    }

    Alert.alert(
      'Permanently delete account?',
      'Your profile, lift history, and group memberships cannot be recovered.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => void deleteAccount() },
      ]
    );
  }

  async function deleteAccount() {
    if (!session?.user.email) return;

    setIsSubmitting(true);
    try {
      const { error: signInError } = await withTimeout(
        supabase.auth.signInWithPassword({
          email: session.user.email,
          password,
        })
      );

      if (signInError) {
        Alert.alert('Password is incorrect', 'Check your password and try again.');
        return;
      }

      const { error } = await withTimeout(supabase.functions.invoke('delete-account'));

      if (error) {
        Alert.alert('Unable to delete account', error.message);
        return;
      }

      await supabase.auth.signOut({ scope: 'local' });
    } catch (error) {
      Alert.alert(
        'Unable to delete account',
        error instanceof Error ? error.message : 'Check your connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AccountScreen
      title="Delete account"
      description="This permanently removes your account and personal lifting history.">
      <View style={styles.warning}>
        <Text style={styles.warningTitle}>This cannot be undone</Text>
        <Text style={styles.warningText}>
          Groups you own will transfer to their earliest remaining member. Groups without another
          member will be deleted.
        </Text>
      </View>
      <View style={styles.form}>
        <Field
          autoCapitalize="none"
          autoComplete="current-password"
          label="Password"
          onChangeText={setPassword}
          secureTextEntry
          value={password}
        />
        <Field
          autoCapitalize="characters"
          autoCorrect={false}
          label="Type DELETE to confirm"
          onChangeText={setConfirmation}
          placeholder="DELETE"
          value={confirmation}
        />
        <Button disabled={isSubmitting} onPress={handleDeleteRequest} variant="secondary">
          {isSubmitting ? 'Deleting account…' : 'Delete account permanently'}
        </Button>
      </View>
    </AccountScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  warning: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#ef4444',
    borderRadius: 16,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  warningText: { color: colors.textMuted, fontSize: 14, lineHeight: 21 },
  warningTitle: { color: '#fca5a5', fontSize: 16, fontWeight: '800' },
});
