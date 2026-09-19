alter table public.simulation_attempts
  add column if not exists quiz_started_at timestamptz;
