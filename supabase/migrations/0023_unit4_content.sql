-- WordSound — Unit 4 (At home)
--
-- Preenche as seis licoes que a 0021 deixou na forma do livro: 4a, 4b, 4c,
-- 4 Task, 4d e 4 Review. O programa e o do Module 4 do Pioneer — tarefas
-- domesticas, moveis, comodos, preposicoes de lugar, ordinais, e a gramatica
-- de adverbios de frequencia, there is / there are e artigos.
--
-- O conteudo e proprio, escrito para esses mesmos pontos de ensino: texto,
-- exemplos e exercicios sao nossos, nao do livro. As perguntas de listening
-- falam do audio do curso, que o aluno ouve, e por isso descrevem o que
-- acontece nele sem transcreve-lo.
--
-- Os blocos de explicacao usam a forma que a Unit 1 e a 2 ja usam — rule,
-- tables, contrast, keyPoints, tip — porque paradigma se le em tabela, e
-- porque regra e tabela sao o que o aluno reve no "Ver a regra" durante a
-- pratica.
--
-- As faixas ja estao penduradas nas licoes certas desde a 0021. Aqui elas so
-- ganham instrucao e perguntas. A faixa 'listening B' da 4a fica sem pergunta
-- de proposito: a secao de transcricoes do livro nao traz essa parte, e
-- inventar pergunta sobre audio que nao se conhece daria gabarito errado.

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
  m_a1 bigint; m_a2 bigint; m_task bigint; m_d bigint;
