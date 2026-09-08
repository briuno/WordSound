-- WordSound — WordSound Insight
--
-- Guarda a explicacao gerada e a pergunta de reforco. A resposta correta da
-- pergunta nova fica aqui e NAO tem policy de leitura para aluno, pela mesma
-- razao de exercises: mostrar a alternativa certa antes de responder anularia
-- o exercicio (spec 25).

create table public.ai_insights (
  id                  bigint generated always as identity primary key,
  user_id             uuid   not null references auth.users(id) on delete cascade,
  exercise_id         bigint not null references public.exercises(id) on delete cascade,
  student_answer      jsonb  not null,
  explanation         text   not null,
  rule                text,
  example             text,
  retry_question      text,
  retry_options       jsonb  not null default '[]'::jsonb,
  retry_correct_index int,                                   -- NUNCA vai ao cliente
  retry_answered_at   timestamptz,
  retry_was_correct   boolean,
  provider            text   not null,
  model               text,
  created_at          timestamptz not null default now()
);

create index ai_insights_user_exercise_idx on public.ai_insights (user_id, exercise_id, created_at desc);
create index ai_insights_exercise_idx      on public.ai_insights (exercise_id);

alter table public.ai_insights enable row level security;

-- Sem policy de select para aluno: a leitura passa pelo servidor, que devolve
-- o insight ja sem o gabarito da pergunta de reforco.
create policy ai_insights_admin on public.ai_insights
  for all to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
