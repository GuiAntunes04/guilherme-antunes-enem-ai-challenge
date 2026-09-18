-- Migrate from enem.dev (question indices) to EnemHub (question UUIDs)

alter table public.simulation_attempts
  add column if not exists question_ids uuid[] not null default '{}';

alter table public.simulation_attempts
  drop column if exists question_indices;

alter table public.attempt_answers
  add column if not exists question_id uuid;

alter table public.attempt_answers
  drop column if exists question_index;

create index if not exists attempt_answers_question_id_idx
  on public.attempt_answers (question_id);
