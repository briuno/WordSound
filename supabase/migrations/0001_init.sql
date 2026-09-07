-- WordSound — schema inicial
-- Convencoes: identificadores minusculos, PK bigint identity (uuid quando ligado a auth.users),
-- todo FK indexado, RLS ligado em todas as tabelas, auth.uid() sempre dentro de (select ...).

create schema if not exists private;

-- ============================ tipos ============================
create type public.user_role       as enum ('student','admin');
create type public.content_status  as enum ('draft','published','archived');
create type public.block_type      as enum ('CONTENT','VOCABULARY','GRAMMAR','READING','LISTENING','EXERCISE','AI_REVIEW');
create type public.progress_status as enum ('locked','unlocked','in_progress','completed');
create type public.media_kind      as enum ('audio','image');

-- ============================ helpers ============================
create or replace function private.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $fn$
begin new.updated_at = now(); return new; end $fn$;

grant usage on schema private to authenticated;

-- ============================ profiles ============================
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  avatar_url text,
  role       public.user_role not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_touch before update on public.profiles
  for each row execute function private.touch_updated_at();

-- Definida depois de profiles porque o corpo referencia a tabela.
-- Precisa de execute para authenticated: policies rodam com os privilegios de quem consulta.
create or replace function private.is_admin()
returns boolean language sql stable security definer set search_path = '' as $fn$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$fn$;
grant execute on function private.is_admin() to authenticated;

