-- WordSound — Unit 1 na estrutura do livro
--
-- O Pioneer organiza cada modulo em 1a, 1b, 1c, Task, 1d e Review. Reading,
-- Listening, Speaking e Writing nao sao licoes: sao colunas de habilidade do
-- indice, distribuidas dentro dessas paginas. A Unit 1 do app tinha virado 12
-- licoes por tema, com Reading/Listening/Writing/Review no fim, e por isso as
-- quatro faixas do modulo acabaram todas empilhadas numa unica licao de
-- listening — longe da atividade em que o livro as usa.
--
-- Aqui a unidade volta a forma do livro. Nada de conteudo e reescrito: os
-- blocos existentes mudam de licao e de posicao, e as perguntas de listening
-- vao junto com a faixa de que elas falam.
--
--   1a  Hello there!              greetings, conversational English   audio: Lesson A act 5
--   1b  Teacher trouble           reading, jobs, to be, possessives
--   1c  Numbers & details         numbers 0-100, endereco, telefone, email
--   1   Task: Business card       fazer um cartao de visita           audio: Task B
--   1d  Countries & nationalities paises, formulario, maiusculas      audio: Lesson D act 2 B e C
--   1   Review
--
-- Seis linhas de licao sao reaproveitadas e renomeadas, as outras seis somem
-- depois que os blocos delas saem. Isso apaga o user_progress das seis que
-- somem, que hoje e so da conta de teste.

do $mig$
declare
  v_module bigint;
  v_1a bigint; v_1b bigint; v_1c bigint; v_task bigint; v_1d bigint; v_rev bigint;
  v_block bigint;
  m_a bigint; m_task bigint; m_d1 bigint; m_d2 bigint;
  v_pos int;
  r record;
