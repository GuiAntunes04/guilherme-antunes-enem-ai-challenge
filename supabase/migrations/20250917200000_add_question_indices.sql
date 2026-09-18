alter table public.simulation_attempts
  add column if not exists question_indices integer[] not null default '{}';
