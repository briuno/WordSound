-- WordSound — Units 2 e 3 na estrutura do livro
--
-- Fecha o que a 0020 e a 0021 comecaram: agora o curso inteiro segue a forma
-- do Pioneer — a, b, c, Task, d, Review. Estas duas ficaram por ultimo porque,
-- ao contrario das 4 a 10, ja tem conteudo escrito, e mover conteudo pronto
-- pede mais cuidado do que renomear casca vazia.
--
-- Como nas anteriores, nada e reescrito: os blocos mudam de licao e de
-- posicao, com as tabelas e explicacoes intactas, e cada pergunta de listening
-- viaja junto com a faixa de que ela fala.
--
--   2a  arvore genealogica, have got, caso possessivo
--   2b  aparelhos e adjetivos             faixa: Lesson B act 5
--   2c  objetos pessoais, this/that, plurais
--   2   Task: o que tem na bolsa          faixa: Task A
--   2d  aparencia e descricao de pessoa   faixa: Lesson D act 2
--   2   Review
--
--   3a  dias, rotina, horas e leitura
--   3b  esportes e presente simples       faixa: Lesson B act 4
--   3c  perguntas com wh-
--   3   Task: pesquisa de tempo livre     faixa: Task A
--   3d  programas de TV e perfil          faixa: Lesson D act 2
--   3   Review
--
-- As cinco licoes da apostila da Unit 2 nao sao do livro do aluno: continuam
-- depois das seis, nas posicoes 7 a 11, na ordem em que a apostila as traz.
--
-- A licao de listening de cada unidade vira o Task, porque a faixa do Task ja
-- esta nela. As outras duas faixas saem para a licao do livro que as usa.

do $mig$
declare
  v_course bigint;
  v_module bigint;
  u        record;
  r        record;
  v_block  bigint;
  v_pos    int;
  alvo     bigint;
  origem   bigint;
  v_task   bigint;