begin
  select m.id into v_module
  from public.modules m
  join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and m.position = 1;
  if v_module is null then raise notice 'unidade 1 ausente'; return; end if;

  -- ja migrado?
  if exists (select 1 from public.lessons where module_id = v_module and title like '1a %') then
    raise notice 'Unit 1 ja esta na estrutura do livro';
    return;
  end if;

  select id into m_a    from public.media where storage_path = 'audio/002-module-01-lesson-a-act-5-listening-a.mp3';
  select id into m_task from public.media where storage_path = 'audio/004-module-01-task-b.mp3';
  select id into m_d1   from public.media where storage_path = 'audio/005-module-01-lesson-d-act-2-speaking-listening-b.mp3';
  select id into m_d2   from public.media where storage_path = 'audio/006-module-01-lesson-d-act-2-speaking-listening-c.mp3';

  -- ------------------------------------------------------------------ alvos
  -- Reaproveita a linha cujo conteudo ja e o nucleo da pagina do livro, para
  -- nao perder o progresso de quem ja passou por ela.
  select id into v_1a   from public.lessons where module_id = v_module and position = 2;  -- Greetings
  select id into v_1b   from public.lessons where module_id = v_module and position = 9;  -- Reading
  select id into v_1c   from public.lessons where module_id = v_module and position = 6;  -- Numbers
  select id into v_task from public.lessons where module_id = v_module and position = 10; -- Listening
  select id into v_1d   from public.lessons where module_id = v_module and position = 5;  -- Countries
  select id into v_rev  from public.lessons where module_id = v_module and position = 12; -- Unit Review

  -- Posicao negativa primeiro: a unique (module_id, position) impede que duas
  -- licoes ocupem a mesma casa no meio da renumeracao.
  update public.lessons set position = -position where module_id = v_module;

  update public.lessons set
    title = '1a — Hello there!',
    objective = 'Cumprimentar, se despedir e se apresentar.',
    estimated_minutes = 12, position = 1, status = 'published'
  where id = v_1a;

  update public.lessons set
    title = '1b — Teacher trouble',
    objective = 'Falar de profissoes e usar o verbo to be.',
    estimated_minutes = 15, position = 2, status = 'published'
  where id = v_1b;

  update public.lessons set
    title = '1c — Numbers and details',
    objective = 'Dizer numeros, telefone, endereco e email.',
    estimated_minutes = 15, position = 3, status = 'published'
  where id = v_1c;

  update public.lessons set
    title = '1 Task — Business card',
    objective = 'Reunir os dados de um cartao de visita.',
    estimated_minutes = 10, position = 4, status = 'published'
  where id = v_task;

  update public.lessons set
    title = '1d — Countries and nationalities',
    objective = 'Dizer de onde voce e e preencher um formulario.',
    estimated_minutes = 15, position = 5, status = 'published'
  where id = v_1d;

  update public.lessons set
    title = '1 Review',
    objective = 'Consolidar o modulo 1.',
    estimated_minutes = 15, position = 6, status = 'published'
  where id = v_rev;

  -- ---------------------------------------------------------- move os blocos
  -- Cada par abaixo e "licao de origem (posicao antiga) -> licao de destino".
  -- Os blocos entram no fim do destino, preservando a ordem que tinham.
  for r in
    select * from (values
      (1,  'a'),  -- Classroom Language      -> 1a (conversational English)
      (4,  'b'),  -- Jobs & Occupations      -> 1b
      (7,  'b'),  -- Verb To Be              -> 1b
      (8,  'b'),  -- Possessive Adjectives   -> 1b
      (3,  'c'),  -- Personal Information    -> 1c
      (11, 'd')   -- Writing                 -> 1d
    ) as t(origem, destino)
  loop
    declare
      v_from bigint;
      v_to   bigint;
    begin
      select id into v_from from public.lessons where module_id = v_module and position = -r.origem;
      v_to := case r.destino when 'a' then v_1a when 'b' then v_1b when 'c' then v_1c else v_1d end;
      if v_from is null then continue; end if;

      select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = v_to;
      update public.lesson_blocks b set lesson_id = v_to, position = v_pos + b.position
      where b.lesson_id = v_from;
    end;
  end loop;

  -- ------------------------------------------- desmonta a licao de listening
  -- Os quatro blocos LISTENING e as perguntas deles saem para a licao em que o
  -- livro usa cada faixa. O que sobra em v_task e a faixa da Task.
  delete from public.lesson_blocks
  where lesson_id = v_task and block_type = 'CONTENT' and title = 'Antes de ouvir';

  -- Track 1 (Lesson A act 5) -> 1a
  select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = v_1a;
  update public.lesson_blocks set lesson_id = v_1a, position = v_pos + 1, title = 'Listening — act 5'
  where lesson_id = v_task and media_id = m_a;

  -- Track 3 e 4 (Lesson D act 2) -> 1d
  select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = v_1d;
  update public.lesson_blocks set lesson_id = v_1d, position = v_pos + 1, title = 'Listening — act 2 (B)'
  where lesson_id = v_task and media_id = m_d1;
  update public.lesson_blocks set lesson_id = v_1d, position = v_pos + 2, title = 'Listening — act 2 (C)'
  where lesson_id = v_task and media_id = m_d2;

  update public.lesson_blocks set title = 'Listening — Task B'
  where lesson_id = v_task and media_id = m_task;

  -- As perguntas moram todas no bloco 'Pratique' da antiga licao de listening.
  -- Cada grupo precisa de um bloco EXERCISE na licao de destino, senao a
  -- pergunta fica presa na licao errada.
  select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = v_1a;
  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_1a, 'EXERCISE', 'Pratique', '{}'::jsonb, v_pos + 1) returning id into v_block;
  update public.exercises set lesson_block_id = v_block where media_id = m_a;

  select coalesce(max(position), 0) into v_pos from public.lesson_blocks where lesson_id = v_1d;
  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_1d, 'EXERCISE', 'Pratique', '{}'::jsonb, v_pos + 1) returning id into v_block;
  update public.exercises set lesson_block_id = v_block where media_id in (m_d1, m_d2);

  -- ------------------------------------------------- fecha as licoes vazias
  delete from public.lessons where module_id = v_module and position < 0;

  -- renumera os blocos de cada licao, para nao ficar buraco na ordem
  for r in select id from public.lessons where module_id = v_module loop
    v_pos := 0;
    for v_block in select id from public.lesson_blocks where lesson_id = r.id order by position, id loop
      v_pos := v_pos + 1;
      update public.lesson_blocks set position = v_pos where id = v_block;
    end loop;
  end loop;

  raise notice 'Unit 1 remontada na estrutura do livro';
end;
$mig$;
