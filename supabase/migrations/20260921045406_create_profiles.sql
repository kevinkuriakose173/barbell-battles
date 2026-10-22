create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  username text not null,
  preferred_unit text not null default 'lb',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_first_name_length
    check (char_length(trim(first_name)) between 1 and 50),

  constraint profiles_last_name_length
    check (char_length(trim(last_name)) between 1 and 50),

  constraint profiles_username_format
    check (username ~ '^[a-z0-9_]{3,24}$'),

  constraint profiles_preferred_unit
    check (preferred_unit in ('lb', 'kg'))
);

create unique index profiles_username_unique
  on public.profiles (lower(username));

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

alter table public.profiles enable row level security;

revoke all on table public.profiles from anon;
revoke all on table public.profiles from authenticated;

grant select on table public.profiles to authenticated;

grant insert (
  id,
  first_name,
  last_name,
  username,
  preferred_unit
) on table public.profiles to authenticated;

grant update (
  first_name,
  last_name,
  username,
  preferred_unit
) on table public.profiles to authenticated;

create policy "Users can view their own profile"
on public.profiles
for select
to authenticated
using (
  id = (select auth.uid())
);

create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (
  id = (select auth.uid())
);

create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (
  id = (select auth.uid())
)
with check (
  id = (select auth.uid())
);