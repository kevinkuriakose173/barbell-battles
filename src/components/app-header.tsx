import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

type AppHeaderProps = {
  description: string;
  eyebrow: string;
  title: string;
};

export function AppHeader({ description, eyebrow, title }: AppHeaderProps) {
  const router = useRouter();
  const { profile } = useAuth();
  const initials = `${profile?.first_name.charAt(0) ?? ''}${profile?.last_name.charAt(0) ?? ''}`.toUpperCase();

  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      <Pressable
        accessibilityLabel="Open profile"
        accessibilityRole="button"
        hitSlop={8}
        onPress={() => router.push('/profile' as Href)}
        style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}>
        <Text style={styles.initials}>{initials || '?'}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.accent,
    borderRadius: 22,
    borderWidth: 1.5,
    height: 44,
    justifyContent: 'center',
    width: 44,
  },
  copy: { flex: 1, gap: spacing.sm },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  initials: { color: colors.text, fontSize: 14, fontWeight: '900' },
  pressed: { opacity: 0.7, transform: [{ scale: 0.96 }] },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
});
