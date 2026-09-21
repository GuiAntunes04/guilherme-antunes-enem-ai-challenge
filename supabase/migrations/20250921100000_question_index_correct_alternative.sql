alter table public.enem_questions_index
  add column if not exists correct_alternative text;

alter table public.tutor_sessions
  add column if not exists question_context text;