begin
  select m.id into v_module
  from public.modules m join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and m.position = 4;
  if v_module is null then raise notice 'Unit 4 ausente'; return; end if;

  select id into m_a1   from public.media where storage_path like 'audio/%module-04-lesson-a-act-4-listening-a%';
  select id into m_a2   from public.media where storage_path like 'audio/%module-04-lesson-a-act-4-listening-b%';
  select id into m_task from public.media where storage_path like 'audio/%module-04-task-a%';
  select id into m_d    from public.media where storage_path like 'audio/%module-04-lesson-d-act-2%';

  -- ============================================================ 4a Housework
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson and block_type <> 'LISTENING') then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Tarefas de casa',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','do the washing-up','translation','lavar a louca','example','I do the washing-up after dinner.'),
         jsonb_build_object('word','do the washing',   'translation','lavar a roupa', 'example','My sister does the washing on Sundays.'),
         jsonb_build_object('word','do the shopping',  'translation','fazer as compras','example','We do the shopping together.'),
         jsonb_build_object('word','do the ironing',   'translation','passar roupa',  'example','I hate doing the ironing.'),
         jsonb_build_object('word','hoover',           'translation','aspirar',       'example','He hoovers the living room.'),
         jsonb_build_object('word','make the bed',     'translation','arrumar a cama','example','Make your bed, please.'),
         jsonb_build_object('word','lay the table',    'translation','por a mesa',    'example','Can you lay the table?'),
         jsonb_build_object('word','tidy up',          'translation','arrumar',       'example','I tidy up my room every day.'),
         jsonb_build_object('word','take out the rubbish','translation','levar o lixo para fora','example','Dad takes out the rubbish at night.'),
         jsonb_build_object('word','wash the car',     'translation','lavar o carro', 'example','He washes the car every week.')
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Adverbios de frequencia',
       jsonb_build_object(
         'rule', 'O adverbio de frequencia vem ANTES do verbo comum, mas DEPOIS do verbo to be.',
         'tables', jsonb_build_array(
           jsonb_build_object(
             'caption', 'Do sempre ao nunca',
             'columns', jsonb_build_array('Adverbio', 'Quanto', 'Exemplo'),
             'rows', jsonb_build_array(
               jsonb_build_array('always',    '100%', 'I always do the washing-up.'),
               jsonb_build_array('usually',   '80%',  'She usually hoovers on Fridays.'),
               jsonb_build_array('often',     '60%',  'We often tidy up together.'),
               jsonb_build_array('sometimes', '40%',  'He sometimes lays the table.'),
               jsonb_build_array('rarely',    '10%',  'They rarely do the ironing.'),
               jsonb_build_array('never',     '0%',   'I never wash the car.')
             )),
           jsonb_build_object(
             'caption', 'Onde o adverbio entra',
             'columns', jsonb_build_array('Tipo de verbo', 'Ordem', 'Exemplo'),
             'rows', jsonb_build_array(
               jsonb_build_array('verbo comum', 'sujeito + adverbio + verbo', 'Mark never hoovers.'),
               jsonb_build_array('verbo to be', 'sujeito + to be + adverbio', 'Mark is never late.')
             ))
         ),
         'contrast', jsonb_build_array(
           jsonb_build_object('wrong','I do always the washing-up.','right','I always do the washing-up.',
                              'why','Em ingles o adverbio nao fica entre o verbo e o objeto.'),
           jsonb_build_object('wrong','She is often does the shopping.','right','She often does the shopping.',
                              'why','So um verbo por frase: ou to be, ou o verbo comum.'),
           jsonb_build_object('wrong','I never not tidy up.','right','I never tidy up.',
                              'why','never ja e negativo. Nao se usa outra negacao junto.')
         ),
         'keyPoints', jsonb_build_array(
           'Antes do verbo comum: I always do the washing.',
           'Depois do to be: I am always tired.',
           'never e rarely ja sao negativos: o verbo fica na forma afirmativa.',
           'How often...? e a pergunta que pede esses adverbios de resposta.'
         ),
         'tip', 'sometimes tambem pode abrir a frase: Sometimes I hoover the bedroom.'
       ), 2);

    -- as duas faixas ja estao aqui desde a 0021: entram depois da regra
    update public.lesson_blocks set position = 3,
      content = jsonb_build_object('instructions',
        'Uma pesquisa de rua sobre tarefas domesticas. Anote quem faz o que, e com que frequencia.')
    where lesson_id = v_lesson and media_id = m_a1;

    update public.lesson_blocks set position = 4,
      content = jsonb_build_object('instructions',
        'Segunda parte da mesma atividade. Ouca para treinar o ouvido; nao ha pergunta nesta faixa.')
    where lesson_id = v_lesson and media_id = m_a2;

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 5) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
    values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
            'Which job does the woman say she always does?',
            'Ela responde que sempre lava a louca, depois de cada refeicao.', 2, 10, 1, m_a1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'The washing-up.', true, 1), (v_ex, 'The ironing.', false, 2), (v_ex, 'The beds.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
    values (v_block, 'TRUE_FALSE', 'Listen. True or false?',
            'Mark enjoys hoovering.',
            'Falso. Ela diz que ele detesta aspirar, e faz outras tarefas.', 2, 10, 2, m_a1,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
    values (v_block, 'LISTENING_FILL_BLANK', 'Listen and complete.',
            'Com que frequencia o marido lava o carro?',
            'Ele lava o carro toda semana, normalmente aos domingos.', 3, 10, 3, m_a1,
            '{"template": "He washes the car {{0}} week."}'::jsonb,
            '{"blanks": [{"accepted": ["every"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in order.',
            'Monte a frase com o adverbio no lugar certo.',
            'Adverbio antes do verbo comum: I always make my bed.', 2, 10, 4,
            '{"tokens": ["I", "always", "make", "my", "bed"]}'::jsonb,
            '{"order": ["I", "always", "make", "my", "bed"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'CHOICE_INLINE', 'Choose the correct option.',
            'She ___ late.',
            'Com o to be o adverbio vem depois: She is never late.', 2, 10, 5)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'is never', true, 1), (v_ex, 'never is', false, 2);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'Someone asks "How often do you do the shopping?" and you go once a week. What do you say?',
            'Uma resposta natural traz a frequencia: "Once a week." ou "I do the shopping once a week."', 3, 10, 6,
            '{"accepted": ["once a week","i do the shopping once a week","every week","i do it once a week"]}'::jsonb);
  end if;

  -- ============================================================ 4b Furniture
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Moveis e eletrodomesticos',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','armchair', 'translation','poltrona',   'example','There is an armchair next to the sofa.'),
         jsonb_build_object('word','bookcase', 'translation','estante',    'example','My books are in the bookcase.'),
         jsonb_build_object('word','wardrobe', 'translation','guarda-roupa','example','Her clothes are in the wardrobe.'),
         jsonb_build_object('word','cupboard', 'translation','armario',    'example','The plates are in the cupboard.'),
         jsonb_build_object('word','fridge',   'translation','geladeira',  'example','There is milk in the fridge.'),
         jsonb_build_object('word','cooker',   'translation','fogao',      'example','The cooker is next to the sink.'),
         jsonb_build_object('word','sink',     'translation','pia',        'example','The plates are in the sink.'),
         jsonb_build_object('word','washing machine','translation','maquina de lavar','example','The washing machine is in the kitchen.'),
         jsonb_build_object('word','curtains', 'translation','cortinas',   'example','The curtains are blue.'),
         jsonb_build_object('word','carpet',   'translation','tapete',     'example','There is a carpet on the floor.'),
         jsonb_build_object('word','mirror',   'translation','espelho',    'example','There is a mirror above the sink.'),
         jsonb_build_object('word','lamp',     'translation','luminaria',  'example','The lamp is on the desk.')
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'READING', 'My guide to simple housework',
       jsonb_build_object(
         'text', 'People say housework is hard. It is not hard — it is just never finished! My guide is simple. First, do a little every day. Ten minutes in the kitchen after dinner is better than three hours on Saturday. Second, put things back. A room is not untidy because it is dirty; it is untidy because the books are on the sofa and the shoes are under the table. Third, share the jobs. In my house we make a list on Sunday: I do the washing, my brother does the washing-up, and we do the shopping together. Nobody does everything, and nobody does nothing. Fourth, start with the thing you hate. I hate ironing, so I iron first. After that, the rest feels easy.',
         'vocabulary', jsonb_build_array(
           jsonb_build_object('word','untidy',   'translation','baguncado'),
           jsonb_build_object('word','share',    'translation','dividir'),
           jsonb_build_object('word','finished', 'translation','terminado'),
           jsonb_build_object('word','the rest', 'translation','o resto')
         )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'According to the text, why is a room untidy?',
            'O texto diz que nao e por sujeira: e porque as coisas nao estao no lugar delas.', 2, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Because things are not in their place.', true,  1),
      (v_ex, 'Because it is dirty.',                   false, 2),
      (v_ex, 'Because it is small.',                   false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'The writer does every job at home alone.',
            'Falso. O texto diz que as tarefas sao divididas: ninguem faz tudo e ninguem fica sem fazer nada.', 2, 10, 2,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the item with the room.',
            'Onde cada coisa costuma ficar?',
            'Relacionar o movel ao comodo ajuda a fixar as duas listas ao mesmo tempo.', 2, 10, 3,
            '{"left": ["cooker","wardrobe","armchair","mirror"], "right": ["in the living room","in the kitchen","in the bathroom","in the bedroom"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,0],[3,2]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'CATEGORY_SORT', 'Put each word in the right group.',
            'Movel ou eletrodomestico?',
            'Eletrodomestico e o que liga na tomada e faz um trabalho; o resto e movel.', 3, 10, 4,
            '{"left": ["bookcase","fridge","wardrobe","washing machine","armchair","cooker"], "right": ["Furniture","Appliance"]}'::jsonb,
            '{"pairs": [[0,0],[1,1],[2,0],[3,1],[4,0],[5,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'O lugar da louca suja.',
            'A pia da cozinha e o sink.', 1, 10, 5,
            '{"template": "The dirty plates are in the {{0}}."}'::jsonb,
            '{"blanks": [{"accepted": ["sink"]}]}'::jsonb);
  end if;

  -- ======================================================= 4c House or flat
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Comodos e partes da casa',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','living room','translation','sala',        'example','The living room is really big.'),
         jsonb_build_object('word','bedroom',    'translation','quarto',      'example','The flat has got two bedrooms.'),
         jsonb_build_object('word','bathroom',   'translation','banheiro',    'example','There is a large bathroom.'),
         jsonb_build_object('word','kitchen',    'translation','cozinha',     'example','It is a small kitchen.'),
         jsonb_build_object('word','balcony',    'translation','varanda',     'example','This flat has got a big balcony.'),
         jsonb_build_object('word','garden',     'translation','jardim, quintal','example','We have not got a back garden.'),
         jsonb_build_object('word','stairs',     'translation','escada',      'example','The stairs are on the left.'),
         jsonb_build_object('word','floor',      'translation','andar; chao', 'example','I live on the third floor.'),
         jsonb_build_object('word','flat',       'translation','apartamento', 'example','Let us rent this flat.'),
         jsonb_build_object('word','lift',       'translation','elevador',    'example','The lift is next to the stairs.')
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'There is / There are',
       jsonb_build_object(
         'rule', 'There is para um, there are para varios. O verbo concorda com o que vem DEPOIS dele.',
         'tables', jsonb_build_array(
           jsonb_build_object(
             'caption', 'As tres formas',
             'columns', jsonb_build_array('', 'Singular', 'Plural'),
             'rows', jsonb_build_array(
               jsonb_build_array('afirmativa', 'There is a sofa.',        'There are two sofas.'),
               jsonb_build_array('negativa',   'There isn''t a garden.',  'There aren''t any chairs.'),
               jsonb_build_array('pergunta',   'Is there a lift?',        'Are there any bedrooms?'),
               jsonb_build_array('resposta',   'Yes, there is. / No, there isn''t.', 'Yes, there are. / No, there aren''t.')
             )),
           jsonb_build_object(
             'caption', 'Preposicoes de lugar',
             'columns', jsonb_build_array('Preposicao', 'Sentido', 'Exemplo'),
             'rows', jsonb_build_array(
               jsonb_build_array('in',      'dentro de',   'The milk is in the fridge.'),
               jsonb_build_array('on',      'sobre',       'The lamp is on the table.'),
               jsonb_build_array('under',   'embaixo de',  'The shoes are under the bed.'),
               jsonb_build_array('next to', 'ao lado de',  'The cooker is next to the sink.'),
               jsonb_build_array('between', 'entre',       'The lamp is between the beds.'),
               jsonb_build_array('above',   'acima de',    'There is a mirror above the sink.')
             ))
         ),
         'contrast', jsonb_build_array(
           jsonb_build_object('wrong','There have two bedrooms.','right','There are two bedrooms.',
                              'why','O "tem" de existencia em ingles e there is / there are, nunca have.'),
           jsonb_build_object('wrong','There is two chairs.','right','There are two chairs.',
                              'why','O verbo concorda com o que vem depois: two chairs e plural.'),
           jsonb_build_object('wrong','Has a lift in the building?','right','Is there a lift in the building?',
                              'why','A pergunta de existencia inverte there is, nao usa have.')
         ),
         'keyPoints', jsonb_build_array(
           'There is + singular, There are + plural.',
           'Na negativa e na pergunta com plural aparece any: There aren''t any chairs.',
           'A resposta curta repete there: Yes, there is.',
           'Artigo: a(n) para algo novo na conversa, the para algo ja conhecido.'
         ),
         'tip', 'a antes de som de consoante, an antes de som de vogal: a sofa, an armchair.'
       ), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            '___ three bedrooms in this house.',
            'three bedrooms e plural, entao There are.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'There are', true, 1), (v_ex, 'There is', false, 2), (v_ex, 'There have', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with is or are.',
            'Complete a frase negativa.',
            'a balcony e singular, entao isn''t.', 2, 10, 2,
            '{"template": "There {{0}} a balcony in this flat."}'::jsonb,
            '{"blanks": [{"accepted": ["isn''t","is not"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'CORRECT_SENTENCE', 'Correct the sentence.',
            'There have a big kitchen.',
            'O "tem" de existencia e there is: There is a big kitchen.', 3, 10, 3,
            '{"accepted": ["there is a big kitchen","there''s a big kitchen"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'CHOICE_INLINE', 'Choose the correct preposition.',
            'There is a mirror ___ the sink.',
            'above e "acima de": o espelho fica acima da pia.', 2, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'above', true, 1), (v_ex, 'under', false, 2), (v_ex, 'between', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in order.',
            'Monte a pergunta.',
            'A pergunta de existencia inverte: Are there any chairs in the kitchen?', 3, 10, 5,
            '{"tokens": ["Are", "there", "any", "chairs", "in", "the", "kitchen"]}'::jsonb,
            '{"order": ["Are", "there", "any", "chairs", "in", "the", "kitchen"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct article.',
            'There is ___ armchair next to the sofa.',
            'armchair comeca com som de vogal, entao an.', 2, 10, 6)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'an', true, 1), (v_ex, 'a', false, 2), (v_ex, 'the', false, 3);
  end if;

  -- ==================================================== 4 Task Choosing a flat
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson and block_type <> 'LISTENING') then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Antes de ouvir',
       jsonb_build_object(
         'rule', 'Duas pessoas comparam dois apartamentos e escolhem um. Ouca o que pesa na decisao.',
         'keyPoints', jsonb_build_array(
           'Nem sempre o melhor comodo decide: as vezes vale o que a pessoa mais usa.',
           'Preste atencao nos adjetivos de tamanho: large, big, small.',
           'Quando alguem diz "but", vem a informacao que muda a escolha.'
         ),
         'tip', 'Na primeira escuta pegue so qual apartamento eles escolhem. Os detalhes ficam para a segunda.'
       ), 1);

    update public.lesson_blocks set position = 2,
      content = jsonb_build_object('instructions',
        'Uma conversa sobre dois apartamentos. Compare os comodos de cada um antes de responder.')
    where lesson_id = v_lesson and media_id = m_task;

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
    values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
            'How many bedrooms has the flat they are talking about got?',
            'Eles comentam que ha so um quarto, mas que ele e grande.', 2, 10, 1, m_task)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'One.',   true,  1),
      (v_ex, 'Two.',   false, 2),
      (v_ex, 'Three.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
    values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
            'Why do they decide on this flat?',
            'A varanda grande pesa mais do que a cozinha pequena, porque eles nao cozinham muito.', 3, 10, 2, m_task)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Because of the big balcony.', true,  1),
      (v_ex, 'Because of the kitchen.',     false, 2),
      (v_ex, 'Because it is cheap.',        false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
    values (v_block, 'TRUE_FALSE', 'Listen. True or false?',
            'The kitchen in this flat is small.',
            'Verdadeiro. Um deles aponta a cozinha pequena, e o outro responde que eles nao cozinham muito.', 2, 10, 3, m_task,
            '{"value": true}'::jsonb);
  end if;

  -- ============================================================ 4d Ordinals
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson and block_type <> 'LISTENING') then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Numeros ordinais',
       jsonb_build_object(
         'rule', 'O ordinal se forma com -th, com quatro excecoes que se decoram: first, second, third e as terminacoes em -y.',
         'tables', jsonb_build_array(
           jsonb_build_object(
             'caption', 'Os que fogem da regra',
             'columns', jsonb_build_array('Numero', 'Ordinal', 'Forma curta'),
             'rows', jsonb_build_array(
               jsonb_build_array('one',    'first',   '1st'),
               jsonb_build_array('two',    'second',  '2nd'),
               jsonb_build_array('three',  'third',   '3rd'),
               jsonb_build_array('five',   'fifth',   '5th'),
               jsonb_build_array('eight',  'eighth',  '8th'),
               jsonb_build_array('nine',   'ninth',   '9th'),
               jsonb_build_array('twelve', 'twelfth', '12th')
             )),
           jsonb_build_object(
             'caption', 'Os que seguem a regra',
             'columns', jsonb_build_array('Numero', 'Ordinal', 'Forma curta'),
             'rows', jsonb_build_array(
               jsonb_build_array('four',   'fourth',    '4th'),
               jsonb_build_array('six',    'sixth',     '6th'),
               jsonb_build_array('seven',  'seventh',   '7th'),
               jsonb_build_array('ten',    'tenth',     '10th'),
               jsonb_build_array('eleven', 'eleventh',  '11th'),
               jsonb_build_array('twenty', 'twentieth', '20th')
             ))
         ),
         'contrast', jsonb_build_array(
           jsonb_build_object('wrong','I live in the third floor.','right','I live on the third floor.',
                              'why','Andar de predio pede on, nao in.'),
           jsonb_build_object('wrong','She lives on the five floor.','right','She lives on the fifth floor.',
                              'why','Andar pede ordinal, nao o numero comum.'),
           jsonb_build_object('wrong','the twoth floor','right','the second floor',
                              'why','one, two e three tem forma propria e nao aceitam -th.')
         ),
         'keyPoints', jsonb_build_array(
           'A regra geral e numero + th: four -> fourth.',
           'Terminacao em -y vira -ieth: twenty -> twentieth.',
           'O ordinal quase sempre vem depois de the: the first floor.',
           'Andar: on the third floor. Nao use in.'
         ),
         'tip', 'A forma curta repete as duas ultimas letras do ordinal: fir-st = 1st, seco-nd = 2nd, thi-rd = 3rd.'
       ), 1);

    update public.lesson_blocks set position = 2,
      content = jsonb_build_object('instructions',
        'Duas conversas curtas: alguem descreve a casa nova, e alguem da o endereco. Anote comodos e numeros.')
    where lesson_id = v_lesson and media_id = m_d;

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
    values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
            'What is the living room in Elisa''s new place like?',
            'Ela conta que tem dois quartos e um banheiro grande, mas que a sala e pequena.', 3, 10, 1, m_d)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'It is quite small.', true,  1),
      (v_ex, 'It is very large.',  false, 2),
      (v_ex, 'There isn''t one.',  false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
    values (v_block, 'LISTENING_FILL_BLANK', 'Listen and complete.',
            'Por que ela nao tem quintal?',
            'Ela explica que mora no terceiro andar, entao nao ha quintal.', 3, 10, 2, m_d,
            '{"template": "She lives on the {{0}} floor."}'::jsonb,
            '{"blanks": [{"accepted": ["third","3rd"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
    values (v_block, 'TRUE_FALSE', 'Listen. True or false?',
            'In the second conversation, the man wants the address to send a postcard.',
            'Verdadeiro. Ele pede o endereco porque quer mandar um cartao-postal das ferias.', 2, 10, 3, m_d,
            '{"value": true}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Write the ordinal.',
            'Complete com o ordinal de twelve.',
            'twelve perde o -ve e ganha -fth: twelfth.', 3, 10, 4,
            '{"template": "December is the {{0}} month of the year."}'::jsonb,
            '{"blanks": [{"accepted": ["twelfth","12th"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the number with the ordinal.',
            'Ligue cada numero ao ordinal dele.',
            'first, second, third e fifth sao as formas que nao seguem a regra do -th.', 2, 10, 5,
            '{"left": ["one","two","three","five"], "right": ["third","fifth","first","second"]}'::jsonb,
            '{"pairs": [[0,2],[1,3],[2,0],[3,1]]}'::jsonb);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Escrever: descrever uma casa',
       jsonb_build_object(
         'rule', 'Descreva de fora para dentro: primeiro o tipo de moradia, depois os comodos, por ultimo o detalhe que voce gosta.',
         'keyPoints', jsonb_build_array(
           'Comece pelo geral: I live in a small flat on the third floor.',
           'Liste com virgula e feche com and: There is a kitchen, a bathroom and two bedrooms.',
           'Use there is / there are para o que existe, e have got para o que e seu.',
           'Feche com uma opiniao: My favourite room is the balcony.'
         ),
         'tip', 'Listar tres coisas de uma vez cansa menos quem le do que tres frases curtas seguidas.'
       ), 4);
  end if;

  -- ============================================================ 4 Review
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;

  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'O que a unidade cobriu',
       jsonb_build_object(
         'keyPoints', jsonb_build_array(
           'Tarefas de casa e com que frequencia se faz cada uma.',
           'Adverbio de frequencia: antes do verbo comum, depois do to be.',
           'There is / There are para dizer o que existe, com any na negativa e na pergunta.',
           'Preposicoes de lugar: in, on, under, next to, between, above.',
           'Ordinais e o andar em que se mora: on the third floor.'
         )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Revisao', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'CHOICE_INLINE', 'Choose the correct option.',
            'I ___ the shopping on Fridays.',
            'Antes do verbo comum: I usually do the shopping.', 2, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'usually do', true, 1), (v_ex, 'do usually', false, 2);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with there is or there are.',
            'Complete a pergunta.',
            'any bedrooms e plural: Are there.', 2, 10, 2,
            '{"template": "{{0}} any bedrooms upstairs?"}'::jsonb,
            '{"blanks": [{"accepted": ["are there"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'My flat is ___ the fourth floor.',
            'Andar de predio pede on.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'on', true, 1), (v_ex, 'in', false, 2), (v_ex, 'at', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'CATEGORY_SORT', 'Put each word in the right group.',
            'Comodo ou movel?',
            'Comodo e o espaco; movel e o que se poe dentro dele.', 2, 10, 4,
            '{"left": ["kitchen","wardrobe","bathroom","bookcase","balcony","armchair"], "right": ["Room","Furniture"]}'::jsonb,
            '{"pairs": [[0,0],[1,1],[2,0],[3,1],[4,0],[5,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'CORRECT_SENTENCE', 'Correct the sentence.',
            'There is two mirrors in the bathroom.',
            'two mirrors e plural, entao There are.', 3, 10, 5,
            '{"accepted": ["there are two mirrors in the bathroom"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_SENTENCES', 'Put the dialogue in order.',
            'Ordene a conversa sobre o apartamento.',
            'A pergunta abre, a resposta vem em seguida, e o comentario fecha.', 3, 10, 6,
            '{"tokens": ["Is there a balcony?", "Yes, there is. It is really big.", "Great, I love big balconies."]}'::jsonb,
            '{"order": ["Is there a balcony?", "Yes, there is. It is really big.", "Great, I love big balconies."]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'Someone asks "How often do you hoover?" and you never do it. What do you say?',
            'never ja e negativo, entao o verbo fica afirmativo: "I never hoover."', 3, 10, 7,
            '{"accepted": ["i never hoover","never","i never do it","i never hoover."]}'::jsonb);
  end if;

  -- publica as seis: agora todas tem conteudo e exercicio
  update public.lessons set status = 'published'
  where module_id = v_module and position between 1 and 6;

  raise notice 'Unit 4 preenchida';
end;
$seed$;
