-- WordSound — Row Level Security
-- Regra central: exercises e exercise_options NAO tem policy de leitura para aluno.
-- O gabarito (answer_key / is_correct) so e lido pelo servidor via service_role,
-- que ignora RLS. Assim a resposta nunca trafega para o navegador antes da correcao.

alter table public.profiles               enable row level security;
alter table public.courses                enable row level security;
alter table public.modules                enable row level security;
alter table public.lessons                enable row level security;
alter table public.lesson_blocks          enable row level security;
alter table public.media                  enable row level security;
alter table public.exercises              enable row level security;
alter table public.exercise_options       enable row level security;
alter table public.user_progress          enable row level security;
alter table public.user_exercise_attempts enable row level security;
alter table public.user_stats             enable row level security;
alter table public.achievements           enable row level security;
alter table public.user_achievements      enable row level security;
alter table public.app_settings           enable row level security;

-- ============================ profiles ============================
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select private.is_admin()));

-- o aluno atualiza o proprio perfil, mas nao consegue se promover a admin
create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and role = (select p.role from public.profiles p where p.id = (select auth.uid())));

create policy profiles_admin_all on public.profiles
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============================ conteudo publicado ============================
create policy courses_read on public.courses
  for select to authenticated using (status = 'published' or (select private.is_admin()));
create policy courses_admin on public.courses
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy modules_read on public.modules
  for select to authenticated using (
    (select private.is_admin())
    or (status = 'published' and exists (
          select 1 from public.courses c
          where c.id = modules.course_id and c.status = 'published'))
  );
create policy modules_admin on public.modules
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy lessons_read on public.lessons
  for select to authenticated using (
    (select private.is_admin())
    or (status = 'published' and exists (
          select 1 from public.modules m
          join public.courses c on c.id = m.course_id
          where m.id = lessons.module_id and m.status = 'published' and c.status = 'published'))
  );
create policy lessons_admin on public.lessons
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy lesson_blocks_read on public.lesson_blocks
  for select to authenticated using (
    (select private.is_admin())
    or exists (
      select 1 from public.lessons l
      join public.modules m on m.id = l.module_id
      join public.courses c on c.id = m.course_id
      where l.id = lesson_blocks.lesson_id
        and l.status = 'published' and m.status = 'published' and c.status = 'published')
  );
create policy lesson_blocks_admin on public.lesson_blocks
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy media_read on public.media
  for select to authenticated using (true);
create policy media_admin on public.media
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============================ exercicios: so admin ============================
-- Sem policy de select para aluno. RLS sem policy = nega tudo.
create policy exercises_admin on public.exercises
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy exercise_options_admin on public.exercise_options
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

-- ============================ dados do aluno ============================
create policy user_progress_own on public.user_progress
  for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy user_progress_admin_read on public.user_progress
  for select to authenticated using ((select private.is_admin()));

-- tentativas sao imutaveis: insert e select, sem update/delete
create policy attempts_insert_own on public.user_exercise_attempts
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy attempts_select_own on public.user_exercise_attempts
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy user_stats_own on public.user_stats
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy user_stats_update_own on public.user_stats
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy achievements_read on public.achievements
  for select to authenticated using (true);
create policy achievements_admin on public.achievements
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));

create policy user_achievements_own on public.user_achievements
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));

create policy app_settings_read on public.app_settings
  for select to authenticated using (true);
create policy app_settings_admin on public.app_settings
  for all to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
