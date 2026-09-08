-- WordSound — Milestone 2: Storage, listening e midia
--
-- O bucket 'lesson-media' e privado. O aluno nunca recebe URL permanente:
-- o servidor gera uma signed URL de curta duracao por render. Assim o audio
-- do curso nao vira link publico compartilhavel.

-- ============================ policies do storage ============================
create policy "lesson_media_read" on storage.objects
  for select to authenticated
  using (bucket_id = 'lesson-media');

create policy "lesson_media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'lesson-media' and (select private.is_admin()));

create policy "lesson_media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'lesson-media' and (select private.is_admin()))
  with check (bucket_id = 'lesson-media' and (select private.is_admin()));

create policy "lesson_media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'lesson-media' and (select private.is_admin()));

-- ============================ conteudo de listening ============================
do $seed$
declare
  v_module bigint;
  v_lesson bigint;
  v_block  bigint;
  v_ex     bigint;
  m1 bigint; m2 bigint; m3 bigint;
begin
  select m.id into v_module
  from public.modules m
  join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics'
  order by m.position
  limit 1;

  if v_module is null then
    raise notice 'curso base ausente, nada a semear';
    return;
  end if;

  select id into v_lesson from public.lessons where module_id = v_module and position = 10;

  if exists (select 1 from public.lesson_blocks where lesson_id = v_lesson and block_type = 'LISTENING') then
    raise notice 'listening ja semeado';
    return;
  end if;

  -- ---------------- midia ----------------
  insert into public.media (kind, title, storage_path, mime_type, duration_seconds, size_bytes, transcript) values
    ('audio', 'Marina introduces herself', 'audio/listening-01-marina.wav', 'audio/wav', 12.12, 534444,
     'Hello! My name is Marina. I am twenty six years old and I am from Brazil. I am a nurse and I work at a small hospital.')
  returning id into m1;

  insert into public.media (kind, title, storage_path, mime_type, duration_seconds, size_bytes, transcript) values
    ('audio', 'This is my friend Paulo', 'audio/listening-02-paulo.wav', 'audio/wav', 11.33, 499834,
     'Good morning. This is my friend Paulo. He is a teacher and he is from Portugal. He works at a language school.')
  returning id into m2;

  insert into public.media (kind, title, storage_path, mime_type, duration_seconds, size_bytes, transcript) values
    ('audio', 'Asking for a phone number', 'audio/listening-03-phone.wav', 'audio/wav', 11.04, 486838,
     'Excuse me, what is your phone number? My number is nine, one, four, two, three, seven.')
  returning id into m3;

  -- ---------------- blocos ----------------
  insert into public.lesson_blocks (lesson_id, block_type, title, content, position) values
    (v_lesson, 'CONTENT', 'Antes de ouvir',
     jsonb_build_object('paragraphs', jsonb_build_array(
       'Ouca uma vez inteira sem parar. Na primeira escuta, tente pegar so a ideia geral.',
       'Depois use a velocidade 0.75x e repita. Detalhes como numeros e profissoes aparecem melhor na segunda vez.',
       'A transcricao fica escondida de proposito. Abra so depois de responder.'
     )), 1);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position)
  values (v_lesson, 'LISTENING', 'Track 1 — Marina',
          jsonb_build_object('instructions', 'Ouca e responda as perguntas abaixo.'), m1, 2);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position)
  values (v_lesson, 'LISTENING', 'Track 2 — Paulo',
          jsonb_build_object('instructions', 'Preste atencao na profissao e no pais.'), m2, 3);

  insert into public.lesson_blocks (lesson_id, block_type, title, content, media_id, position)
  values (v_lesson, 'LISTENING', 'Track 3 — Phone number',
          jsonb_build_object('instructions', 'Anote os numeros enquanto ouve.'), m3, 4);

  -- ---------------- exercicios ----------------
  insert into public.lesson_blocks (lesson_id, block_type, title, content, position)
  values (v_lesson, 'EXERCISE', 'Pratique', '{}'::jsonb, 5)
  returning id into v_block;

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
          'What is Marina''s job?',
          'Ela diz "I am a nurse and I work at a small hospital".', 1, 10, 1, m1)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, 'She is a nurse.',  true,  1),
    (v_ex, 'She is a doctor.', false, 2),
    (v_ex, 'She is a nanny.',  false, 3);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id, prompt, answer_key)
  values (v_block, 'LISTENING_FILL_BLANK', 'Listen and complete.',
          'Complete a frase sobre o Paulo.',
          'O audio diz "He is a teacher and he is from Portugal".', 2, 10, 2, m2,
          '{"template": "He is a {{0}} and he is from Portugal."}'::jsonb,
          '{"blanks": [{"accepted": ["teacher"]}]}'::jsonb);

  insert into public.exercises (lesson_block_id, exercise_type, instruction, question, explanation, difficulty, xp_reward, position, media_id)
  values (v_block, 'LISTENING_MULTIPLE_CHOICE', 'Listen and choose.',
          'What is the phone number?',
          'O audio soletra nine, one, four, two, three, seven.', 2, 10, 3, m3)
  returning id into v_ex;
  insert into public.exercise_options (exercise_id, text, is_correct, position) values
    (v_ex, '9 1 4 2 3 7', true,  1),
    (v_ex, '9 1 4 2 7 3', false, 2),
    (v_ex, '9 4 1 2 3 7', false, 3);

  raise notice 'listening semeado na licao %', v_lesson;
end $seed$;
