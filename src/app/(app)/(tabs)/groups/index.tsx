import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';
import { colors, spacing } from '@/constants/theme';
import { getGroups } from '@/features/groups/api';
import type { Group } from '@/features/groups/types';
import { useAuth } from '@/providers/auth-provider';

export default function GroupsTabScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadGroups = useCallback(async () => {
    try { setGroups(await getGroups()); }
    catch (error) { Alert.alert('Unable to load groups', error instanceof Error ? error.message : 'Try again.'); }
    finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); void loadGroups(); }, [loadGroups]));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          description="Create a group or join friends with an invite code."
          eyebrow="GROUPS"
          title="Your groups"
        />
        <View style={styles.actions}>
          <Button onPress={() => router.push('/groups/create' as Href)}>Create group</Button>
          <Button onPress={() => router.push('/groups/join' as Href)} variant="secondary">Join group</Button>
        </View>
        {isLoading ? <ActivityIndicator color={colors.primaryLight} size="large" /> : groups.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyTitle}>No groups yet</Text><Text style={styles.description}>Create one and share its code with a friend.</Text></View>
        ) : (
          <View style={styles.list}>{groups.map((group) => {
            const membership = group.group_memberships.find((item) => item.user_id === session?.user.id);
            return (
              <View key={group.id} style={styles.card}>
                <View style={styles.cardHeader}><Text style={styles.groupName}>{group.name}</Text><Text style={styles.role}>{membership?.role === 'owner' ? 'OWNER' : 'MEMBER'}</Text></View>
                <Text style={styles.memberCount}>{group.group_memberships.length} {group.group_memberships.length === 1 ? 'member' : 'members'}</Text>
                <View style={styles.codeRow}><Text style={styles.codeLabel}>JOIN CODE</Text><Text selectable style={styles.code}>{group.join_code}</Text></View>
              </View>
            );
          })}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, gap: spacing.sm, padding: spacing.lg },
  cardHeader: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  code: { color: colors.text, fontSize: 21, fontWeight: '900', letterSpacing: 2 },
  codeLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  codeRow: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, marginTop: spacing.sm, paddingTop: spacing.md },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  empty: { alignItems: 'center', paddingVertical: spacing.xl },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: spacing.sm },
  groupName: { color: colors.text, flex: 1, fontSize: 20, fontWeight: '900' },
  list: { gap: spacing.md },
  memberCount: { color: colors.textMuted, fontSize: 14 },
  role: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
});
