create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug)),
  name text not null unique,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.lift_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id) on delete restrict,
  weight_kg numeric(7, 3) not null check (weight_kg > 0 and weight_kg <= 1000),
  performed_at date not null default current_date,
  notes text check (notes is null or char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lift_entries_user_exercise_index
  on public.lift_entries (user_id, exercise_id, performed_at desc);

create trigger set_lift_entries_updated_at
before update on public.lift_entries
for each row execute function public.set_updated_at();

alter table public.exercises enable row level security;
alter table public.lift_entries enable row level security;

create policy "Authenticated users can view exercises"
on public.exercises for select
to authenticated
using (true);

create policy "Users can view their own lift entries"
on public.lift_entries for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own lift entries"
on public.lift_entries for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own lift entries"
on public.lift_entries for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own lift entries"
on public.lift_entries for delete
to authenticated
using ((select auth.uid()) = user_id);

revoke all on public.exercises from anon, authenticated;
revoke all on public.lift_entries from anon, authenticated;
grant select on public.exercises to authenticated;
grant select, insert, update, delete on public.lift_entries to authenticated;

insert into public.exercises (id, slug, name, sort_order)
values
  ('10000000-0000-4000-8000-000000000001', 'bench-press', 'Bench Press', 1),
  ('10000000-0000-4000-8000-000000000002', 'squat', 'Squat', 2),
  ('10000000-0000-4000-8000-000000000003', 'deadlift', 'Deadlift', 3),
  ('10000000-0000-4000-8000-000000000004', 'overhead-press', 'Overhead Press', 4),
  ('10000000-0000-4000-8000-000000000005', 'barbell-row', 'Barbell Row', 5)
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  sort_order = excluded.sort_order;
