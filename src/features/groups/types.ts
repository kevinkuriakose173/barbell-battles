export type GroupMembership = {
  group_id: string;
  id: string;
  joined_at: string;
  role: 'owner' | 'member';
  user_id: string;
};

export type Group = {
  created_at: string;
  group_memberships: GroupMembership[];
  id: string;
  join_code: string;
  name: string;
  owner_id: string;
  updated_at: string;
};
