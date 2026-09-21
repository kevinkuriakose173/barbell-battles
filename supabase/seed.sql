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