-- ============================ conteudo ============================
create table public.courses (
  id          bigint generated always as identity primary key,
  slug        text not null unique,
  title       text not null,
  description text,
  level       text,
  status      public.content_status not null default 'draft',
  position    int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger courses_touch before update on public.courses
  for each row execute function private.touch_updated_at();

create table public.modules (
  id          bigint generated always as identity primary key,
  course_id   bigint not null references public.courses(id) on delete cascade,
  title       text not null,
  description text,
  position    int not null default 0,
  status      public.content_status not null default 'draft',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index modules_course_id_idx on public.modules (course_id, position);
create trigger modules_touch before update on public.modules
  for each row execute function private.touch_updated_at();

create table public.lessons (
  id                bigint generated always as identity primary key,
  module_id         bigint not null references public.modules(id) on delete cascade,
  title             text not null,
  description       text,
  objective         text,
  estimated_minutes int  not null default 10 check (estimated_minutes > 0),
  xp_reward         int  not null default 50 check (xp_reward >= 0),
  position          int  not null default 0,
  status            public.content_status not null default 'draft',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index lessons_module_id_idx on public.lessons (module_id, position);
create trigger lessons_touch before update on public.lessons
  for each row execute function private.touch_updated_at();

create table public.media (
  id               bigint generated always as identity primary key,
  kind             public.media_kind not null,
  title            text not null,
  storage_path     text not null,
  mime_type        text,
  duration_seconds numeric(8,2),
  size_bytes       bigint,
  transcript       text,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index media_created_by_idx on public.media (created_by);
create index media_kind_idx on public.media (kind);
create trigger media_touch before update on public.media
  for each row execute function private.touch_updated_at();

create table public.lesson_blocks (
  id         bigint generated always as identity primary key,
  lesson_id  bigint not null references public.lessons(id) on delete cascade,
  block_type public.block_type not null,
  title      text,
  content    jsonb not null default '{}'::jsonb,
  metadata   jsonb not null default '{}'::jsonb,
  media_id   bigint references public.media(id) on delete set null,
  position   int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index lesson_blocks_lesson_id_idx on public.lesson_blocks (lesson_id, position);
create index lesson_blocks_media_id_idx  on public.lesson_blocks (media_id);
create trigger lesson_blocks_touch before update on public.lesson_blocks
  for each row execute function private.touch_updated_at();

-- exercise_type e text + check para permitir novos tipos com uma linha de migration
create table public.exercises (
  id              bigint generated always as identity primary key,
  lesson_block_id bigint not null references public.lesson_blocks(id) on delete cascade,
  exercise_type   text not null check (exercise_type in (
                    'MULTIPLE_CHOICE','TRUE_FALSE','FILL_BLANK','SHORT_ANSWER',
                    'ORDER_WORDS','ORDER_SENTENCES','MATCHING','CHOICE_INLINE',
                    'LISTENING_MULTIPLE_CHOICE','LISTENING_FILL_BLANK','READING_QUESTION',
                    'CATEGORY_SORT','FORM_FILL','CORRECT_SENTENCE')),
  instruction     text,
  question        text not null,
  explanation     text,
  difficulty      smallint not null default 1 check (difficulty between 1 and 5),
  xp_reward       int not null default 10 check (xp_reward >= 0),
  position        int not null default 0,
  prompt          jsonb not null default '{}'::jsonb,
  answer_key      jsonb not null default '{}'::jsonb,
  media_id        bigint references public.media(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index exercises_block_idx    on public.exercises (lesson_block_id, position);
create index exercises_media_id_idx on public.exercises (media_id);
create trigger exercises_touch before update on public.exercises
  for each row execute function private.touch_updated_at();

create table public.exercise_options (
  id          bigint generated always as identity primary key,
  exercise_id bigint not null references public.exercises(id) on delete cascade,
  text        text not null,
  is_correct  boolean not null default false,
  position    int not null default 0
);
create index exercise_options_exercise_idx on public.exercise_options (exercise_id, position);

-- ============================ progresso do aluno ============================
create table public.user_progress (
  id               bigint generated always as identity primary key,
  user_id          uuid   not null references auth.users(id) on delete cascade,
  lesson_id        bigint not null references public.lessons(id) on delete cascade,
  status           public.progress_status not null default 'locked',
  progress_percent smallint not null default 0 check (progress_percent between 0 and 100),
  accuracy         numeric(5,2),
  started_at       timestamptz,
  completed_at     timestamptz,
  updated_at       timestamptz not null default now(),
  unique (user_id, lesson_id)
);
create index user_progress_user_idx   on public.user_progress (user_id, status);
create index user_progress_lesson_idx on public.user_progress (lesson_id);
create trigger user_progress_touch before update on public.user_progress
  for each row execute function private.touch_updated_at();

create table public.user_exercise_attempts (
  id             bigint generated always as identity primary key,
  user_id        uuid   not null references auth.users(id) on delete cascade,
  exercise_id    bigint not null references public.exercises(id) on delete cascade,
  lesson_id      bigint not null references public.lessons(id) on delete cascade,
  answer         jsonb  not null,
  is_correct     boolean not null,
  attempt_number int not null default 1 check (attempt_number > 0),
  xp_earned      int not null default 0,
  created_at     timestamptz not null default now()
);
create index attempts_user_lesson_idx on public.user_exercise_attempts (user_id, lesson_id);
create index attempts_exercise_idx    on public.user_exercise_attempts (exercise_id);
create index attempts_wrong_idx       on public.user_exercise_attempts (user_id, created_at desc) where is_correct = false;

create table public.user_stats (
  user_id             uuid primary key references auth.users(id) on delete cascade,
  xp_total            int  not null default 0,
  current_streak      int  not null default 0,
  best_streak         int  not null default 0,
  last_study_date     date,
  total_study_minutes int  not null default 0,
  updated_at          timestamptz not null default now()
);
create trigger user_stats_touch before update on public.user_stats
  for each row execute function private.touch_updated_at();

create table public.achievements (
  code        text primary key,
  title       text not null,
  description text,
  icon        text,
  kind        text not null check (kind in ('lessons','streak','exercises','modules','xp')),
  threshold   int  not null default 1,
  position    int  not null default 0
);

create table public.user_achievements (
  user_id          uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievements(code) on delete cascade,
  earned_at        timestamptz not null default now(),
  primary key (user_id, achievement_code)
);
create index user_achievements_code_idx on public.user_achievements (achievement_code);

-- valores de XP configuraveis (spec 34)
create table public.app_settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);
create trigger app_settings_touch before update on public.app_settings
  for each row execute function private.touch_updated_at();

-- ============================ novo usuario ============================
create or replace function private.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $fn$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing;
  insert into public.user_stats (user_id) values (new.id) on conflict (user_id) do nothing;
  return new;
end $fn$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- ============================ XP + streak atomico ============================
create or replace function public.record_study_activity(p_xp int default 0)
returns public.user_stats language plpgsql security definer set search_path = '' as $fn$
declare
  v_user  uuid := (select auth.uid());
  v_today date := (now() at time zone 'utc')::date;
  r public.user_stats;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;
  update public.user_stats set
    xp_total        = xp_total + greatest(coalesce(p_xp, 0), 0),
    current_streak  = case
                        when last_study_date = v_today     then current_streak
                        when last_study_date = v_today - 1 then current_streak + 1
                        else 1
                      end,
    last_study_date = v_today
  where user_id = v_user;
  update public.user_stats set best_streak = greatest(best_streak, current_streak)
  where user_id = v_user returning * into r;
  return r;
end $fn$;
grant execute on function public.record_study_activity(int) to authenticated;
