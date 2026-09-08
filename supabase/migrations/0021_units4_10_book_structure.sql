-- WordSound — Units 4 a 10 na estrutura do livro
--
-- Mesma remontagem da 0020, agora nas sete unidades que ainda estao vazias.
-- Fazer isso antes de escrever o conteudo e o que evita reescrever sete
-- unidades depois: aqui so ha casca para renomear.
--
-- A forma vem do proprio livro, conferida pagina a pagina nos modulos 4 a 10:
-- cada modulo abre com uma pagina de capa e segue em a, b, c (com o Task na
-- virada), d e Review. Reading, Listening, Speaking e Writing nao viram licao,
-- porque no livro sao colunas de habilidade distribuidas dentro dessas paginas.
--
-- Os titulos das licoes carregam o assunto que o livro trata em cada uma, para
-- o aluno achar a pagina. As licoes continuam em rascunho: sem exercicio, uma
-- licao publicada viraria etapa vazia impossivel de concluir.
--
-- As faixas ja penduradas pela 0013 numa unica licao de listening vao para a
-- licao em que o livro as usa. Quem decide e o nome do arquivo
-- ('...module-04-lesson-a-act-4...' entra na 4a), nunca o tema.

do $mig$
declare
  v_course bigint;
  v_module bigint;
  l record;
  r record;
  v_lesson bigint;
  v_block  bigint;
  v_pos    int;
