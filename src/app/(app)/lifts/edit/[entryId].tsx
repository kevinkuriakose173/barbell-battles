import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { colors, spacing } from '@/constants/theme';
import { deleteLiftEntry, getExercises, getLiftEntry, updateLiftEntry } from '@/features/lifts/api';
import { LiftForm, type LiftFormValues } from '@/features/lifts/lift-form';
import type { Exercise, LiftEntry } from '@/features/lifts/types';
import { parseLiftForm } from '@/features/lifts/validation';
import { kilogramsToUnit } from '@/lib/units';
import { useAuth } from '@/providers/auth-provider';

export default function EditLiftScreen() {
  const { entryId } = useLocalSearchParams<{ entryId: string }>();
  const router = useRouter();
  const { profile } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [entry, setEntry] = useState<LiftEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([getExercises(), getLiftEntry(entryId)])
      .then(([exerciseData, entryData]) => { setExercises(exerciseData); setEntry(entryData); })
      .catch((error) => Alert.alert('Unable to load lift', error.message));
  }, [entryId]);

  async function handleSubmit(values: LiftFormValues) {
    try {
      setIsSaving(true);
      await updateLiftEntry(entryId, parseLiftForm(values, profile?.preferred_unit ?? 'lb'));
      router.back();
    } catch (error) {
      Alert.alert('Unable to update lift', error instanceof Error ? error.message : 'Try again.');
      setIsSaving(false);
    }
  }

  function confirmDelete() {
    Alert.alert('Delete lift?', 'This entry will be permanently removed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => void handleDelete() },
    ]);
  }

  async function handleDelete() {
    try {
      setIsSaving(true);
      await deleteLiftEntry(entryId);
      router.back();
    } catch (error) {
      Alert.alert('Unable to delete lift', error instanceof Error ? error.message : 'Try again.');
      setIsSaving(false);
    }
  }

  const unit = profile?.preferred_unit ?? 'lb';
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
          <View style={styles.header}><Text style={styles.eyebrow}>LIFT ENTRY</Text><Text style={styles.title}>Edit lift</Text></View>
          {!entry ? <ActivityIndicator color={colors.primaryLight} /> : <>
            <LiftForm exercises={exercises} initialValues={{ exerciseId: entry.exercise_id, notes: entry.notes ?? '', performedAt: entry.performed_at, weight: String(Number(kilogramsToUnit(Number(entry.weight_kg), unit).toFixed(1))) }} isSaving={isSaving} onSubmit={handleSubmit} submitLabel="Update lift" unit={unit} />
            <Button disabled={isSaving} onPress={confirmDelete} variant="secondary">Delete lift</Button>
          </>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  back: { color: colors.primaryLight, fontSize: 16, fontWeight: '700' },
  content: { gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xl },
  eyebrow: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  flex: { flex: 1 },
  header: { gap: spacing.sm },
  safeArea: { backgroundColor: colors.background, flex: 1 },
  title: { color: colors.text, fontSize: 32, fontWeight: '900' },
});
