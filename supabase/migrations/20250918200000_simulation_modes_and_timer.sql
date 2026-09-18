alter table public.simulation_attempts
  add column if not exists mode text not null default 'subject_practice',
  add column if not exists years_used integer[] not null default '{}',
  add column if not exists subject_id uuid,
  add column if not exists time_limit_seconds integer,
  add column if not exists elapsed_seconds integer;

alter table public.simulation_attempts
  alter column exam_year drop not null;
