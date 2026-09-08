-- WordSound — Unit 2: explicacao em tabela, nao em texto corrido
--
-- Mesma reescrita que a 0015 fez na Unit 1, agora nos dez blocos de texto da
-- Unit 2. A unidade e ainda mais tabelavel que a primeira: have got, caso
-- possessivo, this/that/these/those e a formacao do plural sao quatro grades.
--
-- Campos: rule, tables, contrast, keyPoints e tip — nessa ordem na tela.
-- rule, tables e keyPoints sao o que o aluno reve no "Ver a regra" durante a
-- pratica, entao tudo que se consulta no meio do exercicio mora neles.

do $seed$
declare
  v_module bigint;
  v_lesson bigint;
begin
  select m.id into v_module
  from public.modules m join public.courses c on c.id = m.course_id
  where c.slug = 'english-basics' and m.position = 2;

  if v_module is null then
    raise notice 'Unit 2 ausente';
    return;
  end if;

  -- ============================================================ 1. Colours & Personal Items
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Em ingles o adjetivo vem antes do substantivo: a black phone, nunca a phone black.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Perguntar e responder',
        'columns', jsonb_build_array('Pergunta', 'Quando', 'Resposta'),
        'rows', jsonb_build_array(
          jsonb_build_array('What colour is it?',    'a qualquer distancia', 'It is blue.'),
          jsonb_build_array('What is this?',         'objeto perto',         'This is a folder.'),
          jsonb_build_array('What is that?',         'objeto longe',         'That is an umbrella.'),
          jsonb_build_array('Is that your tablet?',  'confirmando',          'Yes, it is. / No, it isn''t.')
        )
      ),
      jsonb_build_object(
        'caption', 'A ordem das palavras',
        'columns', jsonb_build_array('Portugues', 'Ingles'),
        'rows', jsonb_build_array(
          jsonb_build_array('uma mochila preta',  'a black backpack'),
          jsonb_build_array('o celular branco',   'the white phone'),
          jsonb_build_array('dois lapis verdes',  'two green pencils')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'a phone black', 'right', 'a black phone',
                         'why', 'a cor vem antes do objeto, ao contrario do portugues'),
      jsonb_build_object('wrong', 'The phone is a black.', 'right', 'The phone is black.',
                         'why', 'depois de to be o adjetivo vem sozinho, sem artigo'),
      jsonb_build_object('wrong', 'two greens pencils', 'right', 'two green pencils',
                         'why', 'adjetivo em ingles nunca vai para o plural')
    ),
    'keyPoints', jsonb_build_array(
      'Colour com u e a grafia britanica, a do livro. Color sem u e americana: as duas estao certas.',
      'O adjetivo nao muda nunca: green pencil, green pencils.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================ 2. Family
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Parents e pai e mae. Parente em geral e relative: as duas palavras nao se traduzem uma pela outra.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Os pares da familia',
        'columns', jsonb_build_array('Homem', 'Mulher', 'Os dois juntos'),
        'rows', jsonb_build_array(
          jsonb_build_array('father',      'mother',      'parents (pai e mae)'),
          jsonb_build_array('brother',     'sister',      'siblings (irmaos)'),
          jsonb_build_array('son',         'daughter',    'children (filhos)'),
          jsonb_build_array('grandfather', 'grandmother', 'grandparents (avos)'),
          jsonb_build_array('husband',     'wife',        '—'),
          jsonb_build_array('uncle',       'aunt',        '—'),
          jsonb_build_array('cousin',      'cousin',      'a mesma palavra para primo e prima')
        )
      ),
      jsonb_build_object(
        'caption', 'Perguntar sobre a familia',
        'columns', jsonb_build_array('Pergunta', 'Resposta'),
        'rows', jsonb_build_array(
          jsonb_build_array('Have you got any brothers or sisters?', 'Yes, I have got two sisters.'),
          jsonb_build_array('Have you got any children?',            'No, I haven''t.'),
          jsonb_build_array('Who is this?',                          'This is my grandmother.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'All my parents are at the party.', 'right', 'All my relatives are at the party.',
                         'why', 'parents e so o pai e a mae; parentes em geral sao relatives'),
      jsonb_build_object('wrong', 'She is my cousin girl.', 'right', 'She is my cousin.',
                         'why', 'cousin serve para primo e para prima')
    ),
    'keyPoints', jsonb_build_array(
      'Any aparece na pergunta: Have you got any brothers?',
      'Grand- monta a geracao de cima: grandfather, grandmother, grandparents.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================ 3. Have Got
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Have got e ter. Existem so duas formas: have got e has got.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Have got, nos tres usos',
        'columns', jsonb_build_array('Sujeito', 'Afirmativo', 'Forma curta', 'Negativo', 'Pergunta'),
        'rows', jsonb_build_array(
          jsonb_build_array('I / you / we / they', 'have got', 'I''ve got',  'haven''t got', 'Have you got...?'),
          jsonb_build_array('he / she / it',       'has got',  'he''s got',  'hasn''t got',  'Has he got...?')
        )
      ),
      jsonb_build_object(
        'caption', 'Respostas curtas',
        'columns', jsonb_build_array('Pergunta', 'Sim', 'Nao'),
        'rows', jsonb_build_array(
          jsonb_build_array('Have you got a car?',    'Yes, I have.', 'No, I haven''t.'),
          jsonb_build_array('Has he got a sister?',   'Yes, he has.', 'No, he hasn''t.'),
          jsonb_build_array('Have they got a house?', 'Yes, they have.', 'No, they haven''t.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'He have got a car.', 'right', 'He has got a car.',
                         'why', 'he, she e it sempre pedem has'),
      jsonb_build_object('wrong', 'Do you have got a car?', 'right', 'Have you got a car?',
                         'why', 'have got faz a pergunta sozinho, sem do'),
      jsonb_build_object('wrong', 'Yes, I have got.', 'right', 'Yes, I have.',
                         'why', 'a resposta curta para no auxiliar, sem o got')
    ),
    'keyPoints', jsonb_build_array(
      'A forma curta ''s serve para is e para has: He''s tall (is) e He''s got a car (has).',
      'O ingles americano prefere have sem got: Do you have a car?'
    ),
    'tip', 'Have got so existe no presente. Falando do passado volta o had: I had a bike.'
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================ 4. Possessive Case
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'A ordem e o contrario do portugues: primeiro o dono, depois a coisa. O celular da Ana e Ana''s phone.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Onde vai o apostrofo',
        'columns', jsonb_build_array('O dono', 'Recebe', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('singular',              'apostrofo + s',      'Ana''s phone, my brother''s car'),
          jsonb_build_array('plural terminado em s', 'so o apostrofo',     'my parents'' house, the students'' books'),
          jsonb_build_array('plural irregular',      'apostrofo + s',      'the children''s room, the women''s bags'),
          jsonb_build_array('dois donos',            'so no ultimo nome',  'Ana and Rita''s mother')
        )
      ),
      jsonb_build_object(
        'caption', 'Portugues e ingles lado a lado',
        'columns', jsonb_build_array('Portugues', 'Ingles'),
        'rows', jsonb_build_array(
          jsonb_build_array('o celular da Ana',      'Ana''s phone'),
          jsonb_build_array('o carro do meu irmao',  'my brother''s car'),
          jsonb_build_array('a casa dos meus pais',  'my parents'' house')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'the phone of Ana', 'right', 'Ana''s phone',
                         'why', 'para pessoa o ingles usa o apostrofo, nao of'),
      jsonb_build_object('wrong', 'my parents''s house', 'right', 'my parents'' house',
                         'why', 'plural que ja termina em s leva so o apostrofo'),
      jsonb_build_object('wrong', 'my brothers car', 'right', 'my brother''s car',
                         'why', 'sem o apostrofo a palavra vira plural, nao posse')
    ),
    'keyPoints', jsonb_build_array(
      'Para objeto o ingles prefere of: the door of the car.',
      'Its e possessivo (its name); it''s e it is. O apostrofo separa duas coisas diferentes.'
    )
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================ 5. This / That / These / Those
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Duas perguntas decidem a palavra: esta perto ou longe? e um ou varios?',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'A grade inteira',
        'columns', jsonb_build_array('Distancia', 'Um', 'Varios'),
        'rows', jsonb_build_array(
          jsonb_build_array('perto', 'this', 'these'),
          jsonb_build_array('longe', 'that', 'those')
        )
      ),
      jsonb_build_object(
        'caption', 'E o verbo que vem junto',
        'columns', jsonb_build_array('Frase', 'Verbo'),
        'rows', jsonb_build_array(
          jsonb_build_array('This is my pen.',        'is'),
          jsonb_build_array('These are my keys.',     'are'),
          jsonb_build_array('That is your bag.',      'is'),
          jsonb_build_array('Those are their books.', 'are')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'This are my keys.', 'right', 'These are my keys.',
                         'why', 'this e singular; para varios use these, com are'),
      jsonb_build_object('wrong', 'Look at those car.', 'right', 'Look at that car.',
                         'why', 'those e plural; um carro so pede that')
    ),
    'keyPoints', jsonb_build_array(
      'This e that pedem is. These e those pedem are.',
      'A escolha comeca pela distancia e so depois olha a quantidade.'
    ),
    'tip', 'Ao telefone as duas aparecem juntas: This is Ana. (quem fala) e Is that Rita? (quem ouve).'
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================ 6. Plurals
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'A regra e acrescentar s. O que muda e a terminacao da palavra, e e ela que manda.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Como formar',
        'columns', jsonb_build_array('A palavra termina em', 'Faz', 'Exemplos'),
        'rows', jsonb_build_array(
          jsonb_build_array('qualquer outra coisa', 'acrescenta s',  'book → books, pen → pens'),
          jsonb_build_array('s, ss, sh, ch, x',     'acrescenta es', 'bus → buses, watch → watches, box → boxes'),
          jsonb_build_array('consoante + y',        'y vira ies',    'city → cities, family → families'),
          jsonb_build_array('vogal + y',            'acrescenta s',  'day → days, boy → boys'),
          jsonb_build_array('f ou fe',              'vira ves',      'knife → knives, shelf → shelves')
        )
      ),
      jsonb_build_object(
        'caption', 'Os que nao seguem regra',
        'columns', jsonb_build_array('Singular', 'Plural'),
        'rows', jsonb_build_array(
          jsonb_build_array('man',    'men'),
          jsonb_build_array('woman',  'women'),
          jsonb_build_array('child',  'children'),
          jsonb_build_array('person', 'people'),
          jsonb_build_array('foot',   'feet'),
          jsonb_build_array('tooth',  'teeth')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'two familys', 'right', 'two families',
                         'why', 'consoante antes do y: o y vira ies'),
      jsonb_build_object('wrong', 'three childrens', 'right', 'three children',
                         'why', 'children ja e o plural de child'),
      jsonb_build_object('wrong', 'many peoples', 'right', 'many people',
                         'why', 'people ja e o plural de person')
    ),
    'keyPoints', jsonb_build_array(
      'O es acrescenta uma silaba na fala: bus tem uma, buses tem duas.',
      'Adjetivo continua no singular: two black phones.'
    )
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================ 7. Appearance
  select id into v_lesson from public.lessons where module_id = v_module and position = 7;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Corpo e idade vao com to be; cabelo e olhos vao com have got.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Qual verbo usar',
        'columns', jsonb_build_array('O que voce descreve', 'Verbo', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('altura e corpo', 'to be',    'He is tall and slim.'),
          jsonb_build_array('idade',          'to be',    'She is middle-aged.'),
          jsonb_build_array('cabelo',         'have got', 'He has got short grey hair.'),
          jsonb_build_array('olhos',          'have got', 'She has got blue eyes.')
        )
      ),
      jsonb_build_object(
        'caption', 'A ordem dos adjetivos do cabelo',
        'columns', jsonb_build_array('Comprimento', 'Cor', 'Como fica junto'),
        'rows', jsonb_build_array(
          jsonb_build_array('short', 'dark',   'short dark hair'),
          jsonb_build_array('long',  'blonde', 'long blonde hair'),
          jsonb_build_array('short', 'grey',   'short grey hair')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'He is short dark hair.', 'right', 'He has got short dark hair.',
                         'why', 'cabelo se tem, entao vai com have got'),
      jsonb_build_object('wrong', 'He has got tall.', 'right', 'He is tall.',
                         'why', 'altura se e, entao vai com to be'),
      jsonb_build_object('wrong', 'dark short hair', 'right', 'short dark hair',
                         'why', 'o comprimento vem antes da cor')
    ),
    'keyPoints', jsonb_build_array(
      'Hair e incontavel: nunca hairs.',
      'Idade aproximada em tres palavras: young, middle-aged, old.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================ 9. Listening
  select id into v_lesson from public.lessons where module_id = v_module and position = 9;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Cada faixa tem uma coisa para cacar. Saber o que procurar antes de dar play vale mais do que repetir a faixa.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'O que ouvir em cada faixa',
        'columns', jsonb_build_array('Faixa', 'Situacao', 'Preste atencao em'),
        'rows', jsonb_build_array(
          jsonb_build_array('1', 'amigos falando de aparelhos',     'as cores e de quem e cada aparelho'),
          jsonb_build_array('2', 'revista de bagagem no aeroporto', 'os objetos e o this, that, these, those'),
          jsonb_build_array('3', 'dois colegas sobre um professor', 'altura, cabelo e idade')
        )
      )
    ),
    'keyPoints', jsonb_build_array(
      'Primeira escuta inteira, na velocidade normal. Segunda em 0.75x, pausando onde precisar.',
      'A transcricao so abre depois que voce responde: ela existe para conferir, nao para adiantar.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT' and title = 'Antes de ouvir';

  -- ============================================================ 10. Writing
  select id into v_lesson from public.lessons where module_id = v_module and position = 10;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'O apostrofo faz duas coisas diferentes nesta unidade: forma curta (it''s = it is) e posse (Ana''s phone).',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'A pontuacao',
        'columns', jsonb_build_array('Sinal', 'Para que serve', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('.',  'fecha a frase',            'This is my laptop.'),
          jsonb_build_array('?',  'fecha a pergunta',         'Is that your tablet?'),
          jsonb_build_array('!',  'fecha a exclamacao',       'What a nice phone!'),
          jsonb_build_array(',',  'separa os itens da lista', 'a laptop, a phone and my keys'),
          jsonb_build_array('''', 'forma curta e posse',      'it''s new / Ana''s phone')
        )
      ),
      jsonb_build_object(
        'caption', 'its ou it''s',
        'columns', jsonb_build_array('Escreva', 'Quando', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('it''s', 'da para trocar por it is',   'It''s new.'),
          jsonb_build_array('its',   'e posse, como his e her',    'The phone and its case.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'Its new.', 'right', 'It''s new.',
                         'why', 'aqui cabe it is, entao leva apostrofo'),
      jsonb_build_object('wrong', 'The dog ate it''s food.', 'right', 'The dog ate its food.',
                         'why', 'posse nao leva apostrofo em its'),
      jsonb_build_object('wrong', 'a laptop a phone and my keys', 'right', 'a laptop, a phone and my keys',
                         'why', 'a virgula separa os itens; antes do and costuma nao levar')
    ),
    'keyPoints', jsonb_build_array(
      'Um paragrafo que descreve alguem segue esta ordem: quem e, aparencia, o que tem, o que voce acha.',
      'Teste do apostrofo: se it is couber na frase, escreva it''s.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================ 11. Unit Review
  select id into v_lesson from public.lessons where module_id = v_module and position = 11;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Esta revisao mistura a unidade inteira. Errar aqui e util: o que voce errar vai para a area de Revisao.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'A unidade em uma tabela',
        'columns', jsonb_build_array('Licao', 'Ponto', 'O lembrete'),
        'rows', jsonb_build_array(
          jsonb_build_array('1',  'Cores e objetos',  'o adjetivo vem antes do substantivo'),
          jsonb_build_array('2',  'Familia',          'parents e pai e mae; parente e relative'),
          jsonb_build_array('3',  'Have got',         'have got e has got, e a pergunta nao usa do'),
          jsonb_build_array('4',  'Caso possessivo',  'dono + apostrofo s + a coisa'),
          jsonb_build_array('5',  'This e that',      'perto ou longe, um ou varios'),
          jsonb_build_array('6',  'Plural',           's, es, ies e os irregulares'),
          jsonb_build_array('7',  'Aparencia',        'to be para o corpo, have got para o cabelo'),
          jsonb_build_array('10', 'Pontuacao',        'it''s e it is; its e posse')
        )
      )
    ),
    'keyPoints', jsonb_build_array(
      'Nao decore a tabela agora: o botao Ver a regra mostra ela durante os exercicios.',
      'O que passar batido aqui volta na Revisao, entao vale responder com calma.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  raise notice 'Unit 2 reescrita em tabela';
end $seed$;
