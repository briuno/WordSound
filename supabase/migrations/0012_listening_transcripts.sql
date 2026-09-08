-- WordSound — transcricoes e licao de listening com o audio do curso
--
-- As transcricoes vem da secao Listening Transcripts do proprio livro, que
-- acompanha estes mesmos arquivos: e o texto do audio, nao conteudo novo.
-- Com elas o aluno pode conferir o que ouviu, e a action revealTranscript
-- passa a ter o que liberar depois dos exercicios.
--
-- A licao 10 tinha audio gerado por sintese de voz, criado como demonstracao
-- enquanto o material real nao existia. Agora existe, entao os blocos de
-- demonstracao saem e entram as quatro faixas do curso. Isso apaga as
-- tentativas ligadas aos exercicios antigos, que sao todas da conta de teste.

-- ---------------------------------------------------------------------------
-- transcricoes
-- ---------------------------------------------------------------------------
update public.media set transcript =
'1. Good afternoon.
2. Hello. How are you?
3. See you later!
4. Take care.
5. Hello. What''s your name?
6. Nice to meet you.
7. Mark, this is Mary.
8. What''s new?'
where storage_path = 'audio/002-module-01-lesson-a-act-5-listening-a.mp3';

update public.media set transcript =
'1.
A: Hi, Gary.
B: Hello, Mary. What''s new?
A: Not much. Listen, is your neighbour an electrician?
B: No, she''s an architect.
A: Oh.

2.
A: OK, madam. What''s your phone number?
B: It''s 0162 775212.
A: 0162 775212. Great. Thank you.

3.
A: And what''s his number?
B: I don''t know. But I know his email. It''s ryan@blackdent.com.
A: Thanks.'
where storage_path = 'audio/004-module-01-task-b.mp3';

update public.media set transcript =
'A: Good morning. Can I ask you some questions for this form?
B: Sure.
A: What''s your first name?
B: Jon. But, it''s J-O-N.
A: I see, no H.
B: That''s right.
A: And your surname?
B: It''s Davies.
A: Is that D-A-V-I-S?
B: No, it''s D-A-V-I-E-S.'
where storage_path = 'audio/005-module-01-lesson-d-act-2-speaking-listening-b.mp3';

update public.media set transcript =
'A: OK, Mr Davies. How old are you?
B: I''m 34.
A: And where are you from?
B: Well, I''m British, but I live in Australia.
A: So, you''re from the UK.
B: Yes, that''s right.
A: And what do you do?
B: I''m a doctor.
A: OK. Now, what''s your phone number?
B: Well, my home number is 0121 554 8898.
A: 554...?
B: 8898.
A: Great. What''s your mobile number?
B: Hmm. Let me think... It''s 0745 575 5998.
A: ... 5998. One more thing. What''s your email address?
B: It''s jd445@netxv.com.
A: OK, thank you. That''s all I need for now.'
where storage_path = 'audio/006-module-01-lesson-d-act-2-speaking-listening-c.mp3';

-- ---------------------------------------------------------------------------
-- licao 10 com o audio do curso
-- ---------------------------------------------------------------------------
do $seed$
declare
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
  m1 bigint; m2 bigint; m3 bigint; m4 bigint;
