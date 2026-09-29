import { type Href, useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function ProfileScreen() {
  const router = useRouter();
  const { profile, session } = useAuth();
  const initials = `${profile?.first_name.charAt(0) ?? ''}${profile?.last_name.charAt(0) ?? ''}`.toUpperCase();

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Unable to sign out', error.message);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        <View style={styles.hero}>
          <View style={styles.avatar}><Text style={styles.initials}>{initials || '?'}</Text></View>
          <View style={styles.identity}>
            <Text style={styles.name}>{profile?.first_name} {profile?.last_name}</Text>
            <Text style={styles.username}>@{profile?.username}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <ProfileRow label="Email" value={session?.user.email ?? 'Not available'} />
          <View style={styles.divider} />
          <ProfileRow label="Preferred unit" value={profile?.preferred_unit.toUpperCase() ?? 'LB'} />
        </View>

        <View style={styles.actions}>
          <Button onPress={() => router.push('/account/edit-profile' as Href)} variant="secondary">
            Edit profile
          </Button>
          <Button onPress={() => router.push('/account/change-password' as Href)} variant="secondary">
            Change password
          </Button>
          <Button onPress={() => router.push('/account/delete-account' as Href)} variant="secondary">
            Delete account
          </Button>
        </View>

        <Button onPress={handleSignOut} variant="secondary">Sign out</Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowLabel}>{label}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', backgroundColor: colors.accent, borderRadius: 38, height: 76, justifyContent: 'center', width: 76 },
  actions: { gap: spacing.sm },
  back: { color: colors.primaryLight, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, padding: spacing.lg },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: spacing.md },
  hero: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  identity: { flex: 1, gap: spacing.xs },
  initials: { color: '#18233a', fontSize: 24, fontWeight: '900' },
  name: { color: colors.text, fontSize: 27, fontWeight: '900' },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  username: { color: colors.primaryLight, fontSize: 15, fontWeight: '700' },
});