begin
  select id into v_course from public.courses where slug = 'english-basics';
  if v_course is null then raise notice 'curso ausente'; return; end if;

  create temp table migrando (modulo int) on commit drop;
  create temp table alvos (modulo int, slot text, lesson_id bigint) on commit drop;

  -- Posicao negativa antes de qualquer coisa: e o que deixa renumerar sem duas
  -- licoes disputando a mesma casa no meio do caminho.
  for r in select * from (values (2), (3)) as t(modulo) loop
    select id into v_module from public.modules where course_id = v_course and position = r.modulo;
    if v_module is null then continue; end if;
    if exists (select 1 from public.lessons
               where module_id = v_module and title like r.modulo || 'a — %') then
      continue;
    end if;
    insert into migrando values (r.modulo);
    update public.lessons set position = -position where module_id = v_module and position > 0;
  end loop;

  if not exists (select 1 from migrando) then
    raise notice 'Units 2 e 3 ja estao na estrutura do livro';
    return;
  end if;

  -- ------------------------------------------------------- as seis licoes
  for u in
    select * from (values
      -- modulo, posicao antiga reaproveitada, slot, titulo, objetivo
      (2,  2, 'a',    '2a — Family',                  'Falar da familia e usar have got e o caso possessivo.'),
      (2,  8, 'b',    '2b — Gadgets',                 'Falar de aparelhos e opinar com adjetivos.'),
      (2,  1, 'c',    '2c — Personal items',          'Identificar objetos e usar this, that, these e those.'),
      (2,  9, 'task', '2 Task — What is in the bag',  'Ouvir uma revista de bagagem e identificar o que ela tem.'),
      (2,  7, 'd',    '2d — Appearance',              'Descrever a aparencia de uma pessoa.'),
      (2, 11, 'rev',  '2 Review',                     'Consolidar o modulo 2.'),

      (3,  1, 'a',    '3a — Days and time',           'Dizer os dias, as horas e falar da rotina.'),
      (3,  6, 'b',    '3b — Sports',                  'Falar de esportes e perguntar no presente simples.'),
      (3,  5, 'c',    '3c — Spare time',              'Perguntar com wh- sobre o tempo livre.'),
      (3,  9, 'task', '3 Task — A spare-time survey', 'Ouvir uma pesquisa de rua e completar o formulario.'),
      (3,  7, 'd',    '3d — TV programmes',           'Falar de programas de TV e escrever um perfil.'),
      (3, 11, 'rev',  '3 Review',                     'Consolidar o modulo 3.')
    ) as t(modulo, antiga, slot, titulo, objetivo)
  loop
    if not exists (select 1 from migrando where modulo = u.modulo) then continue; end if;
    select id into v_module from public.modules where course_id = v_course and position = u.modulo;
    select id into alvo from public.lessons where module_id = v_module and position = -u.antiga;
    if alvo is null then continue; end if;

    update public.lessons set
      title = u.titulo,
      objective = u.objetivo,
      status = 'published',
      position = case u.slot when 'a' then 1 when 'b' then 2 when 'c' then 3
                             when 'task' then 4 when 'd' then 5 else 6 end
    where id = alvo;

    insert into alvos values (u.modulo, u.slot, alvo);
  end loop;

  -- --------------------------------------------------------- move os blocos
  for r in
    select * from (values
      (2,  3, 'a'),  -- Have Got                -> 2a
      (2,  4, 'a'),  -- Possessive Case         -> 2a
      (2,  5, 'c'),  -- This / That / These     -> 2c
      (2,  6, 'c'),  -- Plurals                 -> 2c
      (2, 10, 'd'),  -- Writing                 -> 2d
      (3,  2, 'a'),  -- Daily Routine           -> 3a
      (3,  3, 'a'),  -- Telling the Time        -> 3a
      (3,  8, 'a'),  -- Reading                 -> 3a
      (3,  4, 'b'),  -- Present Simple          -> 3b
      (3, 10, 'd')   -- Writing                 -> 3d
    ) as t(modulo, antiga, slot)
    order by t.modulo, t.antiga
  loop
    select id into v_module from public.modules where course_id = v_course and position = r.modulo;
    select id into origem from public.lessons where module_id = v_module and position = -r.antiga;
    select lesson_id into alvo from alvos where modulo = r.modulo and slot = r.slot;
    if origem is null or alvo is null then continue; end if;

    select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = alvo;
    update public.lesson_blocks b set lesson_id = alvo, position = v_pos + b.position
    where b.lesson_id = origem;
  end loop;

  -- ------------------------------------------ desmonta a licao de listening
  for r in
    select * from (values
      (2, 'lesson-b-', 'b'), (2, 'lesson-d-', 'd'),
      (3, 'lesson-b-', 'b'), (3, 'lesson-d-', 'd')
    ) as t(modulo, marca, slot)
  loop
    select lesson_id into alvo   from alvos where modulo = r.modulo and slot = r.slot;
    select lesson_id into v_task from alvos where modulo = r.modulo and slot = 'task';
    if alvo is null or v_task is null then continue; end if;

    -- a faixa
    for v_block in
      select b.id from public.lesson_blocks b
      join public.media m on m.id = b.media_id
      where b.lesson_id = v_task and b.block_type = 'LISTENING'
        and m.storage_path like 'audio/%module-' || lpad(r.modulo::text, 2, '0') || '-' || r.marca || '%'
    loop
      select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = alvo;
      update public.lesson_blocks b set
        lesson_id = alvo,
        position  = v_pos + 1,
        title     = regexp_replace(
                      (select m.title from public.media m where m.id = b.media_id),
                      '^Pioneer · Module [0-9]+ ', '')
      where b.id = v_block;
    end loop;

    -- as perguntas daquela faixa, num bloco EXERCISE da nova licao
    select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = alvo;
    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (alvo, 'EXERCISE', 'Pratique', '{}'::jsonb, v_pos + 1)
    returning id into v_block;

    update public.exercises e set lesson_block_id = v_block
    from public.media m
    where m.id = e.media_id
      and m.storage_path like 'audio/%module-' || lpad(r.modulo::text, 2, '0') || '-' || r.marca || '%';

    -- faixa sem pergunta nao deve deixar bloco vazio para tras
    delete from public.lesson_blocks
    where id = v_block and not exists (select 1 from public.exercises where lesson_block_id = v_block);
  end loop;

  -- a faixa que fica no Task tambem passa a se chamar como o livro a chama
  for r in select modulo, lesson_id from alvos where slot = 'task' loop
    update public.lesson_blocks b set
      title = regexp_replace(
                (select m.title from public.media m where m.id = b.media_id),
                '^Pioneer · Module [0-9]+ ', '')
    from public.media m2
    where b.id = b.id and m2.id = b.media_id
      and b.lesson_id = r.lesson_id
      and b.block_type = 'LISTENING'
      and m2.storage_path like 'audio/%module-' || lpad(r.modulo::text, 2, '0') || '-task-%';
  end loop;

  -- a introducao generica nao vale mais: as faixas nao estao mais juntas
  delete from public.lesson_blocks b
  using alvos a
  where b.lesson_id = a.lesson_id and a.slot = 'task'
    and b.block_type = 'CONTENT' and b.title = 'Antes de ouvir';

  -- ---------------------------------------------- apostila depois do livro
  -- as antigas 12 a 16 (agora -12 a -16) viram 7 a 11, na mesma ordem
  update public.lessons set position = -position - 5
  where module_id = (select id from public.modules where course_id = v_course and position = 2)
    and position between -16 and -12
    and exists (select 1 from migrando where modulo = 2);

  -- ------------------------------------------------ fora as licoes por tema
  delete from public.lessons les
  using public.modules m
  where les.module_id = m.id and m.course_id = v_course
    and m.position in (2, 3) and les.position < 0
    and exists (select 1 from migrando g where g.modulo = m.position);

  -- --------------------------------------------------- renumera os blocos
  for r in
    select l.id from public.lessons l join public.modules m on m.id = l.module_id
    where m.course_id = v_course and m.position in (2, 3)
  loop
    v_pos := 0;
    for v_block in select id from public.lesson_blocks where lesson_id = r.id order by position, id loop
      v_pos := v_pos + 1;
      update public.lesson_blocks set position = v_pos where id = v_block;
    end loop;
  end loop;

  raise notice 'Units 2 e 3 remontadas na estrutura do livro';
end;
$mig$;
