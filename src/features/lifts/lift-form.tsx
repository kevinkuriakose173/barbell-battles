import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { colors, spacing } from '@/constants/theme';
import type { WeightUnit } from '@/lib/units';

import type { Exercise } from './types';

export type LiftFormValues = { exerciseId: string; notes: string; performedAt: string; weight: string };

type Props = {
  exercises: Exercise[];
  initialValues: LiftFormValues;
  isSaving: boolean;
  onSubmit: (values: LiftFormValues) => void;
  submitLabel: string;
  unit: WeightUnit;
};

export function LiftForm({ exercises, initialValues, isSaving, onSubmit, submitLabel, unit }: Props) {
  const [values, setValues] = useState(initialValues);
  function update<K extends keyof LiftFormValues>(key: K, value: LiftFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <View style={styles.form}>
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Exercise</Text>
        <View style={styles.exerciseList}>
          {exercises.map((exercise) => {
            const selected = exercise.id === values.exerciseId;
            return (
              <Pressable key={exercise.id} onPress={() => update('exerciseId', exercise.id)} style={[styles.exercise, selected && styles.exerciseSelected]}>
                <Text style={[styles.exerciseText, selected && styles.exerciseTextSelected]}>{exercise.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
      <Field keyboardType="decimal-pad" label={`Weight (${unit})`} onChangeText={(value) => update('weight', value)} placeholder="225" value={values.weight} />
      <Field autoCapitalize="none" label="Date" onChangeText={(value) => update('performedAt', value)} placeholder="YYYY-MM-DD" value={values.performedAt} />
      <Field label="Notes (optional)" maxLength={500} multiline onChangeText={(value) => update('notes', value)} placeholder="How did it feel?" value={values.notes} />
      <Button disabled={isSaving} onPress={() => onSubmit(values)}>{isSaving ? 'Saving…' : submitLabel}</Button>
    </View>
  );
}

const styles = StyleSheet.create({
  exercise: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: 999, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  exerciseList: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  exerciseSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  exerciseText: { color: colors.textMuted, fontSize: 14, fontWeight: '700' },
  exerciseTextSelected: { color: '#ffffff' },
  fieldGroup: { gap: spacing.sm },
  form: { gap: spacing.lg },
  label: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
