export type Exercise = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
};

export type LiftEntry = {
  created_at: string;
  exercise_id: string;
  id: string;
  notes: string | null;
  performed_at: string;
  updated_at: string;
  user_id: string;
  weight_kg: number;
};

export type ExerciseWithEntries = Exercise & {
  lift_entries: LiftEntry[];
};
