-- WordSound — conteudo da Unit 2 (Favourites)
--
-- Programa do Modulo 2 do livro: cores, objetos pessoais, familia, tecnologia
-- e aparencia; have got, caso possessivo, adjetivos, this/that e plurais.
-- As frases sao proprias, escritas para esses pontos de ensino.
--
-- As transcricoes de listening vem da secao do livro que acompanha estas
-- mesmas tres faixas. No fim a unidade e publicada.

-- ---------------------------------------------------------------------------
-- transcricoes das tres faixas do Modulo 2
-- ---------------------------------------------------------------------------
update public.media set transcript =
'1.
A: Nice phone, Roy.
B: Thanks. It''s new.
A: My brother has got the same phone. His is white, too.
B: Yeah, black phones are OK, but I think white phones are great.
A: Me too.

2.
A: Is that your tablet, Wendy?
B: Yes, it is.
A: It''s really nice. Is it new?
B: No, not really. It''s old.
A: I want a tablet, too.

3.
A: Hey, look at that laptop!
B: Where?
A: Over there. Look, it''s very cheap.
B: No, it isn''t. Look at the zeros.
A: Oh, yes. It is expensive. Silly me!'
where storage_path like '%module-02-lesson-b%';

update public.media set transcript =
'A: Excuse me, madam. Can you open your bag, please?
B: Of course. Let me see. I''ve got my laptop and my mobile phone.
A: What''s this?
B: That''s my umbrella.
A: Oh, it''s very small.
B: I''ve also got my keys.
A: Are these your sunglasses?
B: Yes, they are.
A: OK, that''s fine. You can put them back now. Have a nice flight!
B: Thanks.'
where storage_path like '%module-02-task-a%';

update public.media set transcript =
'A: Hey, Steve. Take this to Mr Dupont for me, please.
B: Of course, Mr Blake. Umm... Who''s Mr Dupont again?
A: The new French teacher.
B: The new French teacher? Umm... Is he chubby?
A: No, he''s tall and slim.
B: He''s got short dark hair, right?
A: No, he''s got short grey hair.
B: I think I know Mr Dupont. He''s young, right?
A: Well, not that young. He''s middle-aged.
B: OK, I''ll find him.
A: Thanks, Steve.'
where storage_path like '%module-02-lesson-d%';

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
  m1 bigint; m2 bigint; m3 bigint;
