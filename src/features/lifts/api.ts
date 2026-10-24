import { supabase } from '@/lib/supabase';
import { invalidateQueryCache } from '@/lib/query-cache';

import type { Exercise, ExerciseWithEntries, LiftEntry } from './types';

const entryFields = 'id,user_id,exercise_id,weight_kg,performed_at,notes,created_at,updated_at';

export async function getExercises() {
  const { data, error } = await supabase
    .from('exercises')
    .select('id,name,slug,sort_order')
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as Exercise[];
}

export async function getExercisesWithEntries() {
  const { data, error } = await supabase
    .from('exercises')
    .select(`id,name,slug,sort_order,lift_entries(${entryFields})`)
    .eq('is_active', true)
    .order('sort_order');

  if (error) throw error;
  return data as ExerciseWithEntries[];
}

export async function getExerciseWithEntries(exerciseId: string) {
  const { data, error } = await supabase
    .from('exercises')
    .select(`id,name,slug,sort_order,lift_entries(${entryFields})`)
    .eq('id', exerciseId)
    .order('performed_at', { referencedTable: 'lift_entries', ascending: false })
    .single();

  if (error) throw error;
  return data as ExerciseWithEntries;
}

export async function getLiftEntry(entryId: string) {
  const { data, error } = await supabase
    .from('lift_entries')
    .select(entryFields)
    .eq('id', entryId)
    .single();

  if (error) throw error;
  return data as LiftEntry;
}

type LiftEntryInput = {
  exerciseId: string;
  notes: string | null;
  performedAt: string;
  userId: string;
  weightKg: number;
};

export async function createLiftEntry(input: LiftEntryInput) {
  const { error } = await supabase.from('lift_entries').insert({
    exercise_id: input.exerciseId,
    notes: input.notes,
    performed_at: input.performedAt,
    user_id: input.userId,
    weight_kg: input.weightKg,
  });
  if (error) throw error;
  invalidateQueryCache(`user:${input.userId}:lifts`);
  invalidateQueryCache(`user:${input.userId}:leaderboard:`);
}

export async function updateLiftEntry(entryId: string, input: LiftEntryInput) {
  const { error } = await supabase
    .from('lift_entries')
    .update({
      exercise_id: input.exerciseId,
      notes: input.notes,
      performed_at: input.performedAt,
      weight_kg: input.weightKg,
    })
    .eq('id', entryId);
  if (error) throw error;
  invalidateQueryCache(`user:${input.userId}:lifts`);
  invalidateQueryCache(`user:${input.userId}:leaderboard:`);
}

export async function deleteLiftEntry(entryId: string, userId: string) {
  const { error } = await supabase.from('lift_entries').delete().eq('id', entryId);
  if (error) throw error;
  invalidateQueryCache(`user:${userId}:lifts`);
  invalidateQueryCache(`user:${userId}:leaderboard:`);
}
