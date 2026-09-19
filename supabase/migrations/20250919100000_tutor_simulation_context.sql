alter table public.tutor_sessions
  add column if not exists simulation_attempt_id uuid references public.simulation_attempts (id) on delete cascade,
  add column if not exists question_id uuid;

create unique index if not exists tutor_sessions_attempt_question_uidx
  on public.tutor_sessions (user_id, simulation_attempt_id, question_id)
  where simulation_attempt_id is not null and question_id is not null;
