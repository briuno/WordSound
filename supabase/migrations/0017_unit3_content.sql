-- WordSound — conteudo da Unit 3 (Daily life)
--
-- Programa do Modulo 3 do livro: dias da semana, rotina, horas, esportes,
-- tempo livre e programas de TV; presente simples, preposicoes de tempo e
-- perguntas com wh-. As frases e o texto de leitura sao proprios, escritos
-- para esses pontos de ensino.
--
-- As transcricoes de listening vem da secao do livro que acompanha estas
-- mesmas tres faixas. No fim a unidade e publicada.

-- ---------------------------------------------------------------------------
-- transcricoes das tres faixas do Modulo 3
-- ---------------------------------------------------------------------------
update public.media set transcript =
'1.
A: Do you like football?
B: No, I don''t. I think it''s boring.
A: I really like football. I watch the cup final every year.
B: Do you play football a lot?
A: No, I don''t play at all. I just watch it on TV.
B: I see.

2.
A: Do you like sports, Fred?
B: Well, I like cycling very much.
A: Really? I like cycling, too. Let''s go cycling together. I go every evening after work.
B: I don''t. I haven''t got time. I go at the weekend.
A: Oh, I see.

3.
A: Let''s play table tennis today.
B: Oh, no. Not again.
A: Come on, it''s fun!
B: No, it isn''t. I hate it. Let''s watch tennis on TV today.
A: It''s boring!
B: Yeah, you''re right.
A: I''ve got an idea! Let''s go to the park and play tennis.
B: OK. It''s a change from table tennis.'
where storage_path like '%module-03-lesson-b%';

update public.media set transcript =
'A: Excuse me, can I ask you some questions for a survey?
B: Sure.
A: Thanks. How old are you?
B: I''m 26.
A: OK. Have you got a lot of spare time?
B: No, I haven''t. I''m a university student, and I study a lot.
A: What do you do in your spare time?
B: Umm... I like sports and I hang out with my friends.
A: Anything else?
B: Umm... I don''t like video games, but I read magazines a lot.
A: OK. What about your favourite spare-time activity?
B: I love the gym. I go there every day.
A: At the weekend, too?
B: No, just on weekdays.
A: I see. And who do you go there with?
B: My friends from university. They love going to the gym, too.
A: Great. That''s all, thank you.'
where storage_path like '%module-03-task-a%';

update public.media set transcript =
'1.
A: Welcome back. So, Gary, here''s your next question for 100 pounds. What is basketball star Michael Jordan''s middle name?
B: Jeffrey!
A: That''s right! Well done. OK, now for your last question...

2.
A: Hey, Julie. What''s on?
B: Not much. Do you like documentaries?
A: Not really. What''s it about?
B: Doctors around the world.
A: Boring! Let''s check the other channels... Football! Yes!
B: Oh, no! See you later.

