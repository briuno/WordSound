import "server-only";

import type {
  ExerciseOption,
  ExerciseType,
  Json,
  ServerExercise,
  StudentExercise,
} from "@/lib/exercises/types";

/**
 * Fronteira de seguranca entre servidor e navegador.
 *
 * Tudo que sai daqui pode ir para o cliente. O gabarito (`answer_key`,
 * `is_correct`) e a `explanation` ficam retidos ate a correcao acontecer.
 * Se um campo novo com resposta for adicionado a tabela, ele precisa ser
 * omitido aqui de proposito: o mapeamento e explicito campo a campo,
 * justamente para nao vazar por descuido.
 */

interface ExerciseRow {
  id: number;
  lesson_block_id: number;
  exercise_type: string;
  instruction: string | null;
  question: string;
  explanation: string | null;
  difficulty: number;
  xp_reward: number;
  position: number;
  prompt: Json | null;
  answer_key: Json | null;
  media_id: number | null;
  exercise_options?: OptionRow[] | null;
}

interface OptionRow {
  id: number;
  text: string;
  is_correct: boolean;
  position: number;
}

function mapOptions(rows: OptionRow[] | null | undefined): ExerciseOption[] {
  return (rows ?? [])
    .map((o) => ({ id: o.id, text: o.text, isCorrect: o.is_correct, position: o.position }))
    .sort((a, b) => a.position - b.position);
}

/** Linha crua do banco -> objeto completo. Uso exclusivo do servidor. */
export function toServerExercise(row: ExerciseRow): ServerExercise {
  return {
    id: row.id,
    lessonBlockId: row.lesson_block_id,
    type: row.exercise_type as ExerciseType,
    instruction: row.instruction,
    question: row.question,
    explanation: row.explanation,
    difficulty: row.difficulty,
    xpReward: row.xp_reward,
    position: row.position,
    prompt: row.prompt ?? {},
    answerKey: row.answer_key ?? {},
    mediaId: row.media_id,
    options: mapOptions(row.exercise_options),
  };
}

/**
 * Versao que pode trafegar para o navegador.
 * Omite answerKey, explanation e o is_correct de cada opcao.
 */
export function toStudentExercise(exercise: ServerExercise): StudentExercise {
  return {
    id: exercise.id,
    type: exercise.type,
    instruction: exercise.instruction,
    question: exercise.question,
    difficulty: exercise.difficulty,
    xpReward: exercise.xpReward,
    position: exercise.position,
    prompt: exercise.prompt,
    mediaId: exercise.mediaId,
    options: exercise.options.map((o) => ({ id: o.id, text: o.text })),
  };
}

/** Atalho para o caminho mais comum: linha do banco direto para o aluno. */
export function rowToStudentExercise(row: ExerciseRow): StudentExercise {
  return toStudentExercise(toServerExercise(row));
}
