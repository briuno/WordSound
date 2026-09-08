-- WordSound — fecha duas lacunas da fase 1
--
-- 1. As conquistas eram cadastradas e exibidas, mas nunca concedidas: a tela
--    de Perfil mostrava as seis permanentemente apagadas.
-- 2. total_study_minutes nunca era incrementado, entao Progresso mostrava
--    sempre "0 min".

-- ---------------------------------------------------------------------------
-- tempo de estudo entra na mesma funcao atomica do XP e do streak
-- ---------------------------------------------------------------------------
drop function if exists public.record_study_activity(int);

create or replace function public.record_study_activity(p_xp int default 0, p_minutes int default 0)
returns public.user_stats language plpgsql security definer set search_path = '' as $fn$
declare
  v_user  uuid := (select auth.uid());
  v_today date := (now() at time zone 'utc')::date;
  r public.user_stats;
begin
  if v_user is null then raise exception 'not authenticated'; end if;
  insert into public.user_stats (user_id) values (v_user) on conflict (user_id) do nothing;
  update public.user_stats set
    xp_total            = xp_total + greatest(coalesce(p_xp, 0), 0),
    -- teto de 120 min por registro: uma aba esquecida aberta a noite toda nao
    -- pode virar tempo de estudo
    total_study_minutes = total_study_minutes + least(greatest(coalesce(p_minutes, 0), 0), 120),
    current_streak      = case
                            when last_study_date = v_today     then current_streak
                            when last_study_date = v_today - 1 then current_streak + 1
                            else 1
                          end,
    last_study_date     = v_today
  where user_id = v_user;
  update public.user_stats set best_streak = greatest(best_streak, current_streak)
  where user_id = v_user returning * into r;
  return r;
end $fn$;
grant execute on function public.record_study_activity(int, int) to authenticated;

-- ---------------------------------------------------------------------------
-- concessao de conquistas
--
-- Roda depois de concluir uma licao e concede tudo que ja foi merecido, nao so
-- o que acabou de ser atingido. Assim conquistas criadas depois pelo admin sao
-- concedidas retroativamente, sem migracao de dados.
-- ---------------------------------------------------------------------------
create or replace function public.award_achievements()
returns table (code text, title text)
language plpgsql security definer set search_path = '' as $fn$
declare
  v_user uuid := (select auth.uid());
begin
  if v_user is null then return; end if;

  return query
  with earned as (
    insert into public.user_achievements (user_id, achievement_code)
    select v_user, a.code
    from public.achievements a
    where not exists (
            select 1 from public.user_achievements ua
            where ua.user_id = v_user and ua.achievement_code = a.code)
      and case a.kind
        when 'lessons' then
          (select count(*) from public.user_progress p
           where p.user_id = v_user and p.status = 'completed') >= a.threshold
        when 'exercises' then
          (select count(distinct t.exercise_id) from public.user_exercise_attempts t
           where t.user_id = v_user) >= a.threshold
        when 'streak' then
          coalesce((select s.current_streak from public.user_stats s where s.user_id = v_user), 0) >= a.threshold
        when 'xp' then
          coalesce((select s.xp_total from public.user_stats s where s.user_id = v_user), 0) >= a.threshold
        when 'modules' then
          -- existe algum modulo publicado, com licoes, cujas licoes o aluno concluiu todas
          exists (
            select 1
            from public.modules m
            where m.status = 'published'
              and exists (select 1 from public.lessons l
                          where l.module_id = m.id and l.status = 'published')
              and not exists (
                select 1 from public.lessons l
                where l.module_id = m.id and l.status = 'published'
                  and not exists (
                    select 1 from public.user_progress p
                    where p.user_id = v_user and p.lesson_id = l.id and p.status = 'completed')))
        else false
      end
    returning achievement_code
  )
  select e.achievement_code, a.title
  from earned e
  join public.achievements a on a.code = e.achievement_code;
end $fn$;
grant execute on function public.award_achievements() to authenticated;