begin
  select m.id into v_module
  from public.modules m join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and m.position = 2;
  if v_module is null then raise notice 'Unit 2 ausente'; return; end if;

  select id into m1 from public.media where storage_path like '%module-02-lesson-b%';
  select id into m2 from public.media where storage_path like '%module-02-task-a%';
  select id into m3 from public.media where storage_path like '%module-02-lesson-d%';

  -- ============================================================ 1. Colours & Personal Items
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Cores e objetos',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Para perguntar a cor de algo: "What colour is it?" A resposta e "It is blue."',
         'Em ingles o adjetivo vem antes do substantivo, ao contrario do portugues: a black phone, nao a phone black.',
         'Para perguntar o que e um objeto: "What is this?" para algo perto, "What is that?" para algo longe.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Cores e objetos pessoais',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','black',        'translation','preto',      'example','I have got a black backpack.'),
         jsonb_build_object('word','white',        'translation','branco',     'example','His phone is white.'),
         jsonb_build_object('word','blue',         'translation','azul',       'example','My folder is blue.'),
         jsonb_build_object('word','green',        'translation','verde',      'example','That is a green pencil.'),
         jsonb_build_object('word','red',          'translation','vermelho',   'example','Her umbrella is red.'),
         jsonb_build_object('word','yellow',       'translation','amarelo',    'example','I like yellow notebooks.'),
         jsonb_build_object('word','backpack',     'translation','mochila',    'example','My backpack is very old.'),
         jsonb_build_object('word','notebook',     'translation','caderno',    'example','This is my English notebook.'),
         jsonb_build_object('word','umbrella',     'translation','guarda-chuva','example','That is my umbrella.'),
         jsonb_build_object('word','keys',         'translation','chaves',     'example','I have also got my keys.'),
         jsonb_build_object('word','sunglasses',   'translation','oculos de sol','example','Are these your sunglasses?'),
         jsonb_build_object('word','mobile phone', 'translation','celular',    'example','My mobile phone is black.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which sentence has the correct word order?',
            'Em ingles o adjetivo vem antes do substantivo: a black phone.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'I have got a black phone.', true,  1),
      (v_ex, 'I have got a phone black.', false, 2),
      (v_ex, 'I have got black a phone.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the question.',
            'Pergunte a cor de um objeto.',
            'A pergunta padrao e "What colour is it?".', 1, 10, 2,
            '{"template": "What {{0}} is it?"}'::jsonb,
            '{"blanks": [{"accepted": ["colour","color"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the object with its use.',
            'Relacione cada objeto ao seu uso.',
            'Objetos do dia a dia aparecem em quase toda conversa desta unidade.', 2, 10, 3,
            '{"left": ["umbrella","keys","backpack","sunglasses"], "right": ["for the sun","for the rain","for your books","for your door"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'You point at something far from you and want to know what it is. What do you ask?',
            'Para algo distante usa-se that: "What is that?".', 2, 10, 4,
            '{"accepted": ["what is that","what''s that","what is that?"]}'::jsonb);
  end if;

  -- ============================================================ 2. Family
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'A familia',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Parents significa pai e mae juntos, nao parentes. Para parentes em geral usa-se relatives.',
         'Alguns pares: father e mother, brother e sister, son e daughter, husband e wife, grandfather e grandmother.',
         'Para perguntar sobre irmaos: "Have you got any brothers or sisters?"'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Membros da familia',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','father',      'translation','pai',      'example','My father is a doctor.'),
         jsonb_build_object('word','mother',      'translation','mae',      'example','Her mother is Spanish.'),
         jsonb_build_object('word','parents',     'translation','pai e mae','example','My parents are from Brazil.'),
         jsonb_build_object('word','brother',     'translation','irmao',    'example','I have got one brother.'),
         jsonb_build_object('word','sister',      'translation','irma',     'example','His sister is a nurse.'),
         jsonb_build_object('word','son',         'translation','filho',    'example','Their son is six.'),
         jsonb_build_object('word','daughter',    'translation','filha',    'example','My daughter is a student.'),
         jsonb_build_object('word','husband',     'translation','marido',   'example','Her husband is a chef.'),
         jsonb_build_object('word','wife',        'translation','esposa',   'example','His wife is an architect.'),
         jsonb_build_object('word','grandparents','translation','avos',     'example','My grandparents live in Rome.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'What does "parents" mean in English?',
            'Parents e pai e mae. Parentes em geral sao relatives: e uma pegadinha classica.', 2, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Your father and mother.', true,  1),
      (v_ex, 'All your relatives.',     false, 2),
      (v_ex, 'Your brothers and sisters.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the pairs.',
            'Relacione cada palavra ao seu par.',
            'Os membros da familia costumam vir em pares masculino e feminino.', 1, 10, 2,
            '{"left": ["father","brother","son","husband"], "right": ["daughter","mother","wife","sister"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,0],[3,2]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'A mae do seu pai.',
            'A mae do pai ou da mae e a grandmother.', 2, 10, 3,
            '{"template": "My father''s mother is my {{0}}."}'::jsonb,
            '{"blanks": [{"accepted": ["grandmother","grandma"]}]}'::jsonb);
  end if;

  -- ============================================================ 3. Have Got
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Have got',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Have got expressa posse. Sao duas formas: I/you/we/they have got, e he/she/it has got.',
         'Na fala usa-se a forma curta: I''ve got, he''s got, they''ve got.',
         'A negativa: I haven''t got, she hasn''t got. A pergunta inverte: "Have you got a car?", "Has he got a sister?".',
         'A resposta curta repete o auxiliar: "Yes, I have." ou "No, I haven''t."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with have got or has got.',
            'Terceira pessoa do singular.',
            'Com my brother, que equivale a he, usa-se has got.', 1, 10, 1,
            '{"template": "My brother {{0}} got the same phone."}'::jsonb,
            '{"blanks": [{"accepted": ["has"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with have got or has got.',
            'Primeira pessoa.',
            'Com I usa-se have got, geralmente encurtado para I''ve got.', 1, 10, 2,
            '{"template": "I {{0}} got my laptop and my mobile phone."}'::jsonb,
            '{"blanks": [{"accepted": ["have"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct question.',
            'How do you ask if someone has a sister?',
            'A pergunta inverte o auxiliar: Have you got.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Have you got a sister?', true,  1),
      (v_ex, 'You have got a sister?', false, 2),
      (v_ex, 'Do you have got a sister?', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the negative.',
            'Ela nao tem carro.',
            'Com she a negativa e hasn''t got.', 2, 10, 4,
            '{"template": "She {{0}} got a car."}'::jsonb,
            '{"blanks": [{"accepted": ["hasn''t","has not","hasnt"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a pergunta.',
            'A ordem e auxiliar, sujeito, got, complemento.', 2, 10, 5,
            '{"tokens": ["got","Have","a","you","tablet"]}'::jsonb,
            '{"order": ["Have","you","got","a","tablet"]}'::jsonb);
  end if;

  -- ============================================================ 4. Possessive Case
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'O caso possessivo',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Para dizer de quem e algo, acrescenta-se apostrofo e s ao dono: Ana''s phone, my brother''s car.',
         'A ordem e o contrario do portugues. O celular da Ana vira Ana''s phone: primeiro o dono, depois a coisa.',
         'No plural terminado em s, so o apostrofo: my parents'' house, the students'' books.',
         'Em plurais irregulares volta o apostrofo e s: the children''s room, the women''s bags.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'How do you say "o caderno da Marina" in English?',
            'Primeiro o dono com apostrofo e s, depois a coisa.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Marina''s notebook',   true,  1),
      (v_ex, 'the notebook of Marina', false, 2),
      (v_ex, 'notebook''s Marina',   false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the possessive case.',
            'A casa dos meus pais. Parents ja termina em s.',
            'Plural terminado em s leva so o apostrofo: my parents'' house.', 3, 10, 2,
            '{"template": "This is my parents{{0}} house."}'::jsonb,
            '{"blanks": [{"accepted": ["''"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which is correct for "o quarto das criancas"?',
            'Children e plural irregular, entao volta o apostrofo e s.', 3, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'the children''s room', true,  1),
      (v_ex, 'the childrens'' room', false, 2),
      (v_ex, 'the children room',    false, 3);
  end if;

  -- ============================================================ 5. This / That / These / Those
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Perto e longe, um e muitos',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Sao quatro palavras organizadas por duas ideias: distancia e quantidade.',
         'Perto: this para um, these para varios. Longe: that para um, those para varios.',
         'Exemplos: "This is my pen." "These are my keys." "That is your bag." "Those are their books."',
         'Repare no verbo: this e that pedem is; these e those pedem are.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Varios objetos, perto de voce.',
            'Perto e no plural: these, com o verbo are.', 1, 10, 1,
            '{"template": "{{0}} are my keys."}'::jsonb,
            '{"blanks": [{"accepted": ["these"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Um objeto, longe de voce.',
            'Longe e no singular: that, com o verbo is.', 1, 10, 2,
            '{"template": "{{0}} is my umbrella."}'::jsonb,
            '{"blanks": [{"accepted": ["that"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the situation with the word.',
            'Relacione cada situacao a palavra certa.',
            'Duas ideias se cruzam: perto ou longe, um ou varios.', 2, 10, 3,
            '{"left": ["one object, near","many objects, near","one object, far","many objects, far"], "right": ["those","this","that","these"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Complete: "___ your sunglasses?" (pointing at glasses near you)',
            'Objetos perto e no plural pedem these, e a pergunta usa are.', 2, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Are these',  true,  1),
      (v_ex, 'Is this',    false, 2),
      (v_ex, 'Are those',  false, 3);
  end if;

  -- ============================================================ 6. Plurals
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'O plural',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'A regra geral e acrescentar s: book vira books, pen vira pens.',
         'Palavras terminadas em s, ss, sh, ch, x levam es: bus vira buses, watch vira watches.',
         'Consoante mais y vira ies: city vira cities, family vira families. Mas vogal mais y so leva s: day vira days.',
         'Alguns sao irregulares e precisam ser decorados: man vira men, woman vira women, child vira children, person vira people.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the plural.',
            'child',
            'Child e irregular: o plural e children.', 2, 10, 1,
            '{"accepted": ["children"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the plural.',
            'city',
            'Consoante mais y vira ies: cities.', 2, 10, 2,
            '{"accepted": ["cities"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the plural.',
            'watch',
            'Terminado em ch leva es: watches.', 2, 10, 3,
            '{"accepted": ["watches"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct plural.',
            'What is the plural of "person"?',
            'Person e irregular: o plural mais comum e people.', 3, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'people',  true,  1),
      (v_ex, 'persons', false, 2),
      (v_ex, 'peoples', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'The plural of "day" is "daies".',
            'Falso. So vira ies quando ha consoante antes do y. Em day ha uma vogal, entao e days.', 2, 10, 5,
            '{"value": false}'::jsonb);
  end if;

  -- ============================================================ 7. Appearance
  select id into v_lesson from public.lessons where module_id = v_module and position = 7;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Descrever pessoas',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Para altura e corpo usa-se to be: "He is tall.", "She is slim."',
         'Para cabelo usa-se have got: "He has got short dark hair.", "She has got long blonde hair."',
         'A ordem dos adjetivos do cabelo e comprimento, depois cor: short grey hair, long dark hair.',
         'Para idade aproximada: young, middle-aged, old.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Aparencia',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','tall',        'translation','alto',        'example','He is tall and slim.'),
         jsonb_build_object('word','short',       'translation','baixo, curto','example','She has got short hair.'),
         jsonb_build_object('word','slim',        'translation','magro',       'example','My brother is slim.'),
         jsonb_build_object('word','chubby',      'translation','gordinho',    'example','Is he chubby?'),
         jsonb_build_object('word','dark hair',   'translation','cabelo escuro','example','He has got dark hair.'),
         jsonb_build_object('word','grey hair',   'translation','cabelo grisalho','example','He has got short grey hair.'),
         jsonb_build_object('word','young',       'translation','jovem',       'example','She is very young.'),
         jsonb_build_object('word','middle-aged', 'translation','de meia-idade','example','He is middle-aged.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which verb do you use to talk about someone''s hair?',
            'Cabelo usa have got: "He has got short hair." Altura usa to be.', 2, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'have got', true,  1),
      (v_ex, 'to be',    false, 2),
      (v_ex, 'to do',    false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Ele e alto.',
            'Altura usa o verbo to be: He is tall.', 1, 10, 2,
            '{"template": "He {{0}} tall."}'::jsonb,
            '{"blanks": [{"accepted": ["is","''s"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Descreva o cabelo.',
            'A ordem e comprimento, depois cor, depois hair.', 3, 10, 3,
            '{"tokens": ["hair","short","got","grey","has","He"]}'::jsonb,
            '{"order": ["He","has","got","short","grey","hair"]}'::jsonb);
  end if;

  -- ============================================================ 8. Reading
  select id into v_lesson from public.lessons where module_id = v_module and position = 8;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'READING', 'What is your favourite gadget?',
       jsonb_build_object(
         'text', 'Lucas, 24: My favourite gadget is my tablet. It is not new, but it is light and I read on it every day. My sister has got the same one, in white. Mine is black. Nina, 31: I have got a small camera. It is old and it is not expensive, but the photos are beautiful. My husband thinks a mobile phone is enough. I do not agree. Omar, 19: My laptop, definitely. It is grey and quite heavy, but I have got all my music and my notes on it. My parents'' laptop is faster, but they never lend it to me.',
         'vocabulary', jsonb_build_array(
           jsonb_build_object('word','light','translation','leve'),
           jsonb_build_object('word','heavy','translation','pesado'),
           jsonb_build_object('word','enough','translation','suficiente'),
           jsonb_build_object('word','lend','translation','emprestar')
         )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'What colour is Lucas''s tablet?',
            'O texto diz que a da irma e branca e a dele e preta.', 2, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Black.', true,  1),
      (v_ex, 'White.', false, 2),
      (v_ex, 'Grey.',  false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'Nina''s camera is new and expensive.',
            'Falso. O texto diz que a camera e velha e nao e cara.', 2, 10, 2,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'Why does Omar not use his parents'' laptop?',
            'Ele diz que e mais rapido, mas que eles nunca emprestam.', 3, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'They never lend it to him.', true,  1),
      (v_ex, 'It is too slow.',            false, 2),
      (v_ex, 'It is broken.',              false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete from the text.',
            'O que Nina tem.',
            'O texto comeca com "I have got a small camera".', 2, 10, 4,
            '{"template": "Nina has got a small {{0}}."}'::jsonb,
            '{"blanks": [{"accepted": ["camera"]}]}'::jsonb);
  end if;

  -- ============================================================ 9. Listening
  select id into v_lesson from public.lessons where module_id = v_module and position = 9;
  delete from public.lesson_blocks where lesson_id = v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Antes de ouvir',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Sao tres situacoes: amigos falando de aparelhos, uma revista de bagagem no aeroporto e dois colegas descrevendo um professor.',
       'Na primeira escuta pegue so a ideia. Na segunda, em 0.75x, foque nas cores, nos objetos e nos adjetivos.',
       'A transcricao abre depois que voce responder os exercicios daquela faixa.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position) values
    (v_lesson, 'LISTENING', 'Track 1 — Gadgets',
     jsonb_build_object('instructions', 'Tres conversas curtas sobre celular, tablet e laptop.'), m1, 2),
    (v_lesson, 'LISTENING', 'Track 2 — At the airport',
     jsonb_build_object('instructions', 'Uma passageira abre a bolsa. Anote o que ela tem.'), m2, 3),
    (v_lesson, 'LISTENING', 'Track 3 — The new teacher',
     jsonb_build_object('instructions', 'Dois colegas descrevem o professor novo. Preste atencao no cabelo e na idade.'), m3, 4);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 5) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'What colour is Roy''s phone?',
          'O irmao tem o mesmo modelo em branco, e Roy prefere preto: "black phones are OK".', 3, 10, 1, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Black.', true,  1),
    (v_ex, 'White.', false, 2),
    (v_ex, 'Grey.',  false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 1. True or false?',
          'Wendy''s tablet is new.',
          'Falso. Ela responde "No, not really. It''s old."', 2, 10, 2, m1,
          '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'In the third dialogue, is the laptop cheap or expensive?',
          'Ele acha barato, mas o amigo manda olhar os zeros: e caro.', 3, 10, 3, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Expensive.', true,  1),
    (v_ex, 'Cheap.',     false, 2),
    (v_ex, 'Free.',      false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 2 and complete.',
          'O objeto pequeno que ela mostra.',
          'Ela responde "That''s my umbrella." e o agente comenta que e bem pequeno.', 2, 10, 4, m2,
          '{"template": "That is my {{0}}."}'::jsonb,
          '{"blanks": [{"accepted": ["umbrella"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 2 and choose.',
          'Which items does the woman have in her bag?',
          'Ela cita laptop, celular, guarda-chuva, chaves e oculos de sol.', 2, 10, 5, m2)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'A laptop, a mobile phone, an umbrella, keys and sunglasses.', true,  1),
    (v_ex, 'A tablet, a camera and a notebook.',                          false, 2),
    (v_ex, 'Only a laptop and a book.',                                   false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 3 and complete.',
          'A cor do cabelo do professor.',
          'A resposta corrige a suposicao: "he''s got short grey hair".', 3, 10, 6, m3,
          '{"template": "He has got short {{0}} hair."}'::jsonb,
          '{"blanks": [{"accepted": ["grey","gray"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 3 and choose.',
          'How old is Mr Dupont?',
          'Steve acha que e jovem, mas a resposta e "not that young. He''s middle-aged."', 3, 10, 7, m3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'He is middle-aged.', true,  1),
    (v_ex, 'He is young.',       false, 2),
    (v_ex, 'He is very old.',    false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 3. True or false?',
          'Mr Dupont is chubby.',
          'Falso. A resposta e "No, he''s tall and slim."', 2, 10, 8, m3,
          '{"value": false}'::jsonb);

  -- ============================================================ 10. Writing
  select id into v_lesson from public.lessons where module_id = v_module and position = 10;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Pontuacao e maiusculas',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Toda frase termina em ponto, ponto de interrogacao ou de exclamacao.',
         'A virgula separa itens de uma lista: "I have got a laptop, a phone and my keys." Repare que antes do and costuma nao ter virgula.',
         'O apostrofo tem dois usos nesta unidade: forma curta (it''s = it is) e posse (Ana''s phone). Nao confunda its, possessivo, com it''s, que e it is.',
         'Um paragrafo descrevendo alguem costuma seguir esta ordem: quem e, aparencia, o que tem, e o que voce acha.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct sentence.',
            'Which sentence is punctuated correctly?',
            'A lista leva virgulas entre os itens, e o apostrofo marca a forma curta de it is.', 3, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'I have got a laptop, a phone and my keys. It''s a heavy bag.', true,  1),
      (v_ex, 'I have got a laptop a phone and my keys. Its a heavy bag.',   false, 2),
      (v_ex, 'I have got a laptop, a phone and my keys, Its a heavy bag.',  false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Complete: "The dog is old. ___ name is Rex."',
            'Aqui e posse, entao e its. It''s significaria it is, o que nao cabe antes de name.', 3, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Its',   true,  1),
      (v_ex, 'It''s', false, 2),
      (v_ex, 'It is', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Add the capital letters and the full stop.',
            'Rewrite: "my sister has got a red backpack"',
            'Maiuscula no inicio e ponto no fim.', 2, 10, 3,
            '{"accepted": ["My sister has got a red backpack.","My sister has got a red backpack"]}'::jsonb);
  end if;

  -- ============================================================ 11. Unit Review
  select id into v_lesson from public.lessons where module_id = v_module and position = 11;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'O que a Unit 2 cobriu',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Cores, objetos pessoais, familia, tecnologia e aparencia.',
         'Have got para posse, caso possessivo com apostrofo, this e that, e a formacao do plural.',
         'Esta revisao mistura tudo. O que voce errar vai para a area de Revisao.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Revisao da unidade', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with have got or has got.',
            'Ela tem dois irmaos.',
            'Com she usa-se has got.', 1, 10, 1,
            '{"template": "She {{0}} got two brothers."}'::jsonb,
            '{"blanks": [{"accepted": ["has"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which is correct for "as chaves da minha irma"?',
            'Primeiro o dono com apostrofo e s: my sister''s keys.', 2, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'my sister''s keys', true,  1),
      (v_ex, 'my sisters key',    false, 2),
      (v_ex, 'the keys of my sister', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the plural.',
            'woman',
            'Woman e irregular: o plural e women.', 2, 10, 3,
            '{"accepted": ["women"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the question with the answer.',
            'Relacione cada pergunta a resposta natural.',
            'Cada pergunta desta unidade pede um tipo de informacao.', 2, 10, 4,
            '{"left": ["What colour is it?","Have you got a sister?","Whose bag is this?","Is he tall?"], "right": ["It is Ana''s.","No, he is short.","It is blue.","Yes, I have."]}'::jsonb,
            '{"pairs": [[0,2],[1,3],[2,0],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Varios objetos, longe de voce.',
            'Longe e no plural: those, com o verbo are.', 2, 10, 5,
            '{"template": "{{0}} are their books."}'::jsonb,
            '{"blanks": [{"accepted": ["those"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a frase sobre o cabelo dela.',
            'Comprimento, depois cor, depois hair.', 3, 10, 6,
            '{"tokens": ["long","hair","got","She","dark","has"]}'::jsonb,
            '{"order": ["She","has","got","long","dark","hair"]}'::jsonb);
  end if;

  -- ---------------------------------------------------------------------------
  -- publica a unidade
  -- ---------------------------------------------------------------------------
  update public.lessons set status = 'published' where module_id = v_module;
  update public.modules set status = 'published' where id = v_module;

  raise notice 'Unit 2 semeada e publicada';
end $seed$;