3.
A: Oh, no! It''s 6 o''clock.
B: What''s wrong, Kim?
A: Where''s your TV?
B: Do you watch that soap opera every day? It''s really bad, you know.
A: No, the news is on at 6. And I watch that every day.
B: Oh, I see.'
where storage_path like '%module-03-lesson-d%';

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
  where c.slug = 'english-basics' and m.position = 3;
  if v_module is null then raise notice 'Unit 3 ausente'; return; end if;

  select id into m1 from public.media where storage_path like '%module-03-lesson-b%';
  select id into m2 from public.media where storage_path like '%module-03-task-a%';
  select id into m3 from public.media where storage_path like '%module-03-lesson-d%';

  -- ============================================================ 1. Days of the Week
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Os dias da semana',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Em ingles os dias da semana sempre comecam com letra maiuscula, mesmo no meio da frase: "I work on Monday."',
         'A semana comeca no domingo no calendario, mas na fala do dia a dia as pessoas pensam em Monday to Friday, os weekdays, e Saturday e Sunday, o weekend.',
         'Para dizer em que dia algo acontece usa-se on: on Monday, on Friday. Para o fim de semana o ingles britanico diz at the weekend e o americano on the weekend.',
         'Para perguntar o dia: "What day is it today?" A resposta e "It is Tuesday."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Days and time words',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','Monday',    'translation','segunda-feira', 'example','I start work on Monday.'),
         jsonb_build_object('word','Tuesday',   'translation','terca-feira',   'example','We have English on Tuesday.'),
         jsonb_build_object('word','Wednesday', 'translation','quarta-feira',  'example','Wednesday is a busy day.'),
         jsonb_build_object('word','Thursday',  'translation','quinta-feira',  'example','I go to the gym on Thursday.'),
         jsonb_build_object('word','Friday',    'translation','sexta-feira',   'example','Friday is my favourite day.'),
         jsonb_build_object('word','Saturday',  'translation','sabado',        'example','On Saturday I play football.'),
         jsonb_build_object('word','Sunday',    'translation','domingo',       'example','I sleep a lot on Sunday.'),
         jsonb_build_object('word','weekday',   'translation','dia util',      'example','I only study on weekdays.'),
         jsonb_build_object('word','weekend',   'translation','fim de semana', 'example','What do you do at the weekend?'),
         jsonb_build_object('word','today',     'translation','hoje',          'example','What day is it today?'),
         jsonb_build_object('word','tomorrow',  'translation','amanha',        'example','See you tomorrow!'),
         jsonb_build_object('word','every day', 'translation','todo dia',      'example','I read every day.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct sentence.',
            'Which sentence is written correctly?',
            'Os dias da semana levam maiuscula em ingles, sempre, e a frase termina em ponto.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'I play tennis on Saturday.', true,  1),
      (v_ex, 'I play tennis on saturday.', false, 2),
      (v_ex, 'i play tennis on Saturday.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Diga em que dia voce vai a academia.',
            'Antes de um dia da semana usa-se on.', 1, 10, 2,
            '{"template": "I go to the gym {{0}} Monday."}'::jsonb,
            '{"blanks": [{"accepted": ["on"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the short form with the day.',
            'Relacione a abreviacao ao dia completo.',
            'Em agendas e calendarios os dias aparecem com tres letras.', 1, 10, 3,
            '{"left": ["Mon","Tue","Wed","Thu"], "right": ["Thursday","Monday","Wednesday","Tuesday"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'What day comes after Friday?',
            'Depois de Friday vem Saturday.', 2, 10, 4,
            '{"accepted": ["Saturday"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a pergunta sobre o dia de hoje.',
            'A ordem e What day, depois o verbo is, depois today.', 2, 10, 5,
            '{"tokens": ["is","What","today","day"]}'::jsonb,
            '{"order": ["What","day","is","today"]}'::jsonb);
  end if;

  -- ============================================================ 2. Daily Routine
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'A rotina do dia',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'A rotina se conta na ordem do dia: get up, have a shower, have breakfast, go to work, have lunch, get home, have dinner, go to bed.',
         'Repare no verbo have. Ele serve para as tres refeicoes e tambem para o banho: have breakfast, have lunch, have dinner, have a shower.',
         'Wake up e abrir os olhos; get up e sair da cama. Sao duas coisas diferentes, e o ingles separa as duas.',
         'Antes do nome da refeicao nao entra artigo: have breakfast, e nao have the breakfast.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Daily routine',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','wake up',       'translation','acordar',            'example','I wake up at half past six.'),
         jsonb_build_object('word','get up',        'translation','levantar',           'example','I get up at seven.'),
         jsonb_build_object('word','have a shower', 'translation','tomar banho',        'example','She has a shower before breakfast.'),
         jsonb_build_object('word','have breakfast','translation','tomar cafe da manha','example','We have breakfast together.'),
         jsonb_build_object('word','go to work',    'translation','ir trabalhar',       'example','He goes to work by bus.'),
         jsonb_build_object('word','start work',    'translation','comecar a trabalhar','example','I start work at nine.'),
         jsonb_build_object('word','have lunch',    'translation','almocar',            'example','I have lunch at one o''clock.'),
         jsonb_build_object('word','finish work',   'translation','sair do trabalho',   'example','She finishes work at six.'),
         jsonb_build_object('word','get home',      'translation','chegar em casa',     'example','I get home late on Friday.'),
         jsonb_build_object('word','have dinner',   'translation','jantar',             'example','They have dinner at eight.'),
         jsonb_build_object('word','watch TV',      'translation','assistir TV',        'example','We watch TV in the evening.'),
         jsonb_build_object('word','go to bed',     'translation','ir dormir',          'example','I go to bed at eleven.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the activity with the part of the day.',
            'Relacione cada atividade ao momento do dia.',
            'A rotina segue a ordem natural: manha, tarde, noite.', 1, 10, 1,
            '{"left": ["get up","have lunch","have dinner","go to bed"], "right": ["in the evening","in the morning","at night","in the afternoon"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,0],[3,2]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Diga que voce sai da cama as sete.',
            'Sair da cama e get up. Wake up seria so abrir os olhos.', 1, 10, 2,
            '{"template": "I {{0}} up at seven o''clock."}'::jsonb,
            '{"blanks": [{"accepted": ["get"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which sentence is correct?',
            'Antes de breakfast, lunch e dinner nao entra artigo, e o verbo e have.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'I have breakfast at eight.',     true,  1),
      (v_ex, 'I have the breakfast at eight.', false, 2),
      (v_ex, 'I take breakfast at eight.',     false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a frase sobre a rotina dela.',
            'Sujeito, verbo, complemento e por fim a hora.', 2, 10, 4,
            '{"tokens": ["breakfast","She","eight","has","at"]}'::jsonb,
            '{"order": ["She","has","breakfast","at","eight"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'What is the opposite of "go to bed"?',
            'O contrario de ir dormir e sair da cama: get up.', 2, 10, 5,
            '{"accepted": ["get up","wake up","I get up"]}'::jsonb);
  end if;

  -- ============================================================ 3. Telling the Time
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Que horas sao?',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'A pergunta e "What time is it?" e a resposta comeca sempre com It is: "It is seven o''clock."',
         'A hora cheia leva o''clock: three o''clock. Isso so vale para a hora exata, nunca com minutos.',
         'Ate a metade da hora usa-se past, contando a partir da hora que ja passou: 7:15 e quarter past seven, 7:20 e twenty past seven, 7:30 e half past seven.',
         'Depois da metade usa-se to, contando o que falta para a proxima hora: 7:45 e quarter to eight, 7:50 e ten to eight.',
         'Meio-dia e midday ou noon, meia-noite e midnight. Na escrita, am vale ate meio-dia e pm depois dele.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Preposicoes de tempo: at, on, in',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'At vai com horas e com alguns momentos fixos: at seven o''clock, at midnight, at night, at the weekend.',
         'On vai com dias e datas: on Monday, on Friday morning, on 12th May.',
         'In vai com partes do dia, meses, estacoes e anos: in the morning, in the afternoon, in the evening, in July, in 2026.',
         'Repare na excecao: as partes do dia levam in, mas a noite leva at. E in the evening, mas at night.'
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Time words',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','o''clock',        'translation','em ponto',       'example','It is five o''clock.'),
         jsonb_build_object('word','half past',       'translation','e meia',         'example','It is half past nine.'),
         jsonb_build_object('word','quarter past',    'translation','e quinze',       'example','It is quarter past ten.'),
         jsonb_build_object('word','quarter to',      'translation','quinze para',    'example','It is quarter to six.'),
         jsonb_build_object('word','midday',          'translation','meio-dia',       'example','We have lunch at midday.'),
         jsonb_build_object('word','midnight',        'translation','meia-noite',     'example','The film finishes at midnight.'),
         jsonb_build_object('word','early',           'translation','cedo',           'example','I get up early on weekdays.'),
         jsonb_build_object('word','late',            'translation','tarde',          'example','He gets home late on Friday.'),
         jsonb_build_object('word','What time is it?','translation','que horas sao?', 'example','Excuse me, what time is it?')
       )), 3);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 4) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'How do you say 7:30?',
            'Trinta minutos e meia hora, contada a partir das sete: half past seven.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'It is half past seven.',            true,  1),
      (v_ex, 'It is half to seven.',              false, 2),
      (v_ex, 'It is seven o''clock and a half.',  false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Sao 8:15.',
            'Ate a metade da hora conta-se com past.', 2, 10, 2,
            '{"template": "It is quarter {{0}} eight."}'::jsonb,
            '{"blanks": [{"accepted": ["past"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the clock with the words.',
            'Relacione cada horario a forma falada.',
            'Depois da metade da hora conta-se o que falta para a proxima.', 3, 10, 3,
            '{"left": ["9:00","9:15","9:30","8:45"], "right": ["quarter to nine","nine o''clock","half past nine","quarter past nine"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with at, on or in.',
            'Complete as tres preposicoes de tempo.',
            'At para hora, on para dia da semana, in para parte do dia.', 3, 10, 4,
            '{"template": "The class starts {{0}} nine o''clock {{1}} Tuesday, and it finishes {{2}} the afternoon."}'::jsonb,
            '{"blanks": [{"accepted": ["at"]}, {"accepted": ["on"]}, {"accepted": ["in"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Ask for the time in English.',
            'You want to know the time. What do you ask?',
            'A pergunta padrao e "What time is it?".', 2, 10, 5,
            '{"accepted": ["What time is it?","what''s the time","what is the time"]}'::jsonb);
  end if;

  -- ============================================================ 4. Present Simple
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'O presente simples',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'O presente simples serve para o que e habito, rotina ou fato: "I work in a bank.", "She gets up at seven."',
         'Na afirmativa o verbo so muda na terceira pessoa do singular, que ganha s: I work, you work, he works, she works, it works, we work, they work.',
         'A regra do s tem tres casos. Em geral so acrescenta s: work, works. Terminado em o, ch, sh, ss ou x, acrescenta es: go, goes; watch, watches. Consoante mais y vira ies: study, studies.',
         'Na negativa o s sai do verbo e vai para o auxiliar: I do not work, she does not work. Nas formas curtas, don''t e doesn''t.',
         'Na pergunta o auxiliar vem antes do sujeito e o verbo volta ao normal: "Do you work here?", "Does she work here?".',
         'A resposta curta repete o auxiliar: "Yes, I do." / "No, I don''t." / "Yes, she does." / "No, she doesn''t."'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the correct form of "work".',
            'Terceira pessoa do singular.',
            'She e terceira pessoa do singular, entao o verbo ganha s: works.', 1, 10, 1,
            '{"template": "She {{0}} in a bank."}'::jsonb,
            '{"blanks": [{"accepted": ["works"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct negative sentence.',
            'Which sentence is correct?',
            'Com does not o verbo perde o s, porque o s ja esta no auxiliar.', 2, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'He does not like football.',  true,  1),
      (v_ex, 'He does not likes football.', false, 2),
      (v_ex, 'He not like football.',       false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the question.',
            'Pergunte se a pessoa gosta de tenis.',
            'Com you o auxiliar e Do.', 1, 10, 3,
            '{"template": "{{0}} you like tennis?"}'::jsonb,
            '{"blanks": [{"accepted": ["Do"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the he/she/it form.',
            'study',
            'Consoante mais y vira ies: studies.', 2, 10, 4,
            '{"accepted": ["studies"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the he/she/it form.',
            'watch',
            'Terminado em ch leva es: watches.', 2, 10, 5,
            '{"accepted": ["watches"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a pergunta.',
            'A ordem e auxiliar, sujeito, verbo, complemento.', 3, 10, 6,
            '{"tokens": ["watch","Does","TV","she","day","every"]}'::jsonb,
            '{"order": ["Does","she","watch","TV","every","day"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'We use "does" with I, you, we and they.',
            'Falso. Does e so para he, she e it. Com os outros o auxiliar e do.', 2, 10, 7,
            '{"value": false}'::jsonb);
  end if;

  -- ============================================================ 5. Wh- Questions
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'GRAMMAR', 'Perguntas com wh-',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'As perguntas abertas pedem informacao, nao sim ou nao. Comecam com uma palavra wh-: what, where, when, who, why, which, whose. How entra no mesmo grupo, mesmo sem wh.',
         'A ordem e sempre a mesma: palavra wh- + do/does + sujeito + verbo. "Where do you live?", "What time does she get up?"',
         'Repare que o verbo principal fica sem s, porque o s ja esta em does: "What does he do?", e nao "What does he does?".',
         'Algumas perguntas sao formadas por duas palavras: what time para hora, how often para frequencia, how old para idade.',
         'Com o verbo to be nao entra auxiliar: "Where is your bag?", "Who is she?".'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Question words',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','What',      'translation','o que',        'example','What do you do?'),
         jsonb_build_object('word','Where',     'translation','onde',         'example','Where do you live?'),
         jsonb_build_object('word','When',      'translation','quando',       'example','When do you study?'),
         jsonb_build_object('word','Who',       'translation','quem',         'example','Who do you go with?'),
         jsonb_build_object('word','Why',       'translation','por que',      'example','Why do you like it?'),
         jsonb_build_object('word','Which',     'translation','qual',         'example','Which channel is it on?'),
         jsonb_build_object('word','What time', 'translation','a que horas',  'example','What time do you get up?'),
         jsonb_build_object('word','How often', 'translation','com que frequencia','example','How often do you go to the gym?'),
         jsonb_build_object('word','How old',   'translation','quantos anos', 'example','How old are you?')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the question word with what it asks for.',
            'Relacione cada palavra ao tipo de informacao que ela pede.',
            'Cada palavra wh- pede um tipo de resposta diferente.', 1, 10, 1,
            '{"left": ["Where","When","Who","Why"], "right": ["a reason","a place","a person","a time"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,2],[3,0]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the question.',
            'Pergunte onde a pessoa mora.',
            'Lugar se pergunta com Where.', 1, 10, 2,
            '{"template": "{{0}} do you live?"}'::jsonb,
            '{"blanks": [{"accepted": ["Where"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct question.',
            'Which question is correct?',
            'Depois de does o verbo fica na forma basica, sem s.', 2, 10, 3)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Where does he work?',  true,  1),
      (v_ex, 'Where does he works?', false, 2),
      (v_ex, 'Where he works?',      false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Pergunte a que horas a pessoa levanta.',
            'What time abre a pergunta, depois vem o auxiliar do.', 3, 10, 4,
            '{"tokens": ["you","time","What","up","get","do"]}'::jsonb,
            '{"order": ["What","time","do","you","get","up"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the question about frequency.',
            'Pergunte com que frequencia a pessoa vai a academia.',
            'Frequencia se pergunta com How often.', 2, 10, 5,
            '{"template": "{{0}} often do you go to the gym?"}'::jsonb,
            '{"blanks": [{"accepted": ["How"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'Which question word do you use to ask for a reason?',
            'Motivo se pergunta com why, e a resposta costuma comecar com because.', 2, 10, 6,
            '{"accepted": ["Why","why?"]}'::jsonb);
  end if;

  -- ============================================================ 6. Sports & Spare Time
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Esportes e tempo livre',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Cada esporte pede um verbo diferente. Play vai com jogos e esportes de bola: play football, play tennis, play basketball.',
         'Go vai com as atividades terminadas em -ing: go cycling, go swimming, go running.',
         'Do vai com o resto, sobretudo artes marciais e exercicio solto: do yoga, do karate, do exercise.',
         'Para gostar ou nao gostar: I love it, I like it, I don''t like it, I hate it. Depois costuma vir a razao: "I think it''s boring." ou "It''s fun!"',
         'Para sugerir algo usa-se Let''s com o verbo na forma basica: "Let''s play tennis.", "Let''s watch TV." Aceita-se com OK ou Good idea, e recusa-se com Oh, no ou Not again.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Sports and spare time',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','football',      'translation','futebol',        'example','I watch the cup final every year.'),
         jsonb_build_object('word','tennis',        'translation','tenis',          'example','Let''s go to the park and play tennis.'),
         jsonb_build_object('word','table tennis',  'translation','tenis de mesa',  'example','I hate table tennis.'),
         jsonb_build_object('word','cycling',       'translation','ciclismo',       'example','I go cycling every evening.'),
         jsonb_build_object('word','swimming',      'translation','natacao',        'example','She goes swimming on Saturday.'),
         jsonb_build_object('word','basketball',    'translation','basquete',       'example','They play basketball after school.'),
         jsonb_build_object('word','the gym',       'translation','a academia',     'example','I love the gym. I go there every day.'),
         jsonb_build_object('word','hang out with', 'translation','sair com',       'example','I hang out with my friends.'),
         jsonb_build_object('word','video games',   'translation','videogames',     'example','I don''t like video games.'),
         jsonb_build_object('word','magazines',     'translation','revistas',       'example','I read magazines a lot.'),
         jsonb_build_object('word','spare time',    'translation','tempo livre',    'example','Have you got a lot of spare time?'),
         jsonb_build_object('word','boring',        'translation','chato',          'example','No, I don''t. I think it''s boring.')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the verb with the activity.',
            'Relacione cada verbo a atividade que combina com ele.',
            'Play para esporte de bola, go para atividade em -ing, do para o resto, watch para o que se assiste.', 2, 10, 1,
            '{"left": ["play","go","do","watch"], "right": ["yoga","football","TV","cycling"]}'::jsonb,
            '{"pairs": [[0,1],[1,3],[2,0],[3,2]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'Which sentence is correct?',
            'Futebol e esporte de bola, entao o verbo e play.', 1, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'I play football on Saturday.', true,  1),
      (v_ex, 'I go football on Saturday.',   false, 2),
      (v_ex, 'I do football on Saturday.',   false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Fale do seu ciclismo.',
            'Atividade terminada em -ing pede o verbo go.', 2, 10, 3,
            '{"template": "I {{0}} cycling every evening."}'::jsonb,
            '{"blanks": [{"accepted": ["go"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the best answer.',
            'Someone asks: "Do you like table tennis?" You do not like it. What do you say?',
            'A negativa curta e "No, I don''t." e depois vem o motivo.', 2, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'No, I don''t. I think it''s boring.', true,  1),
      (v_ex, 'No, I am not. It''s boring.',         false, 2),
      (v_ex, 'Yes, I don''t like it.',              false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Faca a sugestao.',
            'Let''s abre a sugestao e o verbo vem logo depois, na forma basica.', 3, 10, 5,
            '{"tokens": ["cycling","go","together","Let''s"]}'::jsonb,
            '{"order": ["Let''s","go","cycling","together"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Answer in English.',
            'Which word do you use to suggest doing something together? Complete: "___ play tennis!"',
            'Sugestao com o grupo todo comeca com Let''s, forma curta de let us.', 2, 10, 6,
            '{"accepted": ["Let''s","lets","let us"]}'::jsonb);
  end if;

  -- ============================================================ 7. TV Programmes
  select id into v_lesson from public.lessons where module_id = v_module and position = 7;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Programas de TV',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Para saber o que esta passando pergunta-se "What''s on?" e para saber o assunto, "What''s it about?". A resposta comeca com It''s about: "It''s about doctors around the world."',
         'Para dizer o horario de um programa usa-se on com at: "The news is on at six." O verbo be mais on quer dizer que esta no ar.',
         'The news leva the e, apesar do s, e singular: "The news is on at six.", e nao The news are.',
         'Para trocar de canal: "Let''s check the other channels." Channel e canal; programme, com dois m e e no fim, e o ingles britanico de programa.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'VOCABULARY', 'Types of TV programme',
       jsonb_build_object('items', jsonb_build_array(
         jsonb_build_object('word','the news',        'translation','o noticiario',    'example','The news is on at six.'),
         jsonb_build_object('word','a soap opera',    'translation','uma novela',      'example','Do you watch that soap opera every day?'),
         jsonb_build_object('word','a quiz show',     'translation','um programa de perguntas','example','He wins 100 pounds on the quiz show.'),
         jsonb_build_object('word','a documentary',   'translation','um documentario', 'example','Do you like documentaries?'),
         jsonb_build_object('word','a cartoon',       'translation','um desenho animado','example','My little brother watches cartoons.'),
         jsonb_build_object('word','a series',        'translation','uma serie',       'example','That series is on every Thursday.'),
         jsonb_build_object('word','a talk show',     'translation','um programa de entrevistas','example','The talk show starts at eleven.'),
         jsonb_build_object('word','a channel',       'translation','um canal',        'example','Let''s check the other channels.'),
         jsonb_build_object('word','What''s on?',     'translation','o que esta passando?','example','Hey, Julie. What''s on?'),
         jsonb_build_object('word','What''s it about?','translation','e sobre o que?', 'example','Not really. What''s it about?')
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the programme with its description.',
            'Relacione cada tipo de programa a sua descricao.',
            'Cada formato de TV tem um publico e um assunto proprio.', 2, 10, 1,
            '{"left": ["the news","a quiz show","a documentary","a cartoon"], "right": ["real facts about the world","for children, with drawings","what happens in the world today","people answer questions for money"]}'::jsonb,
            '{"pairs": [[0,2],[1,3],[2,0],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct question.',
            'You want to know what is on TV now. What do you ask?',
            'A pergunta feita e "What''s on?".', 1, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'What''s on?',        true,  1),
      (v_ex, 'What''s the TV?',    false, 2),
      (v_ex, 'What has the TV?',   false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Diga que o noticiario passa as seis.',
            'Estar no ar e be on, e a hora leva at.', 2, 10, 3,
            '{"template": "The news is {{0}} at six o''clock."}'::jsonb,
            '{"blanks": [{"accepted": ["on"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'We say "The news are on at six."',
            'Falso. Apesar do s, the news e singular: The news is on at six.', 3, 10, 4,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Ask about the subject of a programme.',
            'A friend is watching something. You want to know the subject. What do you ask?',
            'Pergunta-se "What''s it about?".', 3, 10, 5,
            '{"accepted": ["What''s it about?","what is it about"]}'::jsonb);
  end if;

  -- ============================================================ 8. Reading
  select id into v_lesson from public.lessons where module_id = v_module and position = 8;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'READING', 'Life as a game tester',
       jsonb_build_object(
         'text', 'Tom, 23, works for a small games company in Manchester. My friends think my job is a holiday, he says, but it is real work. I get up at half past seven and I have breakfast at home. I start work at nine. I do not play games for fun here: I play the same level twenty or thirty times and I write a report about every problem I find. I have lunch at one with the other testers. In the afternoon I test the game on different phones and consoles, because it works on one and it does not work on another. I finish at six. In my spare time I go to the gym and I hang out with my friends. I do not play video games in the evening! On Saturday I play football with my brother, and on Sunday I sleep.',
         'vocabulary', jsonb_build_array(
           jsonb_build_object('word','holiday','translation','ferias'),
           jsonb_build_object('word','level','translation','fase'),
           jsonb_build_object('word','report','translation','relatorio'),
           jsonb_build_object('word','spare time','translation','tempo livre')
         )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'What time does Tom start work?',
            'Ele levanta as sete e meia, toma cafe em casa e comeca as nove.', 1, 10, 1)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'At nine o''clock.',        true,  1),
      (v_ex, 'At half past seven.',      false, 2),
      (v_ex, 'At one o''clock.',         false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'Does Tom play video games in the evening?',
            'O texto e categorico: "I do not play video games in the evening!"', 2, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'No, he doesn''t.',              true,  1),
      (v_ex, 'Yes, he does, every evening.',  false, 2),
      (v_ex, 'Yes, but only on Sunday.',      false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'Tom tests every level only once.',
            'Falso. Ele joga a mesma fase vinte ou trinta vezes.', 2, 10, 3,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'READING_QUESTION', 'Answer about the text.',
            'Who does Tom play football with on Saturday?',
            'No sabado ele joga futebol com o irmao.', 2, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'His brother.',            true,  1),
      (v_ex, 'The other testers.',      false, 2),
      (v_ex, 'His friends at the gym.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with information from the text.',
            'A que horas ele termina o trabalho.',
            'O texto diz "I finish at six."', 2, 10, 5,
            '{"template": "Tom finishes work at {{0}} o''clock."}'::jsonb,
            '{"blanks": [{"accepted": ["six","6"]}]}'::jsonb);
  end if;

  -- ============================================================ 9. Listening
  select id into v_lesson from public.lessons where module_id = v_module and position = 9;
  delete from public.lesson_blocks where lesson_id = v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Antes de ouvir',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Sao tres situacoes: amigos falando de esportes, uma pesquisa de rua sobre tempo livre e tres cenas na frente da TV.',
       'Na primeira escuta pegue so a ideia geral. Na segunda, em 0.75x, foque nos verbos de rotina, nas horas e nas opinioes.',
       'A transcricao abre depois que voce responder os exercicios daquela faixa.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position) values
    (v_lesson, 'LISTENING', 'Track 1 — Sports',
     jsonb_build_object('instructions', 'Tres conversas curtas sobre futebol, ciclismo e tenis.'), m1, 2),
    (v_lesson, 'LISTENING', 'Track 2 — A street survey',
     jsonb_build_object('instructions', 'Uma estudante responde a uma pesquisa sobre tempo livre.'), m2, 3),
    (v_lesson, 'LISTENING', 'Track 3 — What''s on TV?',
     jsonb_build_object('instructions', 'Tres cenas diante da TV. Preste atencao nos tipos de programa e nas horas.'), m3, 4);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 5) returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'In the first dialogue, why does the second speaker not like football?',
          'A resposta e direta: "No, I don''t. I think it''s boring."', 2, 10, 1, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'He thinks it is boring.',      true,  1),
    (v_ex, 'He has not got a TV.',         false, 2),
    (v_ex, 'He plays it every weekend.',   false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 1. True or false?',
          'The football fan plays football every week.',
          'Falso. Ele diz "I don''t play at all. I just watch it on TV."', 3, 10, 2, m1,
          '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 1 and complete.',
          'O esporte que o Fred gosta, no segundo dialogo.',
          'Ele responde "Well, I like cycling very much."', 2, 10, 3, m1,
          '{"template": "I like {{0}} very much."}'::jsonb,
          '{"blanks": [{"accepted": ["cycling"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'In the third dialogue, what do they decide to do?',
          'Depois de recusar o tenis de mesa e a TV, um deles sugere ir ao parque jogar tenis, e o outro aceita.', 3, 10, 4, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Go to the park and play tennis.', true,  1),
    (v_ex, 'Play table tennis again.',        false, 2),
    (v_ex, 'Watch tennis on TV.',             false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 2 and choose.',
          'How old is the woman?',
          'A primeira pergunta da pesquisa e a idade, e ela responde "I''m 26."', 2, 10, 5, m2)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'She is 26.', true,  1),
    (v_ex, 'She is 16.', false, 2),
    (v_ex, 'She is 62.', false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 2. True or false?',
          'She has got a lot of spare time.',
          'Falso. Ela responde "No, I haven''t. I''m a university student, and I study a lot."', 2, 10, 6, m2,
          '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 2 and choose.',
          'What does she not like?',
          'Ela gosta de esportes, de sair com os amigos e de revistas, mas diz "I don''t like video games".', 3, 10, 7, m2)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Video games.', true,  1),
    (v_ex, 'Magazines.',   false, 2),
    (v_ex, 'Sports.',      false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 2 and complete.',
          'A atividade preferida dela.',
          'Ela responde "I love the gym. I go there every day."', 2, 10, 8, m2,
          '{"template": "I love the {{0}}. I go there every day."}'::jsonb,
          '{"blanks": [{"accepted": ["gym"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 2. True or false?',
          'She goes to the gym at the weekend, too.',
          'Falso. Perguntada sobre o fim de semana ela responde "No, just on weekdays."', 3, 10, 9, m2,
          '{"value": false}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 3 and choose.',
          'In the first dialogue, what kind of programme is it?',
          'Ha um apresentador, um participante e uma pergunta valendo 100 libras: e um quiz show.', 3, 10, 10, m3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'A quiz show.',   true,  1),
    (v_ex, 'A soap opera.',  false, 2),
    (v_ex, 'A cartoon.',     false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 3 and choose.',
          'In the second dialogue, what does Julie''s friend want to watch?',
          'Ele acha o documentario chato, troca de canal e comemora ao achar futebol.', 3, 10, 11, m3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Football.',                      true,  1),
    (v_ex, 'A documentary about doctors.',   false, 2),
    (v_ex, 'The news.',                      false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 3 and complete.',
          'O que passa as seis horas, no terceiro dialogo.',
          'Nao e novela: "the news is on at 6. And I watch that every day."', 3, 10, 12, m3,
          '{"template": "The {{0}} is on at six o''clock."}'::jsonb,
          '{"blanks": [{"accepted": ["news"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, answer_key)
  values (v_block, 'TRUE_FALSE', 'Listen to Track 3. True or false?',
          'Kim watches a soap opera at six o''clock every day.',
          'Falso. O amigo supoe novela, mas Kim corrige: o que passa as seis e o noticiario.', 3, 10, 13, m3,
          '{"value": false}'::jsonb);

  -- ============================================================ 10. Writing
  select id into v_lesson from public.lessons where module_id = v_module and position = 10;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'A ordem das palavras',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'A frase em ingles segue uma ordem fixa: sujeito, verbo, complemento, lugar e por ultimo tempo. "I play tennis in the park on Sunday."',
         'O portugues aceita mexer nessa ordem, o ingles nao. "Every evening watches she TV" nao existe; o correto e "She watches TV every evening."',
         'Lugar vem antes de tempo. Diz-se "He works in an office every day", e nao "He works every day in an office".',
         'A expressao de tempo tambem pode abrir a frase, separada por virgula: "On Sunday, I play tennis." O que nunca acontece e ela entrar entre o verbo e o complemento.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'Planejar antes de escrever',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Antes de escrever, faca uma lista curta do que voce quer dizer. Um perfil para rede social costuma ter tres partes.',
         'Primeiro, quem voce e: nome, idade, o que faz. "I''m Ana. I''m 22 and I''m a student."',
         'Segundo, a rotina: os horarios do seu dia, na ordem em que acontecem. "I get up at seven and I start classes at nine."',
         'Terceiro, o tempo livre: o que voce gosta e o que nao gosta. "In my spare time I go swimming. I don''t like video games."',
         'Cada parte vira um paragrafo. Ligue as frases com and, but e because, para o texto nao virar uma lista solta.'
       )), 2);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 3) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a frase com lugar no fim.',
            'Sujeito, verbo, complemento e depois o lugar.', 2, 10, 1,
            '{"tokens": ["park","I","tennis","the","play","in"]}'::jsonb,
            '{"order": ["I","play","tennis","in","the","park"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct sentence.',
            'Which sentence has the correct word order?',
            'Complemento, depois lugar, depois tempo. O sujeito nunca vem depois do verbo numa afirmativa.', 3, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'She watches TV at home every evening.', true,  1),
      (v_ex, 'She watches every evening TV at home.', false, 2),
      (v_ex, 'Every evening watches she TV at home.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Monte a frase com o tempo no fim.',
            'A expressao de tempo fecha a frase.', 3, 10, 3,
            '{"tokens": ["every","gym","the","goes","She","to","evening"]}'::jsonb,
            '{"order": ["She","goes","to","the","gym","every","evening"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the best plan.',
            'You are writing a profile for a social media site. Which order works best?',
            'Comece se apresentando, depois conte a rotina e por fim o tempo livre. Assim quem le sabe quem voce e antes dos detalhes.', 2, 10, 4)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Who you are, then your routine, then your spare time.', true,  1),
      (v_ex, 'Your spare time, then who you are, then your routine.', false, 2),
      (v_ex, 'Your routine, then your spare time, then who you are.', false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with at, on or in.',
            'Complete a frase da sua rotina.',
            'At para a hora, on para os dias, in para a parte do dia.', 3, 10, 5,
            '{"template": "I get up {{0}} half past seven {{1}} weekdays and I study {{2}} the evening."}'::jsonb,
            '{"blanks": [{"accepted": ["at"]}, {"accepted": ["on"]}, {"accepted": ["in"]}]}'::jsonb);
  end if;

  -- ============================================================ 11. Unit Review
  select id into v_lesson from public.lessons where module_id = v_module and position = 11;
  if not exists (select 1 from public.lesson_blocks where lesson_id = v_lesson) then

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
      (v_lesson, 'CONTENT', 'O que a unidade cobriu',
       jsonb_build_object('paragraphs', jsonb_build_array(
         'Dias da semana com maiuscula e a preposicao on; as horas com past e to; a rotina do dia com os verbos get up, have e go.',
         'O presente simples: s na terceira pessoa, don''t e doesn''t na negativa, do e does na pergunta.',
         'As perguntas abertas com what, where, when, who, why, what time e how often, sempre na ordem wh- + do/does + sujeito + verbo.',
         'Esportes com play, go e do; opinioes com like, love e hate; sugestoes com Let''s; e os tipos de programa de TV.'
       )), 1);

    insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
    values (v_lesson, 'EXERCISE', 'Revisao', '{}'::jsonb, 2) returning id into v_block;

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with the correct form of "get".',
            'Terceira pessoa do singular.',
            'He pede o verbo com s: gets.', 1, 10, 1,
            '{"template": "He {{0}} up at seven every day."}'::jsonb,
            '{"blanks": [{"accepted": ["gets"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct question.',
            'Complete: "___ she like documentaries?"',
            'She e terceira pessoa do singular, entao o auxiliar e Does.', 2, 10, 2)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'Does', true,  1),
      (v_ex, 'Do',   false, 2),
      (v_ex, 'Is',   false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'MATCHING', 'Match the question with the answer.',
            'Relacione cada pergunta a resposta natural.',
            'Cada palavra wh- pede um tipo de resposta: hora, lugar, pessoa ou motivo.', 3, 10, 3,
            '{"left": ["What time do you get up?","Where do you live?","Who do you go with?","Why do you like it?"], "right": ["In Lisbon.","Because it is fun.","At seven o''clock.","With my friends."]}'::jsonb,
            '{"pairs": [[0,2],[1,0],[2,3],[3,1]]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete with at, on or in.',
            'Complete com a preposicao de tempo.',
            'Hora leva at.', 2, 10, 4,
            '{"template": "The news is on {{0}} six o''clock."}'::jsonb,
            '{"blanks": [{"accepted": ["at"]}]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'SHORT_ANSWER', 'Write the he/she/it form.',
            'go',
            'Terminado em o leva es: goes.', 2, 10, 5,
            '{"accepted": ["goes"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'ORDER_WORDS', 'Put the words in the correct order.',
            'Pergunte a que horas o filme comeca.',
            'What time abre a pergunta, depois vem does, o sujeito e o verbo sem s.', 3, 10, 6,
            '{"tokens": ["start","time","the","What","film","does"]}'::jsonb,
            '{"order": ["What","time","does","the","film","start"]}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, answer_key)
    values (v_block, 'TRUE_FALSE', 'True or false?',
            'In English we say "I play cycling".',
            'Falso. Atividade em -ing pede go: I go cycling.', 2, 10, 7,
            '{"value": false}'::jsonb);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position)
    values (v_block, 'MULTIPLE_CHOICE', 'Choose the correct answer.',
            'How do you say 10:45?',
            'Depois da metade da hora conta-se o que falta para a proxima: quarter to eleven.', 3, 10, 8)
    returning id into v_ex;
    insert into public.exercise_options (exercise_id, text, is_correct, position) values
      (v_ex, 'It is quarter to eleven.',  true,  1),
      (v_ex, 'It is quarter past ten.',   false, 2),
      (v_ex, 'It is quarter to ten.',     false, 3);

    insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, prompt, answer_key)
    values (v_block, 'FILL_BLANK', 'Complete the sentence.',
            'Ligue as duas ideias opostas.',
            'Ideias que se opoem se ligam com but.', 2, 10, 9,
            '{"template": "I don''t like video games, {{0}} I read magazines a lot."}'::jsonb,
            '{"blanks": [{"accepted": ["but"]}]}'::jsonb);
  end if;

  -- ---------------------------------------------------------------------------
  -- publica a unidade
  -- ---------------------------------------------------------------------------
  update public.lessons set status = 'published' where module_id = v_module;
  update public.modules set status = 'published' where id = v_module;

  raise notice 'Unit 3 semeada e publicada';
end $seed$;
