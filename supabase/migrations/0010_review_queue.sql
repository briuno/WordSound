-- WordSound — fila de revisao (spec 37)
--
-- Um exercicio entra na fila quando a ULTIMA tentativa do aluno foi errada.
-- Acertar em revisao tira o exercicio da lista, o que da um objetivo claro e
-- evita revisar para sempre o que ja foi aprendido.
--
-- A consulta vive no banco, e nao no TypeScript, porque encontrar a ultima
-- tentativa de cada exercicio exige distinct on: fazer isso na aplicacao
-- obrigaria a trazer o historico inteiro de tentativas para a memoria.

create or replace function public.get_review_queue()
returns table (
  exercise_id     bigint,
  lesson_id       bigint,
  wrong_count     int,
  attempt_count   int,
  last_attempt_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $fn$
  with mine as (
    select a.exercise_id, a.lesson_id, a.is_correct, a.created_at
    from public.user_exercise_attempts a
    where a.user_id = (select auth.uid())
  ),
  latest as (
    select distinct on (m.exercise_id) m.exercise_id, m.lesson_id, m.is_correct, m.created_at
    from mine m
    order by m.exercise_id, m.created_at desc
  ),
  tally as (
    select m.exercise_id,
           count(*) filter (where not m.is_correct)::int as wrong_count,
           count(*)::int as attempt_count
    from mine m
    group by m.exercise_id
  )
  select l.exercise_id, l.lesson_id, t.wrong_count, t.attempt_count, l.created_at
  from latest l
  join tally t on t.exercise_id = l.exercise_id
  where not l.is_correct
  -- quem errou mais vem primeiro; empate desempata pelo erro mais antigo,
  -- para nada ficar esquecido no fim da fila
  order by t.wrong_count desc, l.created_at asc;
$fn$;

grant execute on function public.get_review_queue() to authenticated;
