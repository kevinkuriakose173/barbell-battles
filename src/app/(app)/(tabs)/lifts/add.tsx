import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/constants/theme';
import { createLiftEntry, getExercises } from '@/features/lifts/api';
import { LiftForm, type LiftFormValues } from '@/features/lifts/lift-form';
import type { Exercise } from '@/features/lifts/types';
import { parseLiftForm } from '@/features/lifts/validation';
import { useAuth } from '@/providers/auth-provider';

function today() { return new Date().toISOString().slice(0, 10); }

export default function AddLiftScreen() {
  const router = useRouter();
  const { exerciseId } = useLocalSearchParams<{ exerciseId?: string }>();
  const { profile, session } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    getExercises().then(setExercises).catch((error) => Alert.alert('Unable to load exercises', error.message)).finally(() => setIsLoading(false));
  }, []);

  async function handleSubmit(values: LiftFormValues) {
    if (!session) return;
    try {
      setIsSaving(true);
      const input = parseLiftForm(values, profile?.preferred_unit ?? 'lb');
      await createLiftEntry({ ...input, userId: session.user.id });
      router.back();
    } catch (error) {
      Alert.alert('Unable to save lift', error instanceof Error ? error.message : 'Try again.');
      setIsSaving(false);
    }
  }

  const selectedId = exerciseId && exercises.some((item) => item.id === exerciseId) ? exerciseId : exercises[0]?.id ?? '';
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeArea}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
          <View style={styles.header}><Text style={styles.eyebrow}>NEW ENTRY</Text><Text style={styles.title}>Add lift</Text></View>
          {isLoading ? <ActivityIndicator color={colors.primaryLight} /> : (
            <LiftForm key={selectedId} exercises={exercises} initialValues={{ exerciseId: selectedId, notes: '', performedAt: today(), weight: '' }} isSaving={isSaving} onSubmit={handleSubmit} submitLabel="Save lift" unit={profile?.preferred_unit ?? 'lb'} />
          )}
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
