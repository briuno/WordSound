-- WordSound — apostila da Unit 2 (These are my favorites!)
--
-- As 9 paginas da apostila do aluno viram 5 licoes de pratica, anexadas ao
-- fim da Unit 2 (posicoes 12 a 16). As licoes 1 a 11 continuam sendo o
-- conteudo do livro; estas aqui sao o caderno de exercicios que o acompanha.
--
-- O que nao coube no motor e o porque:
--   * Atividade 1 (arvore genealogica por audio): nao existe faixa de familia
--     entre os tres audios do Modulo 2. A arvore entra como bloco de conteudo
--     e as perguntas que dependiam dela viraram lacunas.
--   * Atividade 6 (palavras cruzadas): sem tipo equivalente. Virou vocabulario
--     de gadgets mais perguntas de resposta curta.
--   * Atividade de video (Clip 2 "How old is he"): o video nao esta no acervo.
--   * "Answer the questions about yourself": aberta, sem gabarito. Entra como
--     bloco de conteudo para o aluno responder em voz alta ou por escrito.
--
-- Os textos de leitura foram reescritos com palavras proprias, mantendo os
-- nomes e os fatos de que as perguntas dependem.

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
begin
  select m.id into v_module
  from public.modules m join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and m.position = 2;
  if v_module is null then raise notice 'Unit 2 ausente'; return; end if;

  if exists (select 1 from public.lessons where module_id = v_module and position = 12) then
    raise notice 'apostila da Unit 2 ja carregada';
    return;
  end if;

  -- ========================================================================
  -- 12. Workbook 1 — Family & have/has        (apostila, atividades 1, 2 e 3)
  -- ========================================================================
  insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
  values (v_module, 'Workbook 1 — Family & have/has',
          'Praticar os membros da familia e a escolha entre have e has.', 12, 50, 12, 'published')
  returning id into v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'A familia da Annie',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Sam e Linda sao os avos. Sam e o grandfather, Linda e a grandmother.',
       'Os filhos deles sao Larry e Kirsten, casados. Os dois sao police officers e sao os parents das criancas.',
       'Larry e Kirsten tem tres filhos: Freddie, Annie e Alex. Freddie e Alex sao students.',
       'Annie e casada com Dave, que e doctor. Os dois tem uma filha, Beth, de 8 anos.',
       'Nas frases abaixo quem fala e a Annie. Leia a arvore de novo antes de completar.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with words for family members.',
          'A Annie apresenta os irmaos e os pais.',
          'Freddie e Alex sao brothers dela; Larry e Kirsten sao os parents; Sam e o grandfather.', 2, 10, 1,
          '{"template": "Freddie and Alex are my {{0}}. They are students. My {{1}}, Larry and Kirsten, are police officers. My {{2}}''s name is Sam."}'::jsonb,
          '{"blanks": [{"accepted": ["brothers"]}, {"accepted": ["parents"]}, {"accepted": ["grandfather"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with words for family members.',
          'A Annie fala da avo, do marido e da filha.',
          'Linda e a grandmother, Dave e o husband e Beth e a daughter.', 2, 10, 2,
          '{"template": "My {{0}}''s name is Linda. I''m married. My {{1}}''s name is Dave and he''s a doctor. We have a {{2}}. Her name is Beth and she''s 8 years old."}'::jsonb,
          '{"blanks": [{"accepted": ["grandmother"]}, {"accepted": ["husband"]}, {"accepted": ["daughter"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Look at the family tree and choose.',
          'Who is Beth''s grandmother?',
          'Beth e filha da Annie, e a mae da Annie e Kirsten. Linda e a bisavo de Beth.', 3, 10, 3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Kirsten.', true,  1),
    (v_ex, 'Linda.',   false, 2),
    (v_ex, 'Annie.',   false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with have or has.',
          'Sujeito I.',
          'Com I o verbo e have.', 1, 10, 4,
          '{"template": "I {{0}} three sisters, Helen, Debbie and Joanna."}'::jsonb,
          '{"blanks": [{"accepted": ["have"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with have or has.',
          'Sujeito We.',
          'Com we o verbo e have.', 1, 10, 5,
          '{"template": "We {{0}} a new French teacher, Miss Bernard."}'::jsonb,
          '{"blanks": [{"accepted": ["have"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with have or has.',
          'Sujeito My brother.',
          'My brother e terceira pessoa do singular, entao has.', 2, 10, 6,
          '{"template": "My brother {{0}} two notebooks. They are black."}'::jsonb,
          '{"blanks": [{"accepted": ["has"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with have or has.',
          'Sujeito Derek.',
          'Derek e uma pessoa so, entao has.', 2, 10, 7,
          '{"template": "Derek {{0}} two brothers. He isn''t an only child."}'::jsonb,
          '{"blanks": [{"accepted": ["has"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
          'Complete: "Penny ___ a brother. He''s a chef and he ___ a wife and two children."',
          'Penny e he sao terceira pessoa do singular: has nos dois casos.', 2, 10, 8)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'has / has',   true,  1),
    (v_ex, 'have / has',  false, 2),
    (v_ex, 'has / have',  false, 3);

  -- ========================================================================
  -- 13. Workbook 2 — Possessive & gadgets     (apostila, atividades 4, 5 e 6)
  -- ========================================================================
  insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
  values (v_module, 'Workbook 2 — Possessive & gadgets',
          'Montar frases com apostrofo e nomear os objetos pessoais.', 12, 50, 13, 'published')
  returning id into v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Do dono para a coisa',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'O modelo da apostila e "Rick / notebook / orange" virando "Rick''s notebook is orange."',
       'A ordem e sempre dono + apostrofo + s, depois a coisa. Primeiro Rick''s, depois notebook.',
       'O verbo concorda com a coisa, nao com o dono. Um objeto leva is: "Rick''s notebook is orange." Varios objetos levam are: "Matt''s pens are white."',
       'A cor vem depois do verbo, nunca antes do substantivo nesta estrutura.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'VOCABULARY', 'Gadgets and personal items',
     jsonb_build_object('items', jsonb_build_array(
       jsonb_build_object('word','wallet',        'translation','carteira',       'example','My wallet is in my backpack.'),
       jsonb_build_object('word','laptop',        'translation','notebook',       'example','I have a new laptop.'),
       jsonb_build_object('word','camera',        'translation','camera',         'example','My camera has 24 megapixels.'),
       jsonb_build_object('word','headphones',    'translation','fones de ouvido','example','Annie''s headphones are expensive.'),
       jsonb_build_object('word','keyboard',      'translation','teclado',        'example','This keyboard is $100.'),
       jsonb_build_object('word','smartphone',    'translation','smartphone',     'example','Our smartphone is small.'),
       jsonb_build_object('word','remote control','translation','controle remoto','example','That is a remote control.'),
       jsonb_build_object('word','DVD',           'translation','DVD',            'example','This DVD is expensive.'),
       jsonb_build_object('word','ID card',       'translation','carteira de identidade','example','This student ID is different.'),
       jsonb_build_object('word','sunglasses',    'translation','oculos de sol',  'example','Whose sunglasses are these?')
     )), 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write a complete sentence. Model: Rick / notebook / orange = Rick''s notebook is orange.',
          'Matt / pens / white',
          'Pens e plural, entao o verbo e are: Matt''s pens are white.', 2, 10, 1,
          '{"accepted": ["Matt''s pens are white."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write a complete sentence. Model: Rick / notebook / orange = Rick''s notebook is orange.',
          'Jamie / backpack / purple',
          'Um objeto so, entao is: Jamie''s backpack is purple.', 2, 10, 2,
          '{"accepted": ["Jamie''s backpack is purple."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write a complete sentence. Model: Rick / notebook / orange = Rick''s notebook is orange.',
          'Rick / folder / yellow',
          'Um objeto so, entao is: Rick''s folder is yellow.', 2, 10, 3,
          '{"accepted": ["Rick''s folder is yellow."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write a complete sentence. Model: Rick / notebook / orange = Rick''s notebook is orange.',
          'Jamie / pens / green',
          'Pens e plural, entao are: Jamie''s pens are green.', 2, 10, 4,
          '{"accepted": ["Jamie''s pens are green."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct sentence.',
          'Rick / cell phone / black',
          'Um aparelho so, entao is, e a cor vem depois do verbo.', 2, 10, 5)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Rick''s cell phone is black.',  true,  1),
    (v_ex, 'Rick''s cell phone are black.', false, 2),
    (v_ex, 'Rick is cell phone black.',     false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Match the question with the answer.',
          'Relacione cada pergunta a resposta certa.',
          'Repare em who''s, whose e what color: cada uma pede um tipo de resposta.', 3, 10, 6,
          '{"left": ["What''s your favorite color?","What color is Stacy''s backpack?","Who''s this?","Do you have any brothers or sisters?","What''s your name again?","Are you single?"], "right": ["My brother.","No, I''m married.","Black. My notebook is black, too.","I''m Sam Davis.","No, I''m an only child.","Yellow. It''s her favorite color."]}'::jsonb,
          '{"pairs": [[0,2],[1,5],[2,0],[3,4],[4,3],[5,1]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write the word in English.',
          'You keep your money and your cards in it.',
          'E a carteira: wallet.', 2, 10, 7,
          '{"accepted": ["wallet","a wallet"]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Write the word in English.',
          'You type on it and it is connected to a computer.',
          'E o teclado: keyboard.', 2, 10, 8,
          '{"accepted": ["keyboard","a keyboard"]}'::jsonb);

  -- ========================================================================
  -- 14. Workbook 3 — This/That & plurals  (apostila, atividades 7, 8, 9 e 10)
  -- ========================================================================
  insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
  values (v_module, 'Workbook 3 — This/That & plurals',
          'Escolher o demonstrativo certo e passar frases do singular ao plural.', 15, 50, 14, 'published')
  returning id into v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'GRAMMAR', 'Perto, longe, um, varios',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Sao duas perguntas de uma vez: esta perto ou longe? e um ou varios?',
       'Perto e um: this, com o verbo is. Perto e varios: these, com are.',
       'Longe e um: that, com is. Longe e varios: those, com are.',
       'A pergunta segue a mesma logica: "What is this?", "What are those?". O verbo vem antes do demonstrativo na pergunta e depois dele na resposta.',
       'Ao passar para o plural muda tudo junto: demonstrativo, verbo e substantivo. "That watch is expensive." vira "Those watches are expensive."'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the dialogue. The object is far and there is only one.',
          'Longe e um objeto so.',
          'Longe e singular pede that, com o verbo is.', 2, 10, 1,
          '{"template": "A: What {{0}} that? B: {{1}} is a window."}'::jsonb,
          '{"blanks": [{"accepted": ["is"]}, {"accepted": ["That"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the dialogue. The objects are near.',
          'Perto e varios objetos.',
          'Perto e plural pede these, com o verbo are.', 2, 10, 2,
          '{"template": "A: What {{0}} these? B: {{1}} are lipsticks."}'::jsonb,
          '{"blanks": [{"accepted": ["are"]}, {"accepted": ["These"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the dialogue. The objects are far.',
          'Longe e varios objetos.',
          'Longe e plural pede those, com o verbo are.', 2, 10, 3,
          '{"template": "A: What {{0}} those? B: {{1}} are pigeons."}'::jsonb,
          '{"blanks": [{"accepted": ["are"]}, {"accepted": ["Those"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Change the sentence into the singular form.',
          'These women are lawyers.',
          'Women vira woman, are vira is e lawyers vira a lawyer, com artigo.', 3, 10, 4,
          '{"accepted": ["This woman is a lawyer."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Change the sentence into the singular form.',
          'These mice are under the sofa.',
          'Mice e o plural irregular de mouse.', 3, 10, 5,
          '{"accepted": ["This mouse is under the sofa."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Change the sentence into the singular form.',
          'Those people aren''t very kind.',
          'People e o plural de person. No singular a negativa vira isn''t.', 3, 10, 6)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'That person isn''t very kind.',  true,  1),
    (v_ex, 'That people isn''t very kind.',  false, 2),
    (v_ex, 'This peoples aren''t very kind.', false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Change the sentence into the plural form.',
          'That child is my baby.',
          'Child vira children, e baby vira babies porque consoante mais y faz ies.', 3, 10, 7,
          '{"accepted": ["Those children are my babies."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Change the sentence into the plural form.',
          'This bus is very big.',
          'Terminado em s leva es: buses.', 2, 10, 8,
          '{"accepted": ["These buses are very big."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Complete the second sentence so that it has the same meaning as the first: "I have a new laptop."',
          'My ______',
          'Sai o have got e entra o adjetivo depois do verbo: My laptop is new.', 3, 10, 9,
          '{"accepted": ["My laptop is new."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the sentence with the same meaning as "Frank''s backpack is blue."',
          'Frank ______',
          'O caso possessivo vira have got, e a cor passa a vir antes do substantivo.', 3, 10, 10)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Frank has a blue backpack.',   true,  1),
    (v_ex, 'Frank has a backpack blue.',   false, 2),
    (v_ex, 'Frank is a blue backpack.',    false, 3);

  -- ========================================================================
  -- 15. Workbook 4 — Dialogues & appearance (apostila, atividades 11 a 14)
  -- ========================================================================
  insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
  values (v_module, 'Workbook 4 — Dialogues & appearance',
          'Ordenar dialogos, completar falas e descrever a aparencia.', 15, 50, 15, 'published')
  returning id into v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'VOCABULARY', 'Describing people',
     jsonb_build_object('items', jsonb_build_array(
       jsonb_build_object('word','tall',          'translation','alto',           'example','She is tall and slim.'),
       jsonb_build_object('word','short',         'translation','baixo',          'example','Anny is short and slim.'),
       jsonb_build_object('word','medium-height', 'translation','altura media',   'example','No, she isn''t. She''s medium-height.'),
       jsonb_build_object('word','slim',          'translation','magro',          'example','Kelly is tall and slim.'),
       jsonb_build_object('word','overweight',    'translation','acima do peso',  'example','He is an overweight man.'),
       jsonb_build_object('word','chubby',        'translation','gordinho',       'example','Leo is tall and chubby.'),
       jsonb_build_object('word','young',         'translation','jovem',          'example','Really? He''s very young.'),
       jsonb_build_object('word','old',           'translation','velho',          'example','That is an old man.'),
       jsonb_build_object('word','middle-aged',   'translation','de meia-idade',  'example','Are your parents middle-aged?'),
       jsonb_build_object('word','blond',         'translation','loiro',          'example','Amy has medium-length blond hair.'),
       jsonb_build_object('word','dark',          'translation','escuro',         'example','She has long dark hair.'),
       jsonb_build_object('word','good-looking',  'translation','bonito',         'example','Is Mary good-looking?')
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'ORDER_SENTENCES', 'Put the dialogue in the correct order.',
          'Dois amigos falam de um celular.',
          'Um mostra o aparelho, o outro elogia, pergunta o preco e recebe a resposta.', 3, 10, 1,
          '{"tokens": ["I like it. Is it expensive?","Look at this cell phone. It''s great!","Well, it isn''t very cheap. It''s $2,000.","Yes, it''s nice. It has a big screen and it''s a nice color."]}'::jsonb,
          '{"order": ["Look at this cell phone. It''s great!","Yes, it''s nice. It has a big screen and it''s a nice color.","I like it. Is it expensive?","Well, it isn''t very cheap. It''s $2,000."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'ORDER_SENTENCES', 'Put the dialogue in the correct order.',
          'Dois amigos falam de um tablet.',
          'A pergunta abre, a confirmacao vem depois, entao o dono explica o que tem nele e o outro reage.', 3, 10, 2,
          '{"tokens": ["Really? I think it''s awesome.","I have lots of games, books and pictures on it. It''s cool!","Is this your tablet?","Yes, it is. I have it with me all the time."]}'::jsonb,
          '{"order": ["Is this your tablet?","Yes, it is. I have it with me all the time.","I have lots of games, books and pictures on it. It''s cool!","Really? I think it''s awesome."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'ORDER_SENTENCES', 'Put the dialogue in the correct order.',
          'Dois amigos falam do gadget preferido.',
          'A pergunta geral vem primeiro, depois a resposta, e so entao a conversa desce para a camera.', 3, 10, 3,
          '{"tokens": ["Yes. 24 megapixels","Is this your camera?","My camera, of course.","Nice. I have a camera, too, but it''s old.","What''s your favorite gadget?"]}'::jsonb,
          '{"order": ["What''s your favorite gadget?","My camera, of course.","Is this your camera?","Yes. 24 megapixels","Nice. I have a camera, too, but it''s old."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Complete the dialogue between Peter and Tony. Match each gap with the right sentence.',
          'Use a fala seguinte para descobrir o que falta.',
          'Um objeto perto pede this, varios pedem those, e quem nao sabe de quem e responde I don''t know.', 3, 10, 4,
          '{"left": ["A: ___ / B: Oh, it''s my new tablet.","A: Wow, it''s nice. ___ Are they headphones?","A: Whose are they? / B: ___"], "right": ["Whose sunglasses are these?","What are those?","Who''s Tiffany?","You''re right.","I don''t know.","What''s this?"]}'::jsonb,
          '{"pairs": [[0,5],[1,1],[2,4]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Complete the dialogue between Janet and Rita. Match each gap with the right sentence.',
          'Use a resposta seguinte para descobrir a pergunta que falta.',
          'A resposta "My sister" so cabe depois de uma pergunta sobre quem e Tiffany.', 3, 10, 5,
          '{"left": ["A: ___ / B: I think they''re Tiffany''s.","A: ___ / B: My sister.","B: Yeah, they''re cool. ___"], "right": ["Whose sunglasses are these?","What are those?","Who''s Tiffany?","You''re right.","I don''t know.","What''s this?"]}'::jsonb,
          '{"pairs": [[0,0],[1,2],[2,3]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Match the questions with the answers.',
          'Relacione cada pergunta sobre aparencia e idade a resposta certa.',
          'Repare que duas perguntas recebem negativa com correcao: "No, she isn''t. She''s..."', 3, 10, 6,
          '{"left": ["Is Jane in her 20s?","Who''s Mrs. Paterson?","Is Helen tall?","Are your parents middle-aged?","How old is your sister?","Is Mary good-looking?"], "right": ["No, she isn''t. She''s medium-height.","That woman over there.","Yes, they are.","She''s in her 20s.","Oh, yes. She has beautiful, long hair.","No, she isn''t. She''s 32."]}'::jsonb,
          '{"pairs": [[0,5],[1,1],[2,0],[3,2],[4,3],[5,4]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the opposite.',
          'The opposite of "a slim man" is ___',
          'O contrario de magro e acima do peso: an overweight man.', 2, 10, 7)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'an overweight man', true,  1),
    (v_ex, 'a short man',       false, 2),
    (v_ex, 'an old man',        false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the description.',
          'Cabelo comprido e escuro.',
          'A ordem e comprimento, depois cor, depois hair: long dark hair.', 2, 10, 8,
          '{"template": "She is tall and slim and she has long {{0}} hair and blue eyes."}'::jsonb,
          '{"blanks": [{"accepted": ["dark"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Add punctuation and capitals. Choose the correct version.',
          'how are you kate i''m fine i have a new neighbor and her name is kate too',
          'Nome proprio e inicio de frase levam maiuscula, a pergunta leva interrogacao e o vocativo Kate vem entre virgulas.', 3, 10, 9)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'How are you, Kate? I''m fine. I have a new neighbor and her name is Kate, too.', true,  1),
    (v_ex, 'How are you Kate. I''m fine, I have a new neighbor and her name is kate too.',  false, 2),
    (v_ex, 'how are you, Kate? i''m fine. I have a new Neighbor and her name is Kate too.', false, 3);

  -- ========================================================================
  -- 16. Workbook 5 — Unit 2 Review            (apostila, secao UNIT 2 - REVIEW)
  -- ========================================================================
  insert into public.lessons (module_id, title, objective, estimated_minutes, xp_reward, position, status)
  values (v_module, 'Workbook 5 — Unit 2 Review',
          'Fechar a apostila revisando vocabulario, gramatica e leitura.', 18, 100, 16, 'published')
  returning id into v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'READING', 'Three people, three families',
     jsonb_build_object(
       'text', 'Gary: I''m Gary and I''m married. My wife is Heather and she is in her 30s. We have two children, a son called Leo and a daughter called Anny. Leo is tall and chubby, and Anny is short and slim. Henry: My name is Henry. I''m in my 20s, I''m single and I work as an English teacher. I have two brothers, Jake and Mike, and they are both college students. My hair is dark and my eyes are brown, but my two brothers have blond hair and blue eyes. Carrie: Hi, I''m Carrie. My sister Kelly is also my best friend. She has green eyes and dark hair. I''m short, but Kelly is tall and slim. She is a beautiful girl.',
       'vocabulary', jsonb_build_array(
         jsonb_build_object('word','single','translation','solteiro'),
         jsonb_build_object('word','chubby','translation','gordinho'),
         jsonb_build_object('word','college student','translation','universitario'),
         jsonb_build_object('word','best friend','translation','melhor amigo')
       )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Slang — outras formas de cumprimentar',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'No lugar de Hello, no dia a dia se diz Hi!, Hey!, Hi there! ou Hey there!',
       'No lugar de How are you?, se diz How are you doing?, How''s it going?, What''s up? ou How''ve you been?',
       'Sao formas informais, para amigos e colegas. Numa entrevista ou com um cliente, prefira Hello e How are you?'
     )), 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Answer about yourself',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Estas perguntas nao tem gabarito. Responda em voz alta, e depois escreva as respostas no caderno.',
       'Do you have any brothers or sisters?',
       'What''s your favorite gadget? What color is it?',
       'Are you tall, medium-height or short? Is your hair blond or dark?',
       'Are you married?'
     )), 3);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Revisao', '{}'::jsonb, 4) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'CATEGORY_SORT', 'Put the words in the correct category.',
          'Classifique as 16 palavras nas quatro categorias da unidade.',
          'Quatro palavras em cada categoria: cores, familia, objetos pessoais e aparencia.', 3, 20, 1,
          '{"left": ["Yellow","overweight","ID card","sister","pink","short","sunglasses","grandfather","brush","handsome","white","slim","wife","purple","son","wallet"], "right": ["Colors","Family members","Personal items","Adjectives describing appearance"]}'::jsonb,
          '{"pairs": [[0,0],[1,3],[2,2],[3,1],[4,0],[5,3],[6,2],[7,1],[8,2],[9,3],[10,0],[11,3],[12,1],[13,0],[14,1],[15,2]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with: gadget / husband / daughter / ticket.',
          'Objetos e familia.',
          'Gadget e um aparelho, husband e o marido, daughter e a filha e ticket e a passagem.', 3, 10, 2,
          '{"template": "What''s that {{0}}? Is it a tablet? This is Alice and her {{1}} Darren. They have a baby {{2}}. The bus {{3}} to Seattle is expensive. It''s $50, I think."}'::jsonb,
          '{"blanks": [{"accepted": ["gadget"]}, {"accepted": ["husband"]}, {"accepted": ["daughter"]}, {"accepted": ["ticket"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete with: chewing / medium-length / cheap / awesome.',
          'Adjetivos e expressoes.',
          'Chewing gum e chiclete, medium-length e o cabelo de comprimento medio, cheap e barato e awesome e sensacional.', 3, 10, 3,
          '{"template": "This {{0}} gum is nice. Amy has {{1}} blond hair. This keyboard is $100. It isn''t {{2}}. Whose smartphone is this? It''s {{3}}!"}'::jsonb,
          '{"blanks": [{"accepted": ["chewing"]}, {"accepted": ["medium-length","medium length"]}, {"accepted": ["cheap"]}, {"accepted": ["awesome"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose a or b.',
          '___ is this camera? Is it Mike''s?',
          'Whose pergunta de quem e a coisa. Who''s e a forma curta de who is.', 3, 10, 4)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Whose', true,  1),
    (v_ex, 'Who''s', false, 2);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose a or b.',
          'My ___ new school is very big.',
          'E a escola do irmao, entao caso possessivo com apostrofo: brother''s.', 3, 10, 5)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'brother''s', true,  1),
    (v_ex, 'brothers',   false, 2);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose a or b.',
          'A: Look! Over there. Is ___ your grandmother? B: Yes, it is.',
          'Over there indica distancia, entao that.', 3, 10, 6)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'that', true,  1),
    (v_ex, 'this', false, 2);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose a or b.',
          'My new MP4 player ___ lots of songs on it.',
          'MP4 player e terceira pessoa do singular, entao has.', 3, 10, 7)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'has',  true,  1),
    (v_ex, 'have', false, 2);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Rewrite the sentence in the plural.',
          'This child has dark hair.',
          'Child vira children e has vira have.', 3, 10, 8,
          '{"accepted": ["These children have dark hair."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Rewrite the sentence in the plural.',
          'That woman has a blue backpack.',
          'Woman vira women, has vira have e o objeto tambem vai para o plural.', 3, 10, 9,
          '{"accepted": ["Those women have blue backpacks."]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Complete the dialogue about the new neighbor. Match each gap with the right sentence.',
          'Use a fala seguinte para descobrir o que falta.',
          'A resposta "Mark Stevens" so cabe depois de uma pergunta sobre o nome.', 3, 10, 10,
          '{"left": ["A: ___ Is it your new neighbor?","A: ___ / B: Mark Stevens. He''s a doctor.","A: Really? He''s very young. / B: ___","A: Is he married? / B: ___"], "right": ["What''s his name again?","I''m an only child.","I don''t know.","What''s that?","I like it.","He''s in his 30s.","Who''s that?"]}'::jsonb,
          '{"pairs": [[0,6],[1,0],[2,5],[3,2]]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Read the three profiles and complete.',
          'Quem sao as irmas e quem e o marido da Heather.',
          'Carrie diz que Kelly e a irma e a melhor amiga; Gary e casado com Heather.', 3, 10, 11,
          '{"template": "{{0}} and Kelly are sisters and best friends. Gary is Heather''s {{1}}."}'::jsonb,
          '{"blanks": [{"accepted": ["Carrie"]}, {"accepted": ["husband"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Read the three profiles and complete.',
          'A aparencia do Henry e a profissao dele.',
          'Henry diz que tem cabelo escuro e olhos castanhos, e que da aula de ingles.', 3, 10, 12,
          '{"template": "Henry has {{0}} hair and {{1}} eyes. Henry is an English {{2}}."}'::jsonb,
          '{"blanks": [{"accepted": ["dark"]}, {"accepted": ["brown"]}, {"accepted": ["teacher"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'READING_QUESTION', 'Answer about the three profiles.',
          'What color are Mike''s eyes?',
          'Mike e irmao do Henry, e o texto diz que os dois irmaos tem cabelo loiro e olhos azuis.', 3, 10, 13)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Blue.',  true,  1),
    (v_ex, 'Brown.', false, 2),
    (v_ex, 'Green.', false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'READING_QUESTION', 'Answer about the three profiles.',
          'Who is Anny''s brother?',
          'Gary e Heather tem dois filhos: Leo e Anny. Entao Leo e o irmao da Anny.', 2, 10, 14)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Leo.',  true,  1),
    (v_ex, 'Jake.', false, 2),
    (v_ex, 'Mike.', false, 3);

  raise notice 'apostila da Unit 2 carregada nas licoes 12 a 16';
end $seed$;
