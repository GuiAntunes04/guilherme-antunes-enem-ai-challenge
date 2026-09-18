-- Lightweight index of EnemHub questions (metadata only; full content fetched on demand)

create table public.enem_questions_index (
  id uuid primary key,
  year integer not null,
  subject_id uuid,
  subject_name text,
  subject_area text,
  difficulty text,
  synced_at timestamptz not null default now()
);

create index enem_questions_index_year_idx
  on public.enem_questions_index (year);

create index enem_questions_index_subject_id_idx
  on public.enem_questions_index (subject_id);

create index enem_questions_index_subject_area_idx
  on public.enem_questions_index (subject_area);

create index enem_questions_index_year_area_idx
  on public.enem_questions_index (year, subject_area);

create index enem_questions_index_year_subject_idx
  on public.enem_questions_index (year, subject_id);

alter table public.enem_questions_index enable row level security;
