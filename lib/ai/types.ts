/**
 * Camada de abstracao de IA (spec 8).
 *
 * A aplicacao fala com esta interface, nunca com um SDK de fornecedor.
 * Trocar de fornecedor e escrever outra implementacao de AIProvider e mudar
 * uma linha na fabrica em lib/ai/index.ts. Nada mais do sistema muda.
 */
import { z } from "zod";

/** Contexto minimo do exercicio. Sem nome, email ou id do aluno (spec 27). */
export interface ExplainAnswerInput {
  question: string;
  instruction: string | null;
  studentAnswer: string;
  correctAnswer: string;
  /** Explicacao oficial cadastrada pelo professor, quando existir. */
  officialExplanation: string | null;
  /** Titulo da licao e da unidade, para calibrar o nivel. */
  lessonContext: string;
  exerciseType: string;
}

/** Forma exigida da resposta do modelo (spec 26). */
export const InsightSchema = z.object({
  explanation: z
    .string()
    .describe("Por que a resposta do aluno esta errada. Dois a tres periodos, em portugues do Brasil."),
  rule: z
    .string()
    .describe("A regra de ingles envolvida, enunciada de forma curta e direta, em portugues."),
  example: z
    .string()
    .describe("Uma frase de exemplo em ingles usando a forma correta."),
  retry_question: z
    .string()
    .describe("Uma pergunta nova sobre a mesma regra, em ingles, diferente da original."),
  retry_options: z
    .array(z.string())
    .describe("Exatamente tres alternativas para a pergunta nova, em ingles."),
  retry_correct_index: z
    .number()
    .int()
    .describe("Indice, base zero, da alternativa correta em retry_options."),
});

export type Insight = z.infer<typeof InsightSchema>;

export interface AIProvider {
  /** Nome curto do fornecedor, gravado junto do insight para auditoria. */
  readonly name: string;
  /** Identificador do modelo usado. */
  readonly model: string;
  explainAnswer(input: ExplainAnswerInput): Promise<Insight>;
}

export class AIProviderError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AIProviderError";
  }
}
