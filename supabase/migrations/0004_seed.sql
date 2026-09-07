-- WordSound — conteudo demo original (spec 66: nada copiado de material protegido)
-- Formatos de answer_key por tipo:
--   MULTIPLE_CHOICE / LISTENING_MULTIPLE_CHOICE / READING_QUESTION -> exercise_options.is_correct
--   TRUE_FALSE   answer_key {"value": true}                 resposta {"value": bool}
--   FILL_BLANK   prompt {"template":"... {{0}} ..."}        answer_key {"blanks":[{"accepted":[...]}]}
--                                                            resposta {"values":["..."]}
--   SHORT_ANSWER answer_key {"accepted":[...]}              resposta {"value":"..."}
--   ORDER_WORDS  prompt {"tokens":[...]}                    answer_key {"order":[...]}
--                                                            resposta {"order":[...]}
--   MATCHING     prompt {"left":[...],"right":[...]}        answer_key {"pairs":[[l,r],...]}
--                                                            resposta {"pairs":[[l,r],...]}

insert into public.app_settings (key, value) values
  ('xp', '{"correct_first_try":10,"correct_retry":5,"lesson_complete":50,"module_review":100}'::jsonb)
on conflict (key) do nothing;

insert into public.achievements (code, title, description, icon, kind, threshold, position) values
  ('first_lesson',   'First Lesson',      'Conclua sua primeira licao.',        'sparkles', 'lessons',   1,   1),
  ('streak_7',       '7 Day Streak',      'Estude sete dias seguidos.',         'flame',    'streak',    7,   2),
  ('exercises_100',  '100 Exercises',     'Responda cem exercicios.',           'target',   'exercises', 100, 3),
  ('first_module',   'First Unit',        'Conclua uma unidade inteira.',       'trophy',   'modules',   1,   4),
  ('xp_500',         '500 XP',            'Acumule 500 XP.',                    'zap',      'xp',        500, 5),
  ('xp_1000',        '1000 XP',           'Acumule 1000 XP.',                   'crown',    'xp',        1000,6)
on conflict (code) do nothing;

