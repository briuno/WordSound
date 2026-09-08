-- WordSound — conteudo das licoes 4 a 12 da Unit 1
--
-- O programa segue o Modulo 1 do livro e as folhas de exercicio: profissoes,
-- paises e nacionalidades, numeros, verbo to be, adjetivos possessivos,
-- leitura, escrita e revisao.
--
-- Os enunciados e frases sao proprios, escritos para os mesmos pontos de
-- ensino, e nao transcricoes do material. A spec 66 pede exatamente isso.

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
begin
  select m.id into v_module
  from public.modules m
  join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics'
  order by m.position limit 1;

  if v_module is null then
    raise notice 'curso base ausente';
    return;
  end if;

  -- ============================================================
  -- Licao 4 — Jobs & Occupations
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Dizer a profissao',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Para falar da profissao use o verbo to be mais a ou an: "I am a teacher.", "She is an architect."',
         'Use an antes de som de vogal: an actor, an architect, an electrician, an engineer. Nos demais casos, a.',
         'A pergunta padrao e "What do you do?". A resposta natural e so a profissao: "I am a nurse."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Profissoes',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','doctor',      'translation','medico',        'example','My father is a doctor.'),
         jsonb_build_object('word','nurse',       'translation','enfermeiro',    'example','She is a nurse at the hospital.'),
         jsonb_build_object('word','dentist',     'translation','dentista',      'example','Dr. Brown is a dentist.'),
         jsonb_build_object('word','teacher',     'translation','professor',     'example','I am a teacher.'),
         jsonb_build_object('word','waiter',      'translation','garcom',        'example','He is a waiter at that cafe.'),
         jsonb_build_object('word','chef',        'translation','chef de cozinha','example','Fran is a chef.'),
         jsonb_build_object('word','architect',   'translation','arquiteto',     'example','She is an architect.'),
         jsonb_build_object('word','electrician', 'translation','eletricista',   'example','Robert is an electrician.'),
         jsonb_build_object('word','actor',       'translation','ator',          'example','Zack is an actor.'),
         jsonb_build_object('word','bus driver',  'translation','motorista de onibus','example','Mr. Thornton is a bus driver.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Robert works with electricity. He is ___ electrician.',
            'Electrician comeca com som de vogal, entao usa-se an.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'an', true, 1), (v_ex, 'a', false, 2), (v_ex, 'the', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Fran cozinha em um restaurante.',
            'Chef comeca com som de consoante, entao usa-se a.', 1, 10, 2,
            '{"template": "Fran is {{0}} chef."}'::jsonb,
            '{"blanks": [{"accepted": ["a"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the job with the place.',
            'Onde cada profissional trabalha?',
            'Relacionar a profissao ao lugar ajuda a fixar o vocabulario.', 2, 10, 3,
            '{"left": ["nurse","teacher","waiter","bus driver"], "right": ["at a school","on a bus","at a hospital","at a restaurant"]}'::jsonb,
            '{"pairs": [[0,2],[1,0],[2,3],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'Someone asks "What do you do?" and you teach English. What do you say?',
            'A resposta natural traz o artigo: "I am a teacher."', 2, 10, 4,
            '{"accepted": ["i am a teacher","im a teacher","i''m a teacher","a teacher","teacher"]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 5 — Countries & Nationalities
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Pais e nacionalidade',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'O pais responde "Where are you from?": "I am from Brazil." A nacionalidade responde o que a pessoa e: "I am Brazilian."',
         'Em ingles, paises e nacionalidades sempre comecam com letra maiuscula, mesmo no meio da frase.',
         'Repare que a terminacao muda: Brazil vira Brazilian, Spain vira Spanish, France vira French, Poland vira Polish.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Paises e nacionalidades',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','Brazil / Brazilian',   'translation','Brasil / brasileiro',   'example','I am from Brazil. I am Brazilian.'),
         jsonb_build_object('word','Spain / Spanish',      'translation','Espanha / espanhol',    'example','She is from Spain. She is Spanish.'),
         jsonb_build_object('word','France / French',      'translation','Franca / frances',      'example','Pierre is French.'),
         jsonb_build_object('word','Russia / Russian',     'translation','Russia / russo',        'example','Inga is Russian.'),
         jsonb_build_object('word','Poland / Polish',      'translation','Polonia / polones',     'example','Our teacher is Polish.'),
         jsonb_build_object('word','Mexico / Mexican',     'translation','Mexico / mexicano',     'example','He is from Mexico.'),
         jsonb_build_object('word','Italy / Italian',      'translation','Italia / italiano',     'example','I am Italian. I am from Rome.'),
         jsonb_build_object('word','Hungary / Hungarian',  'translation','Hungria / hungaro',     'example','My friends are Hungarian.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the nationality.',
            'Ana mora em Sao Paulo.',
            'O pais e Brazil; a nacionalidade e Brazilian, sempre com maiuscula.', 1, 10, 1,
            '{"template": "Ana is from Brazil. She is {{0}}."}'::jsonb,
            '{"blanks": [{"accepted": ["brazilian"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the country.',
            'Pierre e frances.',
            'A nacionalidade e French; o pais e France.', 1, 10, 2,
            '{"template": "Pierre is French. He is from {{0}}."}'::jsonb,
            '{"blanks": [{"accepted": ["france"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the country with the nationality.',
            'Relacione cada pais a sua nacionalidade.',
            'A terminacao muda de um pais para o outro: nao ha uma regra unica.', 2, 10, 3,
            '{"left": ["Spain","Poland","Russia","Hungary"], "right": ["Polish","Hungarian","Spanish","Russian"]}'::jsonb,
            '{"pairs": [[0,2],[1,0],[2,3],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'In English, nationalities are written with a small letter, like "brazilian".',
            'Falso. Nacionalidades e paises levam maiuscula sempre: Brazilian, French, Spanish.', 1, 10, 4,
            '{"value": false}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 6 — Numbers 0-100
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Numeros de 0 a 100',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'De 13 a 19 a terminacao e -teen: thirteen, fourteen, fifteen, sixteen, seventeen, eighteen, nineteen.',
         'As dezenas terminam em -ty: twenty, thirty, forty, fifty, sixty, seventy, eighty, ninety.',
         'Entre 21 e 99 usa-se hifen: twenty-one, forty-five, ninety-nine. Cem e one hundred.',
         'Cuidado com o par que mais confunde: fifteen tem o acento na segunda silaba, fifty na primeira.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the number in words.',
            'fifty-one + nine =',
            'Cinquenta e um mais nove sao sessenta: sixty.', 1, 10, 1,
            '{"accepted": ["sixty","60"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the number in words.',
            'seven + nine =',
            'Sete mais nove sao dezesseis: sixteen.', 1, 10, 2,
            '{"accepted": ["sixteen","16"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'How do you write 45 in English?',
            'Entre 21 e 99 as duas partes vao unidas por hifen: forty-five.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'forty-five', true, 1), (v_ex, 'fourty-five', false, 2), (v_ex, 'four-five', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the phone number.',
            'Escreva por extenso o numero que falta: 5, 1, 9.',
            'Numeros de telefone sao lidos digito a digito em ingles.', 2, 10, 4,
            '{"template": "five, one, {{0}}"}'::jsonb,
            '{"blanks": [{"accepted": ["nine"]}]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 7 — Verb To Be
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 7;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'O verbo to be',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Sao tres formas no presente: I am, he/she/it is, we/you/they are.',
         'Na fala usa-se a forma curta: I am vira I''m, she is vira she''s, they are vira they''re.',
         'A negativa acrescenta not: I''m not, he isn''t, we aren''t.',
         'Na pergunta o verbo vem antes do sujeito: "Are you a student?", "Is she Brazilian?".',
         'Repare que o portugues usa ter para idade, mas o ingles usa to be: "I am twenty years old."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the correct form of to be.',
            'Sujeito no plural.',
            'My friends e plural, entao o verbo e are.', 1, 10, 1,
            '{"template": "My friends {{0}} students."}'::jsonb,
            '{"blanks": [{"accepted": ["are"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the correct form of to be.',
            'Terceira pessoa do singular.',
            'She pede is: "She is my classmate."', 1, 10, 2,
            '{"template": "She {{0}} my classmate."}'::jsonb,
            '{"blanks": [{"accepted": ["is"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Complete: "___ you a doctor?"',
            'Na pergunta o verbo vem primeiro, e you pede are.', 1, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Are', true, 1), (v_ex, 'Is', false, 2), (v_ex, 'Am', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a pergunta.',
            'Na interrogativa a ordem e verbo, sujeito, complemento.', 2, 10, 4,
            '{"tokens": ["you","Are","Brazilian"]}'::jsonb,
            '{"order": ["Are","you","Brazilian"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the negative.',
            'Tim e Mike nao estao aqui hoje.',
            'Com they a negativa curta e aren''t.', 2, 10, 5,
            '{"template": "Tim and Mike {{0}} here today."}'::jsonb,
            '{"blanks": [{"accepted": ["aren''t","are not","arent"]}]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 8 — Possessive Adjectives
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 8;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Adjetivos possessivos',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Sao seis: my, your, his, her, our, their. Eles vem sempre antes do substantivo.',
         'Diferente do portugues, nao mudam no plural: my book e my books.',
         'His e para homem, her para mulher: "His name is Bob.", "Her name is Rita."',
         'Nao confunda his com he''s. He''s e a forma curta de he is: "He''s a student. His name is Paulo."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the possessive adjective.',
            'Falando de Bob.',
            'Bob e homem, entao o possessivo e his.', 1, 10, 1,
            '{"template": "This is Bob. {{0}} last name is Vickers."}'::jsonb,
            '{"blanks": [{"accepted": ["his"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the possessive adjective.',
            'Falando de Amy.',
            'Amy e mulher, entao o possessivo e her.', 1, 10, 2,
            '{"template": "Amy is Hungarian. {{0}} house is on Baker Street."}'::jsonb,
            '{"blanks": [{"accepted": ["her"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Mr. and Mrs. Marshall are my neighbors. ___ house is beautiful.',
            'Sao duas pessoas, entao o possessivo e their.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Their', true, 1), (v_ex, 'They''re', false, 2), (v_ex, 'His', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'This is Claude. ___ last name is Chirac.',
            'Aqui falta o possessivo, que e His. He''s significa he is e nao caberia antes de last name.', 3, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'His', true, 1), (v_ex, 'He''s', false, 2), (v_ex, 'Her', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the subject with the possessive adjective.',
            'Relacione o sujeito ao possessivo correspondente.',
            'Cada pronome tem o seu possessivo fixo.', 2, 10, 5,
            '{"left": ["I","he","she","they"], "right": ["her","my","their","his"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,0],[3,2]]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 9 — Reading
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 9;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'READING', 'At the language school',
       jsonb_build_object(
         'text', 'Good morning. My name is Helen Ballard and I am the school secretary. This is my office. The teachers here are from different countries. Mr. Kovacs is Hungarian and he is our grammar teacher. Ms. Nowak is from Poland. She is a teacher too, and her classroom is next to mine. Our students are from Brazil, Mexico and Peru. Classes start at nine in the morning.',
         'vocabulary', jsonb_build_array(
           jsonb_build_object('word','secretary','translation','secretaria'),
           jsonb_build_object('word','office','translation','escritorio'),
           jsonb_build_object('word','next to','translation','ao lado de'),
           jsonb_build_object('word','start','translation','comecar')
         )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'What is Helen Ballard''s job?',
            'O texto diz "I am the school secretary".', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'She is the school secretary.', true, 1),
      (v_ex, 'She is a grammar teacher.',    false, 2),
      (v_ex, 'She is a student.',            false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'Mr. Kovacs is Polish.',
            'Falso. O texto diz que Mr. Kovacs e hungaro; quem e da Polonia e Ms. Nowak.', 2, 10, 2,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'Where are the students from?',
            'O texto cita Brasil, Mexico e Peru.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Brazil, Mexico and Peru.', true, 1),
      (v_ex, 'Poland and Hungary.',      false, 2),
      (v_ex, 'England and Ireland.',     false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete from the text.',
            'A que horas comecam as aulas?',
            'O texto termina com "Classes start at nine in the morning".', 2, 10, 4,
            '{"template": "Classes start at {{0}} in the morning."}'::jsonb,
            '{"blanks": [{"accepted": ["nine","9"]}]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 11 — Writing
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 11;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Escrever uma apresentacao',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Uma apresentacao curta costuma ter quatro informacoes: nome, de onde voce e, profissao e idade.',
         'Exemplo: "Hello. My name is Marina Costa. I am from Brazil and I am Brazilian. I am a nurse and I am twenty-six years old."',
         'Regras de maiuscula que caem sempre: a primeira letra da frase, o pronome I, nomes de pessoas, paises, nacionalidades, ruas e cidades.',
         'Titulos tambem levam maiuscula e ponto: Mr., Mrs., Ms., Dr.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Add the capital letters.',
            'Rewrite with capitals: "i am italian. i am from rome."',
            'Levam maiuscula: o inicio da frase, o pronome I, a nacionalidade Italian e a cidade Rome.', 2, 10, 1,
            '{"accepted": ["I am Italian. I am from Rome","I am Italian I am from Rome"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Add the capital letters.',
            'Rewrite with capitals: "good afternoon, dr. swain."',
            'Inicio da frase, o titulo Dr. e o sobrenome Swain.', 2, 10, 2,
            '{"accepted": ["Good afternoon, Dr. Swain","Good afternoon Dr. Swain"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct sentence.',
            'Which sentence is written correctly?',
            'Nome proprio, nacionalidade e o pronome I levam maiuscula.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'My name is Frankie and I am Brazilian.', true,  1),
      (v_ex, 'my name is frankie and i am brazilian.', false, 2),
      (v_ex, 'My Name Is Frankie And I Am Brazilian.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a apresentacao.',
            'A ordem natural e sujeito, verbo, complemento.', 2, 10, 4,
            '{"tokens": ["am","I","architect","an"]}'::jsonb,
            '{"order": ["I","am","an","architect"]}'::jsonb);
  end if;

  -- ============================================================
  -- Licao 12 — Unit Review
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 12;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'O que a Unit 1 cobriu',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Cumprimentos e despedidas, apresentacoes, nome e sobrenome, e como soletrar.',
         'Profissoes com a e an, paises e nacionalidades, numeros de 0 a 100.',
         'O verbo to be nas tres formas, na negativa e na pergunta. Os adjetivos possessivos.',
         'Esta revisao mistura tudo. Erre a vontade: o que voce errar vai para a area de Revisao.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Revisao da unidade', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the correct form of to be.',
            'Apresentando uma colega de quarto.',
            'This pede is: "This is my new roommate."', 1, 10, 1,
            '{"template": "This {{0}} my new roommate, Martha."}'::jsonb,
            '{"blanks": [{"accepted": ["is"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'A: Is Mrs. Rossi a doctor? B: No, she ___. She is his secretary.',
            'A negativa curta de she is e she isn''t.', 2, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'isn''t',  true,  1),
      (v_ex, 'aren''t', false, 2),
      (v_ex, 'am not',  false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the possessive adjective.',
            'Falando de Ian e voce.',
            'Ian and I equivale a we, entao o possessivo e our.', 2, 10, 3,
            '{"template": "Ian and I are architects. {{0}} office is on Malcolm Road."}'::jsonb,
            '{"blanks": [{"accepted": ["our"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the question with the answer.',
            'Relacione cada pergunta a resposta natural.',
            'Cada pergunta pede um tipo de informacao diferente.', 2, 10, 4,
            '{"left": ["What is your last name?","Where are you from?","How old are you?","What do you do?"], "right": ["I am from Peru.","I am a chef.","It is Jackson.","I am twenty-two."]}'::jsonb,
            '{"pairs": [[0,2],[1,0],[2,3],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'In English you say "I have twenty years old" to talk about your age.',
            'Falso. Idade em ingles usa o verbo to be: "I am twenty years old."', 2, 10, 5,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a pergunta sobre a profissao.',
            'A pergunta padrao sobre profissao e "What do you do?".', 2, 10, 6,
            '{"tokens": ["do","What","you","do"]}'::jsonb,
            '{"order": ["What","do","you","do"]}'::jsonb);
  end if;

  raise notice 'conteudo da Unit 1 semeado';
end $seed$;