begin
  select id into v_course from public.courses where slug = 'english-basics';
  if v_course is null then raise notice 'curso ausente'; return; end if;

  create temp table novas_licoes (modulo int, slot text, lesson_id bigint) on commit drop;

  -- ------------------------------------------------------------ as licoes
  for l in
    select * from (values
      (4, 1, '4a — Housework',              'Falar de tarefas domesticas e com que frequencia voce as faz.', 'a'),
      (4, 2, '4b — Furniture',              'Nomear moveis e objetos da casa.',                              'b'),
      (4, 3, '4c — House or flat',          'Dizer o que existe em cada comodo.',                            'c'),
      (4, 4, '4 Task — Choosing a flat',    'Comparar dois apartamentos e decidir com um colega.',           'task'),
      (4, 5, '4d — Ordinals',               'Usar numeros ordinais e descrever uma casa.',                   'd'),
      (4, 6, '4 Review',                    'Consolidar o modulo 4.',                                        'rev'),

      (5, 1, '5a — Getting around',         'Falar de meios de transporte.',                                 'a'),
      (5, 2, '5b — Places in a city',       'Localizar lugares e dar instrucoes.',                           'b'),
      (5, 3, '5c — The environment',        'Falar do bairro e usar pronomes objeto.',                       'c'),
      (5, 4, '5 Task — Your neighbourhood', 'Discutir e planejar melhorias no bairro.',                      'task'),
      (5, 5, '5d — Sights',                 'Descrever a sua cidade.',                                       'd'),
      (5, 6, '5 Review',                    'Consolidar o modulo 5.',                                        'rev'),

      (6, 1, '6a — Food categories',        'Classificar alimentos e usar contaveis e incontaveis.',         'a'),
      (6, 2, '6b — Food and drink',         'Pedir comida e usar some e any.',                               'b'),
      (6, 3, '6c — Quantities',             'Falar de quantidades.',                                         'c'),
      (6, 4, '6 Task — A food survey',      'Responder e reportar uma pesquisa sobre comida.',               'task'),
      (6, 5, '6d — Meals',                  'Falar dos habitos alimentares do dia a dia.',                   'd'),
      (6, 6, '6 Review',                    'Consolidar o modulo 6.',                                        'rev'),

      (7, 1, '7a — Communicating',          'Dizer como voce se comunica e usar o presente continuo.',       'a'),
      (7, 2, '7b — What are you doing?',    'Perguntar o que alguem esta fazendo agora.',                    'b'),
      (7, 3, '7c — Computers',              'Nomear acoes e icones do computador.',                          'c'),
      (7, 4, '7 Task — Computer quiz',      'Responder um quiz de informatica.',                             'task'),
      (7, 5, '7d — The weather',            'Falar do tempo e escrever um email a um amigo.',                'd'),
      (7, 6, '7 Review',                    'Consolidar o modulo 7.',                                        'rev'),

      (8, 1, '8a — Yesterday',              'Contar o que aconteceu, no passado simples.',                   'a'),
      (8, 2, '8b — School subjects',        'Falar dos anos de escola e perguntar sobre o passado.',         'b'),
      (8, 3, '8c — Life events',            'Contar acontecimentos da vida de alguem.',                      'c'),
      (8, 4, '8 Task — A famous person',    'Entender um programa de radio sobre uma figura historica.',     'task'),
      (8, 5, '8d — Parts of the body',      'Nomear partes do corpo e contar um dia ruim.',                  'd'),
      (8, 6, '8 Review',                    'Consolidar o modulo 8.',                                        'rev'),

      (9, 1, '9a — Clothes and sizes',      'Falar de roupas e comparar duas coisas.',                       'a'),
      (9, 2, '9b — The Solar System',       'Usar o superlativo.',                                           'b'),
      (9, 3, '9c — Animals',                'Falar de animais e do risco de extincao.',                      'c'),
      (9, 4, '9 Task — Mountain gorillas',  'Entender uma conversa sobre gorilas da montanha.',              'task'),
      (9, 5, '9d — Extreme sports',         'Falar de esportes radicais e descrever uma experiencia.',       'd'),
      (9, 6, '9 Review',                    'Consolidar o modulo 9.',                                        'rev'),

      (10, 1, '10a — Seasons and holidays', 'Falar de estacoes e de planos com be going to.',                'a'),
      (10, 2, '10b — Geography',            'Nomear acidentes geograficos e perguntar sobre planos.',        'b'),
      (10, 3, '10c — Travelling',           'Dizer o que levar em viagem e dar conselhos com should.',       'c'),
      (10, 4, '10 Task — Choosing a holiday','Ler anuncios e escolher a viagem certa para cada pessoa.',     'task'),
      (10, 5, '10d — Holiday plans',        'Escrever um email durante a viagem.',                           'd'),
      (10, 6, '10 Review',                  'Consolidar o modulo 10.',                                       'rev')
    ) as t(modulo, pos, titulo, objetivo, slot)
  loop
    select id into v_module from public.modules where course_id = v_course and position = l.modulo;
    if v_module is null then continue; end if;

    -- ja migrado? o titulo do livro comeca com o numero do modulo e a letra
    if exists (select 1 from public.lessons where module_id = v_module and title = l.titulo) then
      continue;
    end if;

    -- posicao alta para conviver com as licoes antigas ate elas sairem
    insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
    values (v_module, l.titulo, l.objetivo,
            case l.slot when 'rev' then 15 when 'task' then 10 else 15 end,
            case l.slot when 'rev' then 100 else 50 end,
            100 + l.pos, 'draft')
    returning id into v_lesson;

    insert into novas_licoes values (l.modulo, l.slot, v_lesson);
  end loop;

  -- --------------------------------------------- as faixas vao para a licao
  -- O padrao do nome do arquivo diz a atividade do livro, e e so isso que
  -- decide o destino.
  for r in
    select n.modulo, n.slot, n.lesson_id,
           case n.slot
             when 'a'    then 'lesson-a-'
             when 'b'    then 'lesson-b-'
             when 'd'    then 'lesson-d-'
             else 'task-'
           end as marca
    from novas_licoes n
    where n.slot in ('a', 'b', 'd', 'task')
  loop
    v_pos := 0;
    for v_block in
      select b.id
      from public.lesson_blocks b
      join public.media m on m.id = b.media_id
      join public.lessons old on old.id = b.lesson_id
      join public.modules mo on mo.id = old.module_id
      where mo.course_id = v_course and mo.position = r.modulo
        and old.position < 100
        and b.block_type = 'LISTENING'
        and m.storage_path like 'audio/%module-' || lpad(r.modulo::text, 2, '0') || '-' || r.marca || '%'
      order by m.storage_path
    loop
      v_pos := v_pos + 1;
      update public.lesson_blocks b set
        lesson_id = r.lesson_id,
        position  = v_pos,
        title     = regexp_replace(
                      (select m.title from public.media m where m.id = b.media_id),
                      '^Pioneer · Module [0-9]+ ', '')
      where b.id = v_block;
    end loop;
  end loop;

  -- ------------------------------------------- fora as licoes por tema
  delete from public.lessons les
  using public.modules m
  where les.module_id = m.id
    and m.course_id = v_course
    and m.position between 4 and 10
    and les.position < 100
    and exists (select 1 from novas_licoes n where n.modulo = m.position);

  update public.lessons les set position = les.position - 100
  from public.modules m
  where les.module_id = m.id and m.course_id = v_course and les.position >= 100;

  raise notice 'Units 4 a 10 remontadas na estrutura do livro';
end;
$mig$;
