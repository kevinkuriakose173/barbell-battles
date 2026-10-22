create function public.handle_auth_user_deletion()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owned_group record;
  replacement_user_id uuid;
begin
  for owned_group in
    select id
    from public.groups
    where owner_id = old.id
    order by created_at, id
  loop
    replacement_user_id := null;

    select membership.user_id
    into replacement_user_id
    from public.group_memberships as membership
    where membership.group_id = owned_group.id
      and membership.user_id <> old.id
    order by membership.joined_at, membership.id
    limit 1;

    if replacement_user_id is null then
      delete from public.groups
      where id = owned_group.id;
    else
      update public.group_memberships
      set role = 'owner'
      where group_id = owned_group.id
        and user_id = replacement_user_id;

      update public.groups
      set owner_id = replacement_user_id
      where id = owned_group.id;
    end if;
  end loop;

  return old;
end;
$$;

revoke all on function public.handle_auth_user_deletion() from public, anon, authenticated;

create trigger prepare_account_deletion
before delete on auth.users
for each row
execute function public.handle_auth_user_deletion();
