import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function AuthCallbackScreen() {
  const { authLinkError, isHandlingAuthLink } = useAuth();

  return (
    <AuthScreen
      eyebrow="SECURE SIGN IN"
      title={authLinkError ? 'Link unavailable' : 'Confirming your account'}
      description={
        authLinkError
          ? authLinkError
          : 'Please wait while Barbell Battles securely finishes your request.'
      }>
      <View style={styles.status}>
        {isHandlingAuthLink ? <ActivityIndicator color={colors.accent} size="large" /> : null}
        {!isHandlingAuthLink && !authLinkError ? (
          <Text style={styles.message}>Confirmation complete. Opening your account…</Text>
        ) : null}
      </View>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  message: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  status: {
    alignItems: 'center',
    gap: spacing.md,
  },
});
