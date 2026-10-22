import { supabase } from '@/lib/supabase';

import type { LeaderboardEntry } from './types';

export async function getLeaderboard(groupId: string | null, exerciseId: string | null) {
  const { data, error } = await supabase.rpc('get_leaderboard', {
    scope_group_id: groupId,
    selected_exercise_id: exerciseId,
  });

  if (error) throw error;
  return (data as LeaderboardEntry[]).map((entry) => ({
    ...entry,
    lift_count: Number(entry.lift_count),
    rank: Number(entry.rank),
    score_kg: Number(entry.score_kg),
  }));
}
