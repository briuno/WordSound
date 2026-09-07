/**
 * Registry do exercise engine: tipo -> como corrigir.
 *
 * Todas as funcoes aqui sao puras. Recebem a resposta do aluno e o gabarito,
 * devolvem acerto/erro. Nao tocam banco, nao tocam rede, entao sao testaveis
 * isoladamente e rodam sempre no servidor.
 */
import type {
  ExerciseDefinition,
  ExerciseOption,
  ExerciseType,
  GradeInput,
  GradeResult,
  Grader,
} from "./types";

// ------------------------------------------------------------------
// helpers
// ------------------------------------------------------------------

/** Normaliza texto livre: minusculas, sem acento, sem pontuacao de borda, espaco unico. */
export function normalizeText(input: unknown): string {
  if (typeof input !== "string") return "";
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .replace(/[.,!?;:]+$/g, "")
    .trim();
}

function acceptedList(answerKey: unknown, field = "accepted"): string[] {
  const raw = (answerKey as Record<string, unknown> | null)?.[field];
  return Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
}

function correctOptions(options: ExerciseOption[]): ExerciseOption[] {
  return options.filter((o) => o.isCorrect);
}

function wrong(correctAnswer: string): GradeResult {
  return { isCorrect: false, correctAnswer };
}

// ------------------------------------------------------------------
// graders
// ------------------------------------------------------------------

/** Uma unica opcao correta vinda de exercise_options. */
const gradeSingleOption: Grader = ({ answer, options }: GradeInput): GradeResult => {
  const correct = correctOptions(options)[0];
  const label = correct?.text ?? "";
  const picked = (answer as { optionId?: unknown } | null)?.optionId;
  if (typeof picked !== "number" || !correct) return wrong(label);
  return { isCorrect: picked === correct.id, correctAnswer: label };
};

const gradeTrueFalse: Grader = ({ answer, answerKey }: GradeInput): GradeResult => {
  const expected = (answerKey as { value?: unknown } | null)?.value === true;
  const label = expected ? "True" : "False";
  const given = (answer as { value?: unknown } | null)?.value;
  if (typeof given !== "boolean") return wrong(label);
  return { isCorrect: given === expected, correctAnswer: label };
};

/**
 * Uma ou mais lacunas. answerKey.blanks = [{ accepted: [...] }, ...]
 * A resposta do aluno vem como { values: [...] }, na ordem das lacunas.
 */
const gradeFillBlank: Grader = ({ answer, answerKey }: GradeInput): GradeResult => {
  const rawBlanks = (answerKey as { blanks?: unknown } | null)?.blanks;
  const blanks = Array.isArray(rawBlanks) ? rawBlanks : [];
  const label = blanks.map((b) => acceptedList(b)[0] ?? "").join(" / ");

  const given = (answer as { values?: unknown } | null)?.values;
  if (!Array.isArray(given) || given.length !== blanks.length) return wrong(label);

  const isCorrect = blanks.every((blank, i) => {
    const accepted = acceptedList(blank).map(normalizeText);
    return accepted.includes(normalizeText(given[i]));
  });
  return { isCorrect, correctAnswer: label };
};

const gradeShortAnswer: Grader = ({ answer, answerKey }: GradeInput): GradeResult => {
  const accepted = acceptedList(answerKey);
  const label = accepted[0] ?? "";
  const given = normalizeText((answer as { value?: unknown } | null)?.value);
  if (!given) return wrong(label);
  return { isCorrect: accepted.map(normalizeText).includes(given), correctAnswer: label };
};

/** Ordenacao de tokens. Compara sequencia normalizada. */
const gradeOrder: Grader = ({ answer, answerKey }: GradeInput): GradeResult => {
  const rawOrder = (answerKey as { order?: unknown } | null)?.order;
  const expected = Array.isArray(rawOrder) ? rawOrder.map(normalizeText) : [];
  const label = Array.isArray(rawOrder) ? rawOrder.join(" ") : "";

  const rawGiven = (answer as { order?: unknown } | null)?.order;
  const given = Array.isArray(rawGiven) ? rawGiven.map(normalizeText) : [];
  if (given.length !== expected.length || expected.length === 0) return wrong(label);

  return { isCorrect: expected.every((t, i) => t === given[i]), correctAnswer: label };
};

