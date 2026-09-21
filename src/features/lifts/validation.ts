import { unitToKilograms, type WeightUnit } from '@/lib/units';

import type { LiftFormValues } from './lift-form';

export function parseLiftForm(values: LiftFormValues, unit: WeightUnit) {
  const weight = Number(values.weight.replace(',', '.'));
  if (!values.exerciseId) throw new Error('Choose an exercise.');
  if (!Number.isFinite(weight) || weight <= 0) throw new Error('Enter a valid weight greater than zero.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(values.performedAt) || Number.isNaN(Date.parse(`${values.performedAt}T00:00:00Z`))) {
    throw new Error('Enter the date as YYYY-MM-DD.');
  }
  return {
    exerciseId: values.exerciseId,
    notes: values.notes.trim() || null,
    performedAt: values.performedAt,
    weightKg: unitToKilograms(weight, unit),
  };
}
