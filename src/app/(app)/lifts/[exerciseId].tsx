import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, spacing } from '@/constants/theme';
import { getExerciseWithEntries } from '@/features/lifts/api';
import type { ExerciseWithEntries } from '@/features/lifts/types';
import { formatWeight } from '@/lib/units';
import { useAuth } from '@/providers/auth-provider';

export default function LiftHistoryScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [exercise, setExercise] = useState<ExerciseWithEntries | null>(null);

  const load = useCallback(async () => {
    try { setExercise(await getExerciseWithEntries(exerciseId)); }
    catch (error) { Alert.alert('Unable to load history', error instanceof Error ? error.message : 'Try again.'); }
  }, [exerciseId]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const unit = profile?.preferred_unit ?? 'lb';
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ My lifts</Text></Pressable>
        {!exercise ? <ActivityIndicator color={colors.primaryLight} /> : <>
          <View style={styles.header}><Text style={styles.eyebrow}>LIFT HISTORY</Text><Text style={styles.title}>{exercise.name}</Text></View>
          <Button onPress={() => router.push({ pathname: '/lifts/add', params: { exerciseId } })}>Add {exercise.name}</Button>
          {exercise.lift_entries.length === 0 ? <Text style={styles.empty}>No entries yet. Add your first lift.</Text> : (
            <View style={styles.list}>{exercise.lift_entries.map((entry) => (
              <Pressable key={entry.id} onPress={() => router.push({ pathname: '/lifts/edit/[entryId]', params: { entryId: entry.id } })} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
                <View><Text style={styles.weight}>{formatWeight(Number(entry.weight_kg), unit)}</Text><Text style={styles.date}>{entry.performed_at}</Text></View>
                <Text style={styles.edit}>Edit ›</Text>
                {entry.notes ? <Text style={styles.notes}>{entry.notes}</Text> : null}
              </Pressable>
            ))}</View>
          )}
        </>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.primaryLight, fontSize: 16, fontWeight: '700' },
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 16, borderWidth: 1, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', padding: spacing.lg },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  date: { color: colors.textMuted, fontSize: 13, marginTop: spacing.xs },
  edit: { color: colors.primaryLight, fontSize: 14, fontWeight: '700' },
  empty: { color: colors.textMuted, fontSize: 16, textAlign: 'center', paddingVertical: spacing.xl },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  header: { gap: spacing.sm },
  list: { gap: spacing.md },
  notes: { color: colors.textMuted, flexBasis: '100%', lineHeight: 20, marginTop: spacing.md },
  pressed: { opacity: 0.75 },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
  weight: { color: colors.text, fontSize: 22, fontWeight: '900' },
});
