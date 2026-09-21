create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 60),
  join_code text not null unique check (join_code ~ '^[A-Z0-9]{8}$'),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  unique (group_id, user_id)
);

create index group_memberships_user_id_index on public.group_memberships (user_id);
create index group_memberships_group_id_index on public.group_memberships (group_id);

create trigger groups_set_updated_at
before update on public.groups
for each row execute function public.set_updated_at();

create function public.is_group_member(requested_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_memberships
    where group_id = requested_group_id
      and user_id = (select auth.uid())
  );
$$;

create function public.is_group_owner(requested_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.groups
    where id = requested_group_id
      and owner_id = (select auth.uid())
  );
$$;

alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;

create policy "Members can view their groups"
on public.groups for select to authenticated
using (public.is_group_member(id));

create policy "Owners can update their groups"
on public.groups for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));

create policy "Owners can delete their groups"
on public.groups for delete to authenticated
using (owner_id = (select auth.uid()));

create policy "Members can view group memberships"
on public.group_memberships for select to authenticated
using (public.is_group_member(group_id));

create policy "Members can leave and owners can remove members"
on public.group_memberships for delete to authenticated
using (
  (user_id = (select auth.uid()) and role = 'member')
  or (public.is_group_owner(group_id) and role = 'member')
);

revoke all on public.groups from anon, authenticated;
revoke all on public.group_memberships from anon, authenticated;
grant select, update, delete on public.groups to authenticated;
grant select, delete on public.group_memberships to authenticated;

create function public.create_group(group_name text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  new_group_id uuid;
  new_join_code text;
  current_user_id uuid := (select auth.uid());
begin
  if current_user_id is null then
    raise exception 'You must be signed in.';
  end if;

  if char_length(trim(group_name)) not between 2 and 60 then
    raise exception 'Group names must be between 2 and 60 characters.';
  end if;

  loop
    new_join_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.groups where join_code = new_join_code);
  end loop;

  insert into public.groups (name, join_code, owner_id)
  values (trim(group_name), new_join_code, current_user_id)
  returning id into new_group_id;

  insert into public.group_memberships (group_id, user_id, role)
  values (new_group_id, current_user_id, 'owner');

  return new_group_id;
end;
$$;

create function public.join_group(group_join_code text)
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

  insert into public.group_memberships (group_id, user_id, role)
  values (matched_group_id, current_user_id, 'member')
  on conflict (group_id, user_id) do nothing;

  return matched_group_id;
end;
$$;

revoke all on function public.is_group_member(uuid) from public, anon;
revoke all on function public.is_group_owner(uuid) from public, anon;
revoke all on function public.create_group(text) from public, anon;
revoke all on function public.join_group(text) from public, anon;
grant execute on function public.is_group_member(uuid) to authenticated;
grant execute on function public.is_group_owner(uuid) to authenticated;
grant execute on function public.create_group(text) to authenticated;
grant execute on function public.join_group(text) to authenticated;
