import { supabase } from '@/lib/supabase';

import type { Group } from './types';

export async function getGroups() {
  const { data, error } = await supabase
    .from('groups')
    .select('id,name,join_code,owner_id,created_at,updated_at,group_memberships(id,group_id,user_id,role,joined_at)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data as Group[];
}

export async function createGroup(name: string) {
  const { data, error } = await supabase.rpc('create_group', { group_name: name });
  if (error) throw error;
  return data as string;
}

export async function joinGroup(joinCode: string) {
  const { data, error } = await supabase.rpc('join_group', { group_join_code: joinCode });
  if (error) throw error;
  return data as string;
}