/**
 * Pares esquerda/direita. answerKey.pairs = [[indiceEsquerda, indiceDireita], ...]
 * A ordem em que o aluno monta os pares nao importa.
 */
const gradeMatching: Grader = ({ answer, answerKey, prompt }: GradeInput): GradeResult => {
  const rawPairs = (answerKey as { pairs?: unknown } | null)?.pairs;
  const expected = Array.isArray(rawPairs) ? (rawPairs as [number, number][]) : [];

  const left = (prompt as { left?: unknown } | null)?.left;
  const right = (prompt as { right?: unknown } | null)?.right;
  const label =
    Array.isArray(left) && Array.isArray(right)
      ? expected.map(([l, r]) => `${left[l]} → ${right[r]}`).join(", ")
      : "";

  const rawGiven = (answer as { pairs?: unknown } | null)?.pairs;
  const given = Array.isArray(rawGiven) ? (rawGiven as [number, number][]) : [];
  if (given.length !== expected.length || expected.length === 0) return wrong(label);

  const key = (p: [number, number]) => `${p[0]}:${p[1]}`;
  const expectedSet = new Set(expected.map(key));
  return { isCorrect: given.every((p) => expectedSet.has(key(p))), correctAnswer: label };
};

// ------------------------------------------------------------------
// registry
// ------------------------------------------------------------------

function define(
  type: ExerciseType,
  label: string,
  grade: Grader,
  opts: { needsMedia?: boolean; usesOptions?: boolean } = {},
): ExerciseDefinition {
  return {
    type,
    label,
    grade,
    needsMedia: opts.needsMedia ?? false,
    usesOptions: opts.usesOptions ?? false,
  };
}

export const EXERCISE_REGISTRY: Record<ExerciseType, ExerciseDefinition> = {
  MULTIPLE_CHOICE: define("MULTIPLE_CHOICE", "Multipla escolha", gradeSingleOption, { usesOptions: true }),
  READING_QUESTION: define("READING_QUESTION", "Pergunta de leitura", gradeSingleOption, { usesOptions: true }),
  LISTENING_MULTIPLE_CHOICE: define(
    "LISTENING_MULTIPLE_CHOICE",
    "Listening com multipla escolha",
    gradeSingleOption,
    { usesOptions: true, needsMedia: true },
  ),
  CHOICE_INLINE: define("CHOICE_INLINE", "Escolha na frase", gradeSingleOption, { usesOptions: true }),
  TRUE_FALSE: define("TRUE_FALSE", "Verdadeiro ou falso", gradeTrueFalse),
  FILL_BLANK: define("FILL_BLANK", "Completar lacunas", gradeFillBlank),
  LISTENING_FILL_BLANK: define("LISTENING_FILL_BLANK", "Listening com lacunas", gradeFillBlank, {
    needsMedia: true,
  }),
  FORM_FILL: define("FORM_FILL", "Preencher formulario", gradeFillBlank),
  SHORT_ANSWER: define("SHORT_ANSWER", "Resposta curta", gradeShortAnswer),
  CORRECT_SENTENCE: define("CORRECT_SENTENCE", "Corrigir a frase", gradeShortAnswer),
  ORDER_WORDS: define("ORDER_WORDS", "Ordenar palavras", gradeOrder),
  ORDER_SENTENCES: define("ORDER_SENTENCES", "Ordenar frases", gradeOrder),
  MATCHING: define("MATCHING", "Associar pares", gradeMatching),
  CATEGORY_SORT: define("CATEGORY_SORT", "Classificar em categorias", gradeMatching),
};

export function getExerciseDefinition(type: string): ExerciseDefinition | null {
  return EXERCISE_REGISTRY[type as ExerciseType] ?? null;
}

/** Ponto unico de correcao. Tipo desconhecido nunca vira acerto silencioso. */
export function gradeAnswer(type: string, input: GradeInput): GradeResult {
  const definition = getExerciseDefinition(type);
  if (!definition) {
    return { isCorrect: false, correctAnswer: "" };
  }
  return definition.grade(input);
}
