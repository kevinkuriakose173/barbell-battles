create or replace function public.join_group(group_join_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_group_id uuid;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  select id into matched_group_id
  from public.groups
  where join_code = upper(trim(group_join_code));

  if matched_group_id is null then
    raise exception 'No group was found with that join code.';
  end if;

  if exists (
    select 1
    from public.group_memberships
    where group_id = matched_group_id
      and user_id = current_user_id
  ) then
    raise exception 'You have already joined this group.';
  end if;

  insert into public.group_memberships (group_id, user_id, role)
  values (matched_group_id, current_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  if not found then
    raise exception 'You have already joined this group.';
  end if;

  return matched_group_id;
end;
$$;
