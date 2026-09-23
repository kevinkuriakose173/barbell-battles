import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { AppHeader } from '@/components/app-header';
import { colors, spacing } from '@/constants/theme';
import { getExercisesWithEntries } from '@/features/lifts/api';
import type { ExerciseWithEntries } from '@/features/lifts/types';
import { formatWeight } from '@/lib/units';
import { useAuth } from '@/providers/auth-provider';

export default function MyLiftsTabScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<ExerciseWithEntries[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadLifts = useCallback(async () => {
    try { setExercises(await getExercisesWithEntries()); }
    catch (error) { Alert.alert('Unable to load lifts', error instanceof Error ? error.message : 'Try again.'); }
    finally { setIsLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); void loadLifts(); }, [loadLifts]));

  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppHeader
          description={`Your best entry for each lift, ${profile?.first_name ?? 'athlete'}.`}
          eyebrow="MY LIFTS"
          title="Personal records"
        />
        <Button onPress={() => router.push('/lifts/add')}>Add lift</Button>
        {isLoading ? <ActivityIndicator color={colors.primaryLight} size="large" /> : (
          <View style={styles.list}>{exercises.map((exercise) => {
            const record = exercise.lift_entries.reduce((best, entry) => Math.max(best, Number(entry.weight_kg)), 0);
            return (
              <Pressable key={exercise.id} onPress={() => router.push({ pathname: '/lifts/[exerciseId]', params: { exerciseId: exercise.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.entryCount}>{exercise.lift_entries.length} {exercise.lift_entries.length === 1 ? 'entry' : 'entries'}</Text></View>
                <View style={styles.record}><Text style={styles.recordLabel}>PR</Text><Text style={styles.recordValue}>{record ? formatWeight(record, profile?.preferred_unit ?? 'lb') : '—'}</Text></View>
              </Pressable>
            );
          })}</View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', padding: spacing.lg },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  entryCount: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  exerciseName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  list: { gap: spacing.md },
  pressed: { opacity: 0.75 },
  record: { alignItems: 'flex-end', gap: spacing.xs },
  recordLabel: { color: colors.accent, fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  recordValue: { color: colors.text, fontSize: 20, fontWeight: '900' },
  safeArea: { backgroundColor: colors.background, flex: 1 },
});
