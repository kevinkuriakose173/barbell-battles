import { type Href, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, spacing } from '@/constants/theme';
import { getGroups } from '@/features/groups/api';
import type { Group } from '@/features/groups/types';
import { getLeaderboard } from '@/features/leaderboard/api';
import type { LeaderboardEntry } from '@/features/leaderboard/types';
import { getExercises } from '@/features/lifts/api';
import type { Exercise } from '@/features/lifts/types';
import { formatWeight } from '@/lib/units';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/providers/auth-provider';

export default function LeaderboardScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [exerciseId, setExerciseId] = useState<string | null>(null);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [groupData, exerciseData, leaderboardData] = await Promise.all([
        getGroups(),
        getExercises(),
        getLeaderboard(groupId, exerciseId),
      ]);
      setGroups(groupData);
      setExercises(exerciseData);
      setEntries(leaderboardData);
    } catch (error) {
      Alert.alert('Unable to load leaderboard', error instanceof Error ? error.message : 'Try again.');
    } finally {
      setIsLoading(false);
    }
  }, [exerciseId, groupId]);

  useFocusEffect(useCallback(() => { setIsLoading(true); void load(); }, [load]));

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Unable to sign out', error.message);
  }

  const unit = profile?.preferred_unit ?? 'lb';
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>BARBELL BATTLES</Text>
            <Text style={styles.title}>Leaderboard</Text>
            <Text style={styles.description}>Compare personal records with the people in your groups.</Text>
          </View>
          <Pressable hitSlop={12} onPress={handleSignOut}><Text style={styles.signOut}>Sign out</Text></Pressable>
        </View>

        <View style={styles.actions}>
          <Button onPress={() => router.push('/lifts' as Href)}>My lifts</Button>
          <Button onPress={() => router.push('/groups' as Href)} variant="secondary">Groups</Button>
        </View>

        <Selector
          label="Scope"
          onSelect={setGroupId}
          options={[{ id: null, name: 'All my groups' }, ...groups.map((group) => ({ id: group.id, name: group.name }))]}
          selectedId={groupId}
        />
        <Selector
          label="Exercise"
          onSelect={setExerciseId}
          options={[{ id: null, name: 'All lifts' }, ...exercises.map((exercise) => ({ id: exercise.id, name: exercise.name }))]}
          selectedId={exerciseId}
        />

        {!exerciseId ? <Text style={styles.hint}>All lifts adds together one PR from each exercise.</Text> : null}

        {isLoading ? <ActivityIndicator color={colors.primaryLight} size="large" /> : (
          <View style={styles.list}>
            {entries.map((entry) => (
              <View key={entry.user_id} style={[styles.card, entry.is_current_user && styles.currentCard]}>
                <Text style={[styles.rank, entry.rank <= 3 && styles.topRank]}>#{entry.rank}</Text>
                <View style={styles.person}>
                  <Text style={styles.name}>{entry.first_name} {entry.last_name}{entry.is_current_user ? ' (You)' : ''}</Text>
                  <Text style={styles.username}>@{entry.username}</Text>
                </View>
                <View style={styles.scoreBlock}>
                  <Text style={styles.score}>{entry.score_kg > 0 ? formatWeight(entry.score_kg, unit) : '—'}</Text>
                  {!exerciseId ? <Text style={styles.liftCount}>{entry.lift_count} PRs</Text> : null}
                </View>
              </View>
            ))}
            {entries.length === 0 ? <Text style={styles.empty}>No members are available for this leaderboard.</Text> : null}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type SelectorOption = { id: string | null; name: string };

function Selector({ label, onSelect, options, selectedId }: { label: string; onSelect: (id: string | null) => void; options: SelectorOption[]; selectedId: string | null }) {
  return (
    <View style={styles.selector}>
      <Text style={styles.selectorLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.options}>
        {options.map((option) => {
          const selected = option.id === selectedId;
          return (
            <Pressable key={option.id ?? 'all'} onPress={() => onSelect(option.id)} style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionText, selected && styles.optionTextSelected]}>{option.name}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm },
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', gap: spacing.md, padding: spacing.md },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  currentCard: { borderColor: colors.primaryLight },
  description: { color: colors.textMuted, fontSize: 15, lineHeight: 22 },
  empty: { color: colors.textMuted, fontSize: 15, paddingVertical: spacing.xl, textAlign: 'center' },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  header: { flex: 1, gap: spacing.sm },
  headerRow: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: -spacing.sm },
  liftCount: { color: colors.textMuted, fontSize: 11 },
  list: { gap: spacing.sm },
  name: { color: colors.text, fontSize: 15, fontWeight: '800' },
  option: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  optionTextSelected: { color: '#ffffff' },
  options: { gap: spacing.sm },
  person: { flex: 1 },
  rank: { color: colors.textMuted, fontSize: 18, fontWeight: '900', minWidth: 34 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  score: { color: colors.text, fontSize: 17, fontWeight: '900' },
  scoreBlock: { alignItems: 'flex-end', gap: spacing.xs },
  selector: { gap: spacing.sm },
  selectorLabel: { color: colors.text, fontSize: 14, fontWeight: '800' },
  signOut: { color: colors.primaryLight, fontSize: 14, fontWeight: '700' },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  topRank: { color: colors.accent },
  username: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
});
