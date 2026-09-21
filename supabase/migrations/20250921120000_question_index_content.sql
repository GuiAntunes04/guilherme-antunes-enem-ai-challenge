-- Full question payload for quiz/tutor without runtime EnemHub fetches

alter table public.enem_questions_index
  add column if not exists content jsonb;
