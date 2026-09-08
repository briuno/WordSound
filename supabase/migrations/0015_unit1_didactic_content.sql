-- WordSound — Unit 1: explicacao em tabela, nao em texto corrido
--
-- Os blocos de CONTENT e GRAMMAR da Unit 1 nasceram como paragrafos. Quase
-- todo ponto dessa unidade e paradigma (as tres formas do to be, -teen contra
-- -ty, pais contra nacionalidade) e paradigma se le em tabela, nao em prosa.
--
-- Cada bloco passa a ter, na ordem em que o aluno le:
--   rule       a regra em uma frase
--   tables     o paradigma
--   contrast   o erro tipico de quem fala portugues, ao lado da forma certa
--   keyPoints  o que levar para o exercicio
--   tip        um lembrete final, quando cabe
--
-- Regra e tabela sao tambem o que o aluno reve no "Ver a regra" durante a
-- pratica, entao tudo que se consulta no meio do exercicio mora nesses dois
-- campos.
--
-- Imagem: cada bloco aceita uma, por lesson_blocks.media_id. Suba o arquivo em
-- Midia e escolha no editor do bloco; nada aqui depende disso.
--
-- O conteudo continua sendo proprio, escrito para os mesmos pontos de ensino.

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

  -- ============================================================
  -- Licao 1 — Classroom Language
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 1;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Frase de sala de aula se decora inteira. Nao traduza palavra por palavra: o ingles monta a pergunta de outro jeito.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'O que dizer em cada situacao',
        'columns', jsonb_build_array('Situacao', 'Frase', 'Traducao'),
        'rows', jsonb_build_array(
          jsonb_build_array('Nao ouviu',              'Can you repeat, please?', 'Pode repetir, por favor?'),
          jsonb_build_array('Nao entendeu a palavra', 'What does it mean?',      'O que significa?'),
          jsonb_build_array('Nao sabe escrever',      'How do you spell it?',    'Como se escreve?'),
          jsonb_build_array('Precisa de ajuda',       'Can you help me?',        'Pode me ajudar?'),
          jsonb_build_array('Quer falar mais devagar','Can you speak slowly?',   'Pode falar devagar?')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'What means it?', 'right', 'What does it mean?',
                         'why', 'a pergunta em ingles precisa do auxiliar does antes do sujeito'),
      jsonb_build_object('wrong', 'How do you write it?', 'right', 'How do you spell it?',
                         'why', 'spell e soletrar letra por letra; write e escrever o texto')
    ),
    'keyPoints', jsonb_build_array(
      'Please no fim transforma qualquer pedido em pedido educado.',
      'Sao as frases que voce mais vai usar: valem para a aula, para o app e para uma conversa real.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 2 — Greetings & Introductions
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 2;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'O cumprimento muda com a hora do dia. Hello e Hi servem a qualquer hora.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Pela hora do dia',
        'columns', jsonb_build_array('Horario', 'Cumprimento', 'Quando usar'),
        'rows', jsonb_build_array(
          jsonb_build_array('ate o meio-dia',   'Good morning',   'na chegada'),
          jsonb_build_array('12h as 18h',       'Good afternoon', 'na chegada'),
          jsonb_build_array('depois das 18h',   'Good evening',   'na chegada'),
          jsonb_build_array('qualquer hora',    'Hello / Hi',     'Hi e mais informal'),
          jsonb_build_array('ao ir embora',     'Good night',     'so na despedida')
        )
      ),
      jsonb_build_object(
        'caption', 'Apresentar-se',
        'columns', jsonb_build_array('Pergunta', 'Resposta natural'),
        'rows', jsonb_build_array(
          jsonb_build_array('What is your name?',  'My name is Ana. / I am Ana.'),
          jsonb_build_array('How are you?',        'I am fine, thank you. And you?'),
          jsonb_build_array('Nice to meet you.',   'Nice to meet you, too.'),
          jsonb_build_array('See you tomorrow!',   'See you!')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'Good night! (chegando a uma festa as 20h)',
                         'right', 'Good evening!',
                         'why', 'good night e despedida; quem chega a noite diz good evening')
    ),
    'keyPoints', jsonb_build_array(
      'Hi e informal. Hello serve em qualquer situacao, inclusive no trabalho.',
      'Nice to meet you so se diz no primeiro encontro. Depois disso e Nice to see you.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 3 — Personal Information
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 3;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Idade em ingles usa o verbo to be, nao o verbo ter: I am twenty years old.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'As perguntas de sempre',
        'columns', jsonb_build_array('Pergunta', 'Resposta', 'Informacao'),
        'rows', jsonb_build_array(
          jsonb_build_array('What is your name?',         'My name is Marina.',          'nome'),
          jsonb_build_array('Where are you from?',        'I am from Brazil.',           'pais'),
          jsonb_build_array('How old are you?',           'I am twenty-six years old.',  'idade'),
          jsonb_build_array('What is your phone number?', 'It is nine, eight, seven...', 'telefone'),
          jsonb_build_array('What is your email?',        'marina at gmail dot com',     'email')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'I have twenty years old.', 'right', 'I am twenty years old.',
                         'why', 'idade em ingles e com to be'),
      jsonb_build_object('wrong', 'marina arroba gmail ponto com', 'right', 'marina at gmail dot com',
                         'why', 'o simbolo @ le-se at e o ponto le-se dot')
    ),
    'keyPoints', jsonb_build_array(
      'Telefone se le digito a digito: nine, eight, seven — nao noventa e oito.',
      'Da para encurtar a idade: I am twenty-six. O years old e opcional.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 4 — Jobs & Occupations
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 4;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Profissao no singular pede artigo: I am a teacher. Nunca I am teacher.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'a ou an',
        'columns', jsonb_build_array('A palavra comeca com', 'Artigo', 'Exemplos'),
        'rows', jsonb_build_array(
          jsonb_build_array('som de consoante', 'a',  'a doctor, a nurse, a teacher, a chef'),
          jsonb_build_array('som de vogal',     'an', 'an actor, an architect, an engineer, an electrician')
        )
      ),
      jsonb_build_object(
        'caption', 'Perguntar a profissao',
        'columns', jsonb_build_array('Pergunta', 'Resposta'),
        'rows', jsonb_build_array(
          jsonb_build_array('What do you do?',  'I am a nurse.'),
          jsonb_build_array('What does he do?', 'He is a bus driver.'),
          jsonb_build_array('What does she do?','She is an architect.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'I am teacher.', 'right', 'I am a teacher.',
                         'why', 'em ingles a profissao no singular vem sempre com a ou an'),
      jsonb_build_object('wrong', 'She is a architect.', 'right', 'She is an architect.',
                         'why', 'architect comeca com som de vogal')
    ),
    'keyPoints', jsonb_build_array(
      'O que decide entre a e an e o som, nao a letra.',
      'No plural o artigo desaparece: They are teachers.'
    ),
    'tip', 'Responder so a profissao tambem e natural: — What do you do? — A nurse.'
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 5 — Countries & Nationalities
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 5;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'O pais responde de onde voce vem; a nacionalidade responde o que voce e. Os dois sempre com maiuscula.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Pais e nacionalidade',
        'columns', jsonb_build_array('Pais', 'Nacionalidade', 'Terminacao'),
        'rows', jsonb_build_array(
          jsonb_build_array('Brazil',  'Brazilian',  '-ian'),
          jsonb_build_array('Italy',   'Italian',    '-ian'),
          jsonb_build_array('Russia',  'Russian',    '-ian'),
          jsonb_build_array('Hungary', 'Hungarian',  '-ian'),
          jsonb_build_array('Mexico',  'Mexican',    '-an'),
          jsonb_build_array('Spain',   'Spanish',    '-ish'),
          jsonb_build_array('Poland',  'Polish',     '-ish'),
          jsonb_build_array('France',  'French',     '-ch')
        )
      ),
      jsonb_build_object(
        'caption', 'As duas maneiras de dizer o mesmo',
        'columns', jsonb_build_array('Com o pais', 'Com a nacionalidade'),
        'rows', jsonb_build_array(
          jsonb_build_array('I am from Brazil.',   'I am Brazilian.'),
          jsonb_build_array('She is from Poland.', 'She is Polish.'),
          jsonb_build_array('They are from Italy.','They are Italian.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'I am brazilian.', 'right', 'I am Brazilian.',
                         'why', 'nacionalidade leva maiuscula mesmo no meio da frase'),
      jsonb_build_object('wrong', 'I am from Brazilian.', 'right', 'I am from Brazil.',
                         'why', 'depois de from vem o pais, nao a nacionalidade')
    ),
    'keyPoints', jsonb_build_array(
      'Nao existe uma regra unica de terminacao: -ian, -ish, -an e -ch convivem.',
      'Pais, nacionalidade e idioma costumam andar juntos: Spain, Spanish, Spanish.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 6 — Numbers 0-100
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 6;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'A terminacao diz tudo: -teen e adolescente (13 a 19), -ty e dezena (20, 30, 40...).',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'O par que mais confunde',
        'columns', jsonb_build_array('Numero', '-teen', 'Numero', '-ty'),
        'rows', jsonb_build_array(
          jsonb_build_array('13', 'thirteen',  '30', 'thirty'),
          jsonb_build_array('14', 'fourteen',  '40', 'forty'),
          jsonb_build_array('15', 'fifteen',   '50', 'fifty'),
          jsonb_build_array('16', 'sixteen',   '60', 'sixty'),
          jsonb_build_array('17', 'seventeen', '70', 'seventy'),
          jsonb_build_array('18', 'eighteen',  '80', 'eighty'),
          jsonb_build_array('19', 'nineteen',  '90', 'ninety')
        )
      ),
      jsonb_build_object(
        'caption', 'Como escrever',
        'columns', jsonb_build_array('Numero', 'Por extenso', 'Regra'),
        'rows', jsonb_build_array(
          jsonb_build_array('21',  'twenty-one',  'dezena + hifen + unidade'),
          jsonb_build_array('45',  'forty-five',  'dezena + hifen + unidade'),
          jsonb_build_array('99',  'ninety-nine', 'dezena + hifen + unidade'),
          jsonb_build_array('100', 'one hundred', 'sem hifen')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'fourty', 'right', 'forty', 'why', '40 perde o u de four'),
      jsonb_build_object('wrong', 'twenty one', 'right', 'twenty-one', 'why', 'de 21 a 99 as duas partes vao unidas por hifen')
    ),
    'keyPoints', jsonb_build_array(
      'Na fala, fifteen tem a forca na segunda silaba e fifty na primeira.',
      'Numero de telefone se le digito a digito, nunca em dezenas.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 7 — Verb To Be
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 7;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'No presente o to be tem so tres formas: am, is e are.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'As tres formas, nos tres usos',
        'columns', jsonb_build_array('Sujeito', 'Afirmativo', 'Forma curta', 'Negativo', 'Pergunta'),
        'rows', jsonb_build_array(
          jsonb_build_array('I',                'I am',    'I''m',    'I''m not',   'Am I...?'),
          jsonb_build_array('you / we / they',  'you are', 'you''re', 'you aren''t','Are you...?'),
          jsonb_build_array('he / she / it',    'he is',   'he''s',   'he isn''t',  'Is he...?')
        )
      ),
      jsonb_build_object(
        'caption', 'Respostas curtas',
        'columns', jsonb_build_array('Pergunta', 'Sim', 'Nao'),
        'rows', jsonb_build_array(
          jsonb_build_array('Are you a student?', 'Yes, I am.',   'No, I''m not.'),
          jsonb_build_array('Is she Brazilian?',  'Yes, she is.', 'No, she isn''t.'),
          jsonb_build_array('Are they teachers?', 'Yes, they are.','No, they aren''t.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'You are a doctor?', 'right', 'Are you a doctor?',
                         'why', 'na pergunta o verbo vem antes do sujeito'),
      jsonb_build_object('wrong', 'Yes, I''m.', 'right', 'Yes, I am.',
                         'why', 'a resposta curta afirmativa nunca usa a forma contraida'),
      jsonb_build_object('wrong', 'I have hungry.', 'right', 'I am hungry.',
                         'why', 'fome, frio, medo e idade vao com to be')
    ),
    'keyPoints', jsonb_build_array(
      'To be cobre ser e estar: o ingles nao separa os dois verbos.',
      'Na negativa as tres formas valem: she is not, she isn''t, she''s not.'
    ),
    'tip', 'Quando travar, pergunte-se quem e o sujeito. Ele escolhe a forma sozinho: I pede am, he/she/it pede is, o resto pede are.'
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================
  -- Licao 8 — Possessive Adjectives
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 8;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'O possessivo concorda com o dono, nunca com a coisa: my book e my books.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'Sujeito e possessivo',
        'columns', jsonb_build_array('Sujeito', 'Possessivo', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('I',    'my',    'My name is Paulo.'),
          jsonb_build_array('you',  'your',  'Your car is new.'),
          jsonb_build_array('he',   'his',   'His last name is Vickers.'),
          jsonb_build_array('she',  'her',   'Her house is on Baker Street.'),
          jsonb_build_array('we',   'our',   'Our office is downtown.'),
          jsonb_build_array('they', 'their', 'Their books are here.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'He''s name is Bob.', 'right', 'His name is Bob.',
                         'why', 'he''s e a forma curta de he is; o possessivo e his'),
      jsonb_build_object('wrong', 'They''re house is big.', 'right', 'Their house is big.',
                         'why', 'they''re e they are; o possessivo e their'),
      jsonb_build_object('wrong', 'Mys books', 'right', 'My books',
                         'why', 'o possessivo nao vai para o plural em ingles')
    ),
    'keyPoints', jsonb_build_array(
      'His para homem e her para mulher: vale o sexo do dono, nao o do objeto.',
      'O possessivo vem sempre antes do substantivo.'
    ),
    'tip', 'Teste rapido: se der para trocar por he is, escreva he''s. Se nao der, e his.'
  ) where lesson_id = v_lesson and block_type = 'GRAMMAR';

  -- ============================================================
  -- Licao 11 — Writing
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 11;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Uma apresentacao curta tem quatro informacoes: nome, origem, profissao e idade.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'A estrutura, parte por parte',
        'columns', jsonb_build_array('Parte', 'Modelo', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('Cumprimento', 'Hello.',                  'Hello.'),
          jsonb_build_array('Nome',        'My name is ___.',         'My name is Marina Costa.'),
          jsonb_build_array('Origem',      'I am from ___. I am ___.','I am from Brazil. I am Brazilian.'),
          jsonb_build_array('Profissao',   'I am a/an ___.',          'I am a nurse.'),
          jsonb_build_array('Idade',       'I am ___ years old.',     'I am twenty-six years old.')
        )
      ),
      jsonb_build_object(
        'caption', 'O que leva maiuscula',
        'columns', jsonb_build_array('Sempre com maiuscula', 'Exemplo'),
        'rows', jsonb_build_array(
          jsonb_build_array('inicio da frase',       'My name is Marina.'),
          jsonb_build_array('o pronome I',           '...and I am a nurse.'),
          jsonb_build_array('nome e sobrenome',      'Marina Costa'),
          jsonb_build_array('pais e nacionalidade',  'Brazil, Brazilian'),
          jsonb_build_array('cidade e rua',          'Sao Paulo, Baker Street'),
          jsonb_build_array('titulos',               'Mr., Mrs., Ms., Dr.')
        )
      )
    ),
    'contrast', jsonb_build_array(
      jsonb_build_object('wrong', 'i am from brazil.', 'right', 'I am from Brazil.',
                         'why', 'o pronome I e o nome do pais levam maiuscula sempre')
    ),
    'keyPoints', jsonb_build_array(
      'Titulo abreviado leva ponto: Mr., Mrs., Ms., Dr.',
      'O pronome I e maiusculo em qualquer posicao da frase.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  -- ============================================================
  -- Licao 12 — Unit Review
  -- ============================================================
  select id into v_lesson from public.lessons where module_id = v_module and position = 12;

  update public.lesson_blocks set content = jsonb_build_object(
    'rule', 'Esta revisao mistura a unidade inteira. Errar aqui e util: o que voce errar vai para a area de Revisao.',
    'tables', jsonb_build_array(
      jsonb_build_object(
        'caption', 'A unidade em uma tabela',
        'columns', jsonb_build_array('Licao', 'Ponto', 'O lembrete'),
        'rows', jsonb_build_array(
          jsonb_build_array('1 e 2', 'Sala de aula e cumprimentos', 'good evening na chegada, good night na despedida'),
          jsonb_build_array('3',     'Dados pessoais',              'idade com to be'),
          jsonb_build_array('4',     'Profissoes',                  'sempre com a ou an'),
          jsonb_build_array('5',     'Paises e nacionalidades',     'maiuscula sempre'),
          jsonb_build_array('6',     'Numeros',                     '-teen contra -ty, hifen de 21 a 99'),
          jsonb_build_array('7',     'Verbo to be',                 'am, is, are'),
          jsonb_build_array('8',     'Possessivos',                 'my, your, his, her, our, their')
        )
      )
    ),
    'keyPoints', jsonb_build_array(
      'Nao decore a tabela agora: use o botao Ver a regra durante os exercicios.',
      'Errar de proposito para testar uma hipotese tambem ensina — e o erro volta na revisao.'
    )
  ) where lesson_id = v_lesson and block_type = 'CONTENT';

  raise notice 'Unit 1 reescrita em tabela';
end $seed$;
