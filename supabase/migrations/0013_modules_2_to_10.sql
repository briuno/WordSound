-- WordSound — estrutura dos modulos 2 a 10
--
-- Titulos, temas e ordem vem do indice do livro. As licoes entram como
-- rascunho de proposito: publicar licao sem exercicio quebraria a trilha do
-- aluno, que ficaria com etapas vazias impossiveis de concluir. O admin
-- publica cada uma conforme o conteudo entra.
--
-- Os blocos de listening ja nascem com o audio do curso vinculado, entao
-- quando as perguntas forem escritas o arquivo certo ja esta no lugar.

do $seed$
declare
  v_course  bigint;
  v_module  bigint;
  m record;
  l record;
  v_lesson  bigint;
  v_media   bigint;
  v_pos     int;
begin
  select id into v_course from public.courses where slug = 'english-basics';
  if v_course is null then raise notice 'curso ausente'; return; end if;

  for m in
    select * from (values
      (2,  'Unit 2 — Favourites',  'Cores, objetos pessoais, familia, tecnologia e aparencia. Gramatica: have got, caso possessivo, adjetivos, this/that, plurais.'),
      (3,  'Unit 3 — Daily life',  'Dias da semana, rotina, horas, esportes, tempo livre e programas de TV. Gramatica: presente simples, preposicoes de tempo, perguntas com wh-.'),
      (4,  'Unit 4 — At home',     'Tarefas domesticas, moveis, comodos e numeros ordinais. Gramatica: adverbios de frequencia, there is / there are, artigos.'),
      (5,  'Unit 5 — In the city', 'Transporte, lugares da cidade, direcoes e meio ambiente. Gramatica: can para habilidade, imperativo, pronomes objeto.'),
      (6,  'Unit 6 — Grab a bite', 'Comida e bebida, categorias e quantidades. Gramatica: contaveis e incontaveis, some e any, how much e how many.'),
      (7,  'Unit 7 — Online',      'Formas de se comunicar, telefone, informatica e clima. Gramatica: presente continuo.'),
      (8,  'Unit 8 — Memories',    'Materias escolares, anos, eventos da vida e partes do corpo. Gramatica: passado simples, passado de to be, there was / there were.'),
      (9,  'Unit 9 — Extreme',     'Numeros acima de cem, roupas, tamanhos, precos, compras, espaco e esportes radicais. Gramatica: comparativo e superlativo.'),
      (10, 'Unit 10 — Get away',   'Tipos de viagem, estacoes, meses, geografia e atividades de ferias. Gramatica: futuro com be going to e o verbo should.')
    ) as t(pos, title, descr)
  loop
    if exists (select 1 from public.modules where course_id = v_course and position = m.pos) then
      continue;
    end if;

    insert into public.modules (course_id, title, description, position, status)
    values (v_course, m.title, m.descr, m.pos, 'draft')
    returning id into v_module;

    v_pos := 0;

    for l in
      select * from (values
        -- (modulo, titulo, objetivo)
        (2,  'Colours & Personal Items', 'Nomear cores e objetos do dia a dia.'),
        (2,  'Family',                   'Falar dos membros da familia.'),
        (2,  'Have Got',                 'Usar have got para posse.'),
        (2,  'Possessive Case',          'Usar o caso possessivo com apostrofo.'),
        (2,  'This / That / These / Those', 'Apontar objetos perto e longe.'),
        (2,  'Plurals',                  'Formar o plural, regular e irregular.'),
        (2,  'Appearance',               'Descrever a aparencia de alguem.'),

        (3,  'Days of the Week',         'Dizer os dias e falar da semana.'),
        (3,  'Daily Routine',            'Descrever a rotina do dia.'),
        (3,  'Telling the Time',         'Perguntar e dizer as horas.'),
        (3,  'Present Simple',           'Falar de acoes habituais.'),
        (3,  'Wh- Questions',            'Fazer perguntas abertas.'),
        (3,  'Sports & Spare Time',      'Falar de esportes e tempo livre.'),
        (3,  'TV Programmes',            'Falar de programas de TV e preferencias.'),

        (4,  'Rooms & Furniture',        'Nomear comodos e moveis.'),
        (4,  'Housework',                'Falar de tarefas domesticas.'),
        (4,  'There is / There are',     'Dizer o que existe em um lugar.'),
        (4,  'Prepositions of Place',    'Dizer onde as coisas estao.'),
        (4,  'Adverbs of Frequency',     'Dizer com que frequencia algo acontece.'),
        (4,  'Ordinal Numbers',          'Usar primeiro, segundo, terceiro.'),

        (5,  'Means of Transport',       'Falar de como se locomover.'),
        (5,  'Places in a City',         'Nomear lugares da cidade.'),
        (5,  'Can for Ability',          'Dizer o que sabe e o que nao sabe fazer.'),
        (5,  'Giving Directions',        'Pedir e dar direcoes.'),
        (5,  'Object Pronouns',          'Usar me, him, her, us, them.'),
        (5,  'The Environment',          'Falar do meio ambiente e do bairro.'),

        (6,  'Food & Drink',             'Nomear comidas e bebidas.'),
        (6,  'Countable & Uncountable',  'Diferenciar o que se conta do que nao se conta.'),
        (6,  'Some / Any',               'Usar some e any em afirmativas e perguntas.'),
        (6,  'How much / How many',      'Perguntar quantidade.'),
        (6,  'Ordering Food',            'Pedir comida em um restaurante.'),

        (7,  'Ways of Communicating',    'Falar de formas de comunicacao.'),
        (7,  'Telephone Language',       'Conversar ao telefone.'),
        (7,  'Present Progressive',      'Falar do que acontece agora.'),
        (7,  'Computer Language',        'Usar vocabulario de informatica.'),
        (7,  'The Weather',              'Falar sobre o tempo.'),

        (8,  'School Subjects',          'Nomear as materias escolares.'),
        (8,  'Past Simple of To Be',     'Usar was e were.'),
        (8,  'Past Simple',              'Falar de acoes concluidas no passado.'),
        (8,  'There was / There were',   'Dizer o que existia.'),
        (8,  'Life Events',              'Contar acontecimentos da vida.'),
        (8,  'Parts of the Body',        'Nomear partes do corpo.'),

        (9,  'Numbers over a Hundred',   'Ler numeros grandes e precos.'),
        (9,  'Clothes & Sizes',          'Falar de roupas e tamanhos.'),
        (9,  'Comparatives',             'Comparar duas coisas.'),
        (9,  'Superlatives',             'Dizer o mais e o menos.'),
        (9,  'Shopping',                 'Comprar e perguntar precos.'),
        (9,  'Animals & Extreme Sports', 'Falar de animais e esportes radicais.'),

        (10, 'Months & Seasons',         'Dizer meses, estacoes e datas.'),
        (10, 'Types of Holiday',         'Falar de tipos de viagem.'),
        (10, 'Be Going To',              'Falar de planos e intencoes.'),
        (10, 'The Verb Should',          'Pedir e dar conselhos.'),
        (10, 'Geographical Features',    'Nomear acidentes geograficos.'),
        (10, 'Invitations',              'Convidar, aceitar e recusar.')
      ) as t(mod, title, objective)
      where t.mod = m.pos
    loop
      v_pos := v_pos + 1;
      insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
      values (v_module, l.title, l.objective, 10, 50, v_pos, 'draft');
    end loop;

    -- Reading, Listening, Writing e Review fecham toda unidade, como na Unit 1
    for l in select * from (values
        ('Reading',     'Entender um texto curto da unidade.',   12, 50),
        ('Listening',   'Entender falas curtas da unidade.',     12, 50),
        ('Writing',     'Escrever um texto curto da unidade.',   12, 50),
        ('Unit Review', 'Consolidar tudo o que a unidade cobriu.', 15, 100)
      ) as t(title, objective, minutes, xp)
    loop
      v_pos := v_pos + 1;
      insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
      values (v_module, l.title, l.objective, l.minutes, l.xp, v_pos, 'draft')
      returning id into v_lesson;

      -- na licao de Listening, ja pendura o audio do curso daquele modulo
      if l.title = 'Listening' then
        declare
          v_i int := 0;
        begin
          for v_media in
            select id from public.media
            where kind = 'audio'
              and title ilike '%Module ' || lpad(m.pos::text, 2, '0') || '%'
            order by title
          loop
            v_i := v_i + 1;
            insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position)
            values (v_lesson, 'LISTENING', 'Track ' || v_i,
                    jsonb_build_object('instructions', 'Ouca a faixa e responda os exercicios.'),
                    v_media, v_i);
          end loop;
        end;
      end if;
    end loop;
  end loop;

  raise notice 'modulos 2 a 10 criados como rascunho';
end $seed$;
