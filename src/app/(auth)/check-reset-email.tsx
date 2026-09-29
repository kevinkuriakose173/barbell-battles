import { Link, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { AuthScreen } from '@/components/auth-screen';
import { colors } from '@/constants/theme';

export default function CheckResetEmailScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const email = typeof params.email === 'string' ? params.email : '';

  return (
    <AuthScreen
      eyebrow="RESET LINK SENT"
      title="Check your email"
      description={`If an account exists${email ? ` for ${email}` : ''}, a password-reset link is on its way.`}>
      <Text style={styles.help}>
        Open the link on this device. Barbell Battles will open to a screen where you can choose a
        new password.
      </Text>
      <Link href="/sign-in" style={styles.link}>
        Back to sign in
      </Link>
    </AuthScreen>
  );
}

const styles = StyleSheet.create({
  help: {
    color: colors.textMuted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center',
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