do $seed$
declare
  v_course bigint;
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
begin
  if exists (select 1 from public.courses where slug = 'english-basics') then
    raise notice 'seed ja aplicado';
    return;
  end if;

  insert into public.courses (slug, title, description, level, status, position)
  values ('english-basics', 'English Basics',
          'Comece do zero e construa uma base solida de ingles com leitura, audio e pratica guiada.',
          'A1', 'published', 1)
  returning id into v_course;

  insert into public.modules (course_id, title, description, position, status)
  values (v_course, 'Unit 1 — Hello There!',
          'Primeiros contatos: sala de aula, cumprimentos, dados pessoais e o verbo to be.',
          1, 'published')
  returning id into v_module;

  -- ---------------- as 12 licoes da unidade ----------------
  insert into public.lessons (module_id, title, description, objective, estimated_minutes, xp_reward, position, status)
  values
    (v_module,'Classroom Language','Frases do dia a dia na sala de aula.','Pedir ajuda e entender instrucoes basicas.',8,50,1,'published'),
    (v_module,'Greetings & Introductions','Cumprimentar e se apresentar.','Iniciar uma conversa e dizer seu nome.',10,50,2,'published'),
    (v_module,'Personal Information','Nome, idade, telefone e email.','Dar e pedir informacoes pessoais.',10,50,3,'published'),
    (v_module,'Jobs & Occupations','Profissoes comuns.','Dizer qual e a sua profissao.',10,50,4,'published'),
    (v_module,'Countries & Nationalities','Paises e nacionalidades.','Dizer de onde voce e.',10,50,5,'published'),
    (v_module,'Numbers 0–100','Numeros de zero a cem.','Falar precos, idades e telefones.',8,50,6,'published'),
    (v_module,'Verb To Be','Am, is e are.','Usar o verbo to be em frases simples.',12,50,7,'published'),
    (v_module,'Possessive Adjectives','My, your, his, her.','Indicar posse.',10,50,8,'published'),
    (v_module,'Reading','Leitura guiada.','Entender um texto curto.',12,50,9,'published'),
    (v_module,'Listening','Compreensao auditiva.','Entender falas curtas.',12,50,10,'published'),
    (v_module,'Writing','Escrita simples.','Escrever uma apresentacao curta.',12,50,11,'published'),
    (v_module,'Unit Review','Revisao da unidade.','Consolidar tudo da Unit 1.',15,100,12,'published');

  -- ============================================================
  -- Licao 1 — Classroom Language
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Na sala de aula',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Na sala de aula voce vai ouvir e repetir algumas frases o tempo todo. Elas sao curtas e muito uteis.',
       'Para pedir que alguem repita, diga "Can you repeat, please?". Para pedir ajuda, "Can you help me?".',
       'Quando nao entender uma palavra, pergunte "What does it mean?". Quando nao souber escrever, "How do you spell it?".'
     )), 1)
  returning id into v_block;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'VOCABULARY', 'Palavras da aula',
     jsonb_build_object('items', jsonb_build_array(
       jsonb_build_object('word','open',     'translation','abrir',      'example','Open your book, please.'),
       jsonb_build_object('word','close',    'translation','fechar',     'example','Close the door, please.'),
       jsonb_build_object('word','repeat',   'translation','repetir',    'example','Can you repeat, please?'),
       jsonb_build_object('word','listen',   'translation','ouvir',      'example','Listen to the audio.'),
       jsonb_build_object('word','answer',   'translation','responder',  'example','Answer the question.'),
       jsonb_build_object('word','question', 'translation','pergunta',   'example','I have a question.'),
       jsonb_build_object('word','teacher',  'translation','professor',  'example','The teacher is here.'),
       jsonb_build_object('word','homework', 'translation','dever de casa','example','Do your homework.')
     )), 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3)
  returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
          'You did not hear the teacher. What do you say?',
          '"Can you repeat, please?" e o pedido natural para ouvir de novo.', 1, 10, 1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Can you repeat, please?', true,  1),
    (v_ex, 'Close the door, please.', false, 2),
    (v_ex, 'Do your homework.',       false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'TRUE_FALSE', 'True or false?',
          '"How do you spell it?" is used to ask about the meaning of a word.',
          'Falso. "How do you spell it?" pergunta a grafia. O significado se pergunta com "What does it mean?".',
          1, 10, 2, '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the sentence.',
          'Pedido educado para o colega falar de novo.',
          'O verbo repeat vem depois de can you.', 1, 10, 3,
          '{"template": "Can you {{0}}, please?"}'::jsonb,
          '{"blanks": [{"accepted": ["repeat"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'MATCHING', 'Match the words with the translations.',
          'Relacione cada palavra ao seu significado.',
          'Palavras de sala de aula aparecem em quase toda licao.', 2, 10, 4,
          '{"left": ["teacher","homework","question","listen"], "right": ["ouvir","professor","pergunta","dever de casa"]}'::jsonb,
          '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

  -- ============================================================
  -- Licao 2 — Greetings & Introductions
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Cumprimentos',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Use "Good morning" pela manha, "Good afternoon" a tarde e "Good evening" a noite.',
       '"Hello" e "Hi" servem a qualquer hora. "Hi" e mais informal.',
       'Para se apresentar: "My name is Ana." ou "I am Ana." Para perguntar: "What is your name?".'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'VOCABULARY', 'Vocabulario',
     jsonb_build_object('items', jsonb_build_array(
       jsonb_build_object('word','hello',    'translation','ola',            'example','Hello! How are you?'),
       jsonb_build_object('word','goodbye',  'translation','tchau',          'example','Goodbye! See you tomorrow.'),
       jsonb_build_object('word','morning',  'translation','manha',          'example','Good morning, Ana.'),
       jsonb_build_object('word','evening',  'translation','noite',          'example','Good evening, everyone.'),
       jsonb_build_object('word','nice',     'translation','bom, agradavel', 'example','Nice to meet you.'),
       jsonb_build_object('word','name',     'translation','nome',           'example','My name is Paulo.')
     )), 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3)
  returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
          'It is 8 a.m. How do you greet someone?',
          'Good morning vai do inicio do dia ate por volta do meio-dia.', 1, 10, 1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Good morning', true,  1),
    (v_ex, 'Good evening', false, 2),
    (v_ex, 'Good night',   false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
          'Monte a frase de apresentacao.',
          'A ordem natural e sujeito, verbo e complemento: My name is Ana.', 2, 10, 2,
          '{"tokens": ["is","My","Ana","name"]}'::jsonb,
          '{"order": ["My","name","is","Ana"]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'SHORT_ANSWER', 'Answer in English.',
          'Someone says "Nice to meet you." What is a natural reply?',
          'A resposta mais comum e "Nice to meet you, too."', 2, 10, 3,
          '{"accepted": ["nice to meet you too","nice to meet you, too","you too","nice to meet you as well"]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the question.',
          'Pergunte o nome de alguem.',
          'What is your name? e a forma padrao de perguntar o nome.', 1, 10, 4,
          '{"template": "What is {{0}} name?"}'::jsonb,
          '{"blanks": [{"accepted": ["your"]}]}'::jsonb);

  -- ============================================================
  -- Licao 3 — Personal Information
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Dados pessoais',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Para falar da idade use o verbo to be: "I am twenty years old."',
       'Para o email, leia o simbolo @ como "at" e o ponto como "dot".',
       'Perguntas frequentes: "Where are you from?", "How old are you?", "What is your phone number?".'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'READING', 'A short profile',
     jsonb_build_object(
       'text', 'My name is Marina. I am twenty-six years old and I am from Brazil. I live in Sao Paulo with my sister. I am a nurse and I work at a small hospital near my house. In the morning I study English before work.',
       'vocabulary', jsonb_build_array(
         jsonb_build_object('word','nurse','translation','enfermeira'),
         jsonb_build_object('word','near','translation','perto de'),
         jsonb_build_object('word','before','translation','antes de')
       )), 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3)
  returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
  values (v_block, 'READING_QUESTION', 'Answer about the text.',
          'What is Marina''s job?',
          'O texto diz "I am a nurse".', 1, 10, 1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'She is a nurse.',   true,  1),
    (v_ex, 'She is a teacher.', false, 2),
    (v_ex, 'She is a doctor.',  false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
  values (v_block, 'TRUE_FALSE', 'True or false?',
          'Marina lives alone.',
          'Falso. Ela mora com a irma: "I live in Sao Paulo with my sister".', 1, 10, 2,
          '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
  values (v_block, 'FILL_BLANK', 'Complete the sentence.',
          'Fale a sua idade.',
          'Em ingles usa-se o verbo to be para idade, nao o verbo ter.', 2, 10, 3,
          '{"template": "I {{0}} twenty years old."}'::jsonb,
          '{"blanks": [{"accepted": ["am"]}]}'::jsonb);

  raise notice 'seed aplicado: curso %, modulo %', v_course, v_module;
end $seed$;
