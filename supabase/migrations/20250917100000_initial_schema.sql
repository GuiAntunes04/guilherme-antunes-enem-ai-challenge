-- Profiles (extends auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Simulation attempts (ENEM API questions)
create table public.simulation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_year integer not null,
  discipline text not null,
  score integer not null default 0,
  total integer not null default 0,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

create table public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.simulation_attempts (id) on delete cascade,
  question_index integer not null,
  selected_option text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now()
);

-- Essay corrector (Gemini)
create table public.essays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  theme text not null,
  content text not null,
  ai_feedback jsonb,
  created_at timestamptz not null default now()
);

-- AI Tutor chat
create table public.tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tutor_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.tutor_sessions (id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Indexes
create index simulation_attempts_user_id_idx on public.simulation_attempts (user_id);
create index attempt_answers_attempt_id_idx on public.attempt_answers (attempt_id);
create index essays_user_id_idx on public.essays (user_id);
create index tutor_sessions_user_id_idx on public.tutor_sessions (user_id);
create index tutor_messages_session_id_idx on public.tutor_messages (session_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger tutor_sessions_updated_at
  before update on public.tutor_sessions
  for each row execute function public.set_updated_at();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.simulation_attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.essays enable row level security;
alter table public.tutor_sessions enable row level security;
alter table public.tutor_messages enable row level security;

-- Profiles
create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Simulation attempts
create policy "Users can view own simulation attempts"
  on public.simulation_attempts for select
  using (auth.uid() = user_id);

create policy "Users can insert own simulation attempts"
  on public.simulation_attempts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own simulation attempts"
  on public.simulation_attempts for update
  using (auth.uid() = user_id);

-- Attempt answers (via attempt ownership)
create policy "Users can view own attempt answers"
  on public.attempt_answers for select
  using (
    exists (
      select 1 from public.simulation_attempts sa
      where sa.id = attempt_id and sa.user_id = auth.uid()
    )
  );

create policy "Users can insert own attempt answers"
  on public.attempt_answers for insert
  with check (
    exists (
      select 1 from public.simulation_attempts sa
      where sa.id = attempt_id and sa.user_id = auth.uid()
    )
  );

-- Essays
create policy "Users can view own essays"
  on public.essays for select
  using (auth.uid() = user_id);

create policy "Users can insert own essays"
  on public.essays for insert
  with check (auth.uid() = user_id);

-- Tutor sessions
create policy "Users can view own tutor sessions"
  on public.tutor_sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own tutor sessions"
  on public.tutor_sessions for insert
  with check (auth.uid() = user_id);

create policy "Users can update own tutor sessions"
  on public.tutor_sessions for update
  using (auth.uid() = user_id);

create policy "Users can delete own tutor sessions"
  on public.tutor_sessions for delete
  using (auth.uid() = user_id);

-- Tutor messages (via session ownership)
create policy "Users can view own tutor messages"
  on public.tutor_messages for select
  using (
    exists (
      select 1 from public.tutor_sessions ts
      where ts.id = session_id and ts.user_id = auth.uid()
    )
  );

create policy "Users can insert own tutor messages"
  on public.tutor_messages for insert
  with check (
    exists (
      select 1 from public.tutor_sessions ts
      where ts.id = session_id and ts.user_id = auth.uid()
    )
  );
