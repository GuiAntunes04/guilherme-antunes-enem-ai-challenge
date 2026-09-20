alter table public.essays
  add column if not exists source text not null default 'redacao',
  add column if not exists motivators text[] not null default '{}',
  add column if not exists time_limit_seconds integer,
  add column if not exists elapsed_seconds integer,
  add column if not exists quiz_started_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists status text not null default 'draft';

alter table public.essays
  alter column content set default '',
  alter column content drop not null;

alter table public.essays
  drop constraint if exists essays_status_check;

alter table public.essays
  add constraint essays_status_check
  check (status in ('draft', 'evaluating', 'done'));

alter table public.essays
  drop constraint if exists essays_source_check;

alter table public.essays
  add constraint essays_source_check
  check (source in ('redacao', 'simulation'));

alter table public.simulation_attempts
  add column if not exists essay_id uuid references public.essays (id) on delete set null;

create policy "Users can update own essays"
  on public.essays for update
  using (auth.uid() = user_id);