begin
  select l.id into v_lesson
  from public.lessons l
  join public.modules m on m.id = l.module_id
  join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and l.position = 10;
  if v_lesson is null then return; end if;

  select id into m1 from public.media where storage_path = 'audio/002-module-01-lesson-a-act-5-listening-a.mp3';
  select id into m2 from public.media where storage_path = 'audio/004-module-01-task-b.mp3';
  select id into m3 from public.media where storage_path = 'audio/005-module-01-lesson-d-act-2-speaking-listening-b.mp3';
  select id into m4 from public.media where storage_path = 'audio/006-module-01-lesson-d-act-2-speaking-listening-c.mp3';
  if m1 is null or m2 is null or m3 is null or m4 is null then
    raise notice 'audios do curso ausentes; rode scripts/upload_course_audio.py antes';
    return;
  end if;

  -- ja migrado?
  if exists (select 1 from public.lesson_blocks where lesson_id = v_lesson and media_id = m1) then
    raise notice 'licao 10 ja usa o audio do curso';
    return;
  end if;

  delete from public.lesson_blocks where lesson_id = v_lesson;

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Antes de ouvir',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Ouca cada faixa inteira uma vez, sem parar, so para pegar a ideia geral.',
       'Na segunda escuta use 0.75x. Numeros, nomes soletrados e enderecos de email aparecem melhor devagar.',
       'A transcricao fica bloqueada ate voce responder os exercicios daquela faixa. Ela existe para conferir, nao para adiantar.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position) values
    (v_lesson, 'LISTENING', 'Track 1 — Greetings',
     jsonb_build_object('instructions', 'Oito frases curtas do dia a dia. Preste atencao em qual serve para se despedir.'), m1, 2),
    (v_lesson, 'LISTENING', 'Track 2 — Jobs, numbers and email',
     jsonb_build_object('instructions', 'Tres conversas curtas. Anote a profissao, o telefone e o email.'), m2, 3),
    (v_lesson, 'LISTENING', 'Track 3 — Spelling a name',
     jsonb_build_object('instructions', 'Alguem preenche um formulario. Repare em como o nome e soletrado.'), m3, 4),
    (v_lesson, 'LISTENING', 'Track 4 — Personal information',
     jsonb_build_object('instructions', 'Idade, pais, profissao, telefone e email. Ouca duas vezes.'), m4, 5);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 6) returning id into v_block;

  -- ---------------- Track 1 ----------------
  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'Which phrase is used to say goodbye?',
          '"See you later!" e despedida. "Nice to meet you" e para quando se conhece alguem.', 1, 10, 1, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'See you later!',   true,  1),
    (v_ex, 'Nice to meet you.', false, 2),
    (v_ex, 'What''s new?',      false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 1 and complete.',
          'A despedida curta que aparece na faixa.',
          'A frase e "Take care.", usada ao se despedir de alguem proximo.', 1, 10, 2, m1,
          '{"template": "Take {{0}}."}'::jsonb,
          '{"blanks": [{"accepted": ["care"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 1 and choose.',
          'The speaker says "Mark, this is Mary." What is she doing?',
          'This is e a formula para apresentar alguem a outra pessoa.', 2, 10, 3, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'Introducing someone.', true,  1),
    (v_ex, 'Saying goodbye.',      false, 2),
    (v_ex, 'Asking for a name.',   false, 3);

  -- ---------------- Track 2 ----------------
  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 2 and choose.',
          'What is Gary''s neighbour''s job?',
          'Mary pergunta se e eletricista, e Gary corrige: "No, she''s an architect."', 2, 10, 4, m2)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'She is an architect.',   true,  1),
    (v_ex, 'She is an electrician.', false, 2),
    (v_ex, 'She is a dentist.',      false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 2 and complete the email.',
          'O email ditado na terceira conversa.',
          'O email e ryan@blackdent.com.', 2, 10, 5, m2,
          '{"template": "ryan@{{0}}.com"}'::jsonb,
          '{"blanks": [{"accepted": ["blackdent"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 2 and choose.',
          'What is the phone number in the second conversation?',
          'A senhora diz 0162 775212, e o atendente repete para confirmar.', 3, 10, 6, m2)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, '0162 775212', true,  1),
    (v_ex, '0162 755212', false, 2),
    (v_ex, '0126 775212', false, 3);

  -- ---------------- Track 3 ----------------
  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 3 and choose.',
          'How does the man spell his surname?',
          'Ele corrige o atendente: nao e D-A-V-I-S, e D-A-V-I-E-S.', 2, 10, 7, m3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'D-A-V-I-E-S', true,  1),
    (v_ex, 'D-A-V-I-S',   false, 2),
    (v_ex, 'D-A-V-E-S',   false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 3 and complete.',
          'O primeiro nome, escrito como ele soletra.',
          'Ele avisa que e J-O-N, sem H no fim.', 2, 10, 8, m3,
          '{"template": "His first name is {{0}}."}'::jsonb,
          '{"blanks": [{"accepted": ["jon"]}]}'::jsonb);

  -- ---------------- Track 4 ----------------
  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 4 and choose.',
          'How old is Mr Davies?',
          'Ele responde "I''m 34".', 1, 10, 9, m4)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'He is 34.', true,  1),
    (v_ex, 'He is 43.', false, 2),
    (v_ex, 'He is 24.', false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen to Track 4 and choose.',
          'Where does Mr Davies live?',
          'Pegadinha da faixa: ele e britanico, mas mora na Australia.', 3, 10, 10, m4)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'In Australia.',   true,  1),
    (v_ex, 'In the UK.',      false, 2),
    (v_ex, 'In New Zealand.', false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 4 and complete his job.',
          'A profissao dele.',
          'Ele responde "I''m a doctor".', 2, 10, 11, m4,
          '{"template": "He is a {{0}}."}'::jsonb,
          '{"blanks": [{"accepted": ["doctor"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen to Track 4 and complete the email.',
          'O email ditado no fim da conversa.',
          'O email e jd445@netxv.com.', 3, 10, 12, m4,
          '{"template": "{{0}}@netxv.com"}'::jsonb,
          '{"blanks": [{"accepted": ["jd445"]}]}'::jsonb);

  raise notice 'licao 10 remontada com o audio do curso';
end $seed$;
