/**
 * Contratos do exercise engine.
 *
 * Regra de ouro (spec 72): adicionar um tipo novo de exercicio deve custar
 * uma entrada no registry + um componente de UI. Nada mais do sistema muda.
 *
 * O gabarito (`answerKey`, `options[].isCorrect`) nunca sai do servidor.
 * O que vai para o navegador e o `StudentExercise`, montado em lib/dto.ts.
 */

export const EXERCISE_TYPES = [
  "MULTIPLE_CHOICE",
  "TRUE_FALSE",
  "FILL_BLANK",
  "SHORT_ANSWER",
  "ORDER_WORDS",
  "ORDER_SENTENCES",
  "MATCHING",
  "CHOICE_INLINE",
  "LISTENING_MULTIPLE_CHOICE",
  "LISTENING_FILL_BLANK",
  "READING_QUESTION",
  "CATEGORY_SORT",
  "FORM_FILL",
  "CORRECT_SENTENCE",
] as const;

export type ExerciseType = (typeof EXERCISE_TYPES)[number];

export type Json = Record<string, unknown>;

/** Opcao de resposta como existe no banco. `isCorrect` e segredo. */
export interface ExerciseOption {
  id: number;
  text: string;
  isCorrect: boolean;
  position: number;
}

/** Opcao como o aluno recebe: sem o gabarito. */
export interface StudentOption {
  id: number;
  text: string;
}

/** Exercicio completo, uso exclusivo do servidor. */
export interface ServerExercise {
  id: number;
  lessonBlockId: number;
  type: ExerciseType;
  instruction: string | null;
  question: string;
  explanation: string | null;
  difficulty: number;
  xpReward: number;
  position: number;
  prompt: Json;
  answerKey: Json;
  mediaId: number | null;
  options: ExerciseOption[];
}

/** Exercicio como o navegador recebe. Sem answerKey, sem isCorrect, sem explanation. */
export interface StudentExercise {
  id: number;
  type: ExerciseType;
  instruction: string | null;
  question: string;
  difficulty: number;
  xpReward: number;
  position: number;
  prompt: Json;
  mediaId: number | null;
  options: StudentOption[];
}

/** Resposta enviada pelo aluno. O formato varia por tipo. */
export type StudentAnswer =
  | { optionId: number }
  | { value: string | boolean }
  | { values: string[] }
  | { order: string[] }
  | { pairs: [number, number][] };

export interface GradeInput {
  answer: unknown;
  answerKey: Json;
  options: ExerciseOption[];
  prompt: Json;
}

export interface GradeResult {
  isCorrect: boolean;
  /** Versao legivel do gabarito, revelada somente depois da correcao. */
  correctAnswer: string;
}

export type Grader = (input: GradeInput) => GradeResult;

export interface ExerciseDefinition {
  type: ExerciseType;
  label: string;
  /** true quando o exercicio depende de um audio vinculado. */
  needsMedia: boolean;
  /** true quando as respostas vem da tabela exercise_options. */
  usesOptions: boolean;
  grade: Grader;
}
