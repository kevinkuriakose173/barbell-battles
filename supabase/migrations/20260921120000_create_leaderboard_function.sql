create function public.get_leaderboard(
  scope_group_id uuid default null,
  selected_exercise_id uuid default null
)
returns table (
  rank bigint,
  user_id uuid,
  username text,
  first_name text,
  last_name text,
  score_kg numeric,
  lift_count bigint,
  is_current_user boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with authorized_scope as (
    select case
      when scope_group_id is null then true
      else public.is_group_member(scope_group_id)
    end as allowed
  ),
  eligible_users as (
    select distinct memberships.user_id
    from public.group_memberships as memberships
    where (
      scope_group_id is not null
      and memberships.group_id = scope_group_id
    ) or (
      scope_group_id is null
      and memberships.group_id in (
        select mine.group_id
        from public.group_memberships as mine
        where mine.user_id = (select auth.uid())
      )
    )
    union
    select auth.uid()
    where scope_group_id is null
  ),
  personal_records as (
    select
      entries.user_id,
      entries.exercise_id,
      max(entries.weight_kg) as best_kg
    from public.lift_entries as entries
    inner join eligible_users on eligible_users.user_id = entries.user_id
    where selected_exercise_id is null
      or entries.exercise_id = selected_exercise_id
    group by entries.user_id, entries.exercise_id
  ),
  scores as (
    select
      eligible_users.user_id,
      coalesce(sum(personal_records.best_kg), 0) as score_kg,
      count(personal_records.exercise_id) as lift_count
    from eligible_users
    left join personal_records on personal_records.user_id = eligible_users.user_id
    group by eligible_users.user_id
  ),
  ranked as (
    select
      rank() over (order by scores.score_kg desc) as rank,
      scores.user_id,
      profiles.username,
      profiles.first_name,
      profiles.last_name,
      scores.score_kg,
      scores.lift_count
    from scores
    inner join public.profiles on profiles.id = scores.user_id
  )
  select
    ranked.rank,
    ranked.user_id,
    ranked.username,
    ranked.first_name,
    ranked.last_name,
    ranked.score_kg,
    ranked.lift_count,
    ranked.user_id = (select auth.uid()) as is_current_user
  from ranked
  cross join authorized_scope
  where authorized_scope.allowed
    and (select auth.uid()) is not null
  order by ranked.rank, ranked.username;
$$;

revoke all on function public.get_leaderboard(uuid, uuid) from public, anon;
grant execute on function public.get_leaderboard(uuid, uuid) to authenticated;
