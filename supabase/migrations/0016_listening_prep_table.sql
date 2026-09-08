-- WordSound — Licao 10 da Unit 1: o "antes de ouvir" vira um roteiro
--
-- Ficou de fora da 0015 porque nasceu na 0012, junto com as transcricoes. E o
-- unico bloco de texto que sobrou em prosa na unidade, e o conteudo dele e um
-- procedimento de tres passos — que se le melhor em tabela do que em paragrafo.

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
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

  select id into v_lesson from public.lessons where module_id = v_module and position = 10;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Ouvir tres vezes com um objetivo diferente em cada uma rende mais do que ouvir dez vezes tentando entender tudo.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Como ouvir cada faixa',
        'columns', jsonb_build_array('Escuta', 'O que fazer', 'Por que'),
        'rows', jsonb_build_array(
          jsonb_build_array('1a', 'inteira, sem parar, na velocidade normal', 'pegar a ideia geral'),
          jsonb_build_array('2a', 'em 0.75x, pausando quando precisar',       'numero, nome soletrado e email so aparecem devagar'),
          jsonb_build_array('3a', 'so o trecho da pergunta',                  'confirmar a resposta antes de marcar')
        )
      )
    ),
    'keyPoints', jsonb_build_array(
      'Nao tente entender palavra por palavra: pegar o que a pergunta pede ja resolve o exercicio.',
      'A transcricao so abre depois que voce responde. Ela existe para conferir, nao para adiantar.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT' and title = 'Antes de ouvir';

  raise notice 'roteiro de listening atualizado';
end $seed$;
