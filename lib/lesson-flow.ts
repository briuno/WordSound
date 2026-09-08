import type { StudentExercise } from "@/lib/exercises/types";
import type { LessonBlock, LessonDetail, StudentMedia } from "@/lib/queries";

/**
 * Transforma a licao em uma fila de etapas, uma por tela, na ordem do livro.
 *
 * O cadastro guarda as faixas de audio como blocos LISTENING seguidos e joga
 * todas as perguntas em um unico bloco EXERCISE no fim, cada pergunta apontando
 * para a sua faixa por `media_id`. Renderizado nessa ordem, o aluno recebe tres
 * players empilhados na mesma tela, sem saber o que fazer com nenhum deles, e
 * so muito depois as perguntas — que ainda repetem o mesmo audio uma vez por
 * pergunta.
 *
 * Aqui a pergunta volta para junto da faixa de que ela fala. Cada faixa vira
 * uma sequencia: introducao e audio, depois as perguntas daquela faixa, depois
 * a proxima faixa. O `media_id` da pergunta e o que faz essa costura, entao
 * nenhum conteudo precisa ser recadastrado.
 */

export type StudyStep = {
  kind: "study";
  key: string;
  block: LessonBlock;
  media?: StudentMedia;
  /** quantas telas de pergunta vem imediatamente depois desta */
  questionCount: number;
};

export type ExerciseStep = {
  kind: "exercise";
  key: string;
  exercise: StudentExercise;
  media?: StudentMedia;
  /** ultima pergunta da faixa: e aqui que a transcricao pode abrir */
  endsTrack: boolean;
};

export type LessonStep = StudyStep | ExerciseStep;

/** Blocos que o aluno le. O resto (EXERCISE, AI_REVIEW) so carrega exercicio. */
const CONTENT_TYPES = new Set(["CONTENT", "GRAMMAR", "VOCABULARY", "READING", "LISTENING"]);

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function asText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * Se um bloco tem algo na tela. Espelha as condicoes de LessonContentBlock: um
 * bloco vazio nao renderiza nada, e agora que cada bloco ocupa uma tela inteira
 * isso seria uma pagina em branco com um botao de continuar.
 */
export function hasBlockContent(
  type: string,
  content: Record<string, unknown>,
  media?: StudentMedia,
): boolean {
  switch (type) {
    case "CONTENT":
    case "GRAMMAR":
      return Boolean(
        asText(content.rule) ||
          asText(content.tip) ||
          media?.kind === "image" ||
          asArray(content.paragraphs).length ||
          asArray(content.tables).length ||
          asArray(content.contrast).length ||
          asArray(content.keyPoints).length,
      );
    case "VOCABULARY":
      return asArray(content.items).length > 0;
    case "READING":
      return asText(content.text).length > 0;
    case "LISTENING":
      // sempre entra: o proprio player e o conteudo, e sem audio a tela ainda
      // precisa dizer que a faixa esta indisponivel
      return true;
    default:
      return false;
  }
}

export function buildLessonSteps(lesson: LessonDetail): LessonStep[] {
  const mediaOf = (id: number | null | undefined) =>
    typeof id === "number" ? lesson.media[id] : undefined;

  const allExercises = lesson.blocks.flatMap((b) => b.exercises);

  // So puxa pergunta a faixa que tem um bloco LISTENING proprio. Um exercicio
  // com audio avulso, sem bloco, continua tocando dentro da propria pergunta.
  const tracks = new Set(
    lesson.blocks
      .filter((b) => b.type === "LISTENING" && typeof b.mediaId === "number")
      .map((b) => b.mediaId as number),
  );

  const byTrack = new Map<number, StudentExercise[]>();
  const claimed = new Set<number>();
  for (const exercise of allExercises) {
    const id = exercise.mediaId;
    if (typeof id !== "number" || !tracks.has(id)) continue;
    const list = byTrack.get(id) ?? [];
    list.push(exercise);
    byTrack.set(id, list);
    claimed.add(exercise.id);
  }
  const endsTrack = new Set([...byTrack.values()].map((list) => list[list.length - 1].id));

  const steps: LessonStep[] = [];
  const emitted = new Set<number>();

  function pushExercises(list: StudentExercise[]) {
    for (const exercise of list) {
      if (emitted.has(exercise.id)) continue;
      emitted.add(exercise.id);
      steps.push({
        kind: "exercise",
        key: `exercise-${exercise.id}`,
        exercise,
        media: mediaOf(exercise.mediaId),
        endsTrack: endsTrack.has(exercise.id),
      });
    }
  }

  for (const block of lesson.blocks) {
    const own = block.exercises.filter((e) => !claimed.has(e.id));

    if (!CONTENT_TYPES.has(block.type)) {
      pushExercises(own);
      continue;
    }

    const media = mediaOf(block.mediaId);
    const track =
      block.type === "LISTENING" && typeof block.mediaId === "number"
        ? (byTrack.get(block.mediaId) ?? [])
        : [];

    if (hasBlockContent(block.type, block.content, media)) {
      steps.push({ kind: "study", key: `block-${block.id}`, block, media, questionCount: 0 });
    }
    pushExercises(track);
    pushExercises(own);
  }

  // Rede de seguranca: uma pergunta em um bloco de tipo desconhecido ainda
  // precisa ser respondida, senao a licao nunca fecha.
  pushExercises(allExercises.filter((e) => !emitted.has(e.id)));

  // So agora da para contar: o que vale para o aluno e quantas telas de
  // pergunta vem em seguida, nao de qual bloco elas foram cadastradas.
  for (const [i, current] of steps.entries()) {
    if (current.kind !== "study") continue;
    let n = 0;
    while (steps[i + 1 + n]?.kind === "exercise") n++;
    current.questionCount = n;
  }

  return steps;
}
