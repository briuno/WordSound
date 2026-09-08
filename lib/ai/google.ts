import "server-only";

import { GoogleGenAI, Type } from "@google/genai";

import {
  AIProviderError,
  InsightSchema,
  type AIProvider,
  type ExplainAnswerInput,
  type Insight,
} from "./types";

/** Sobrescrevivel por GOOGLE_MODEL, porque a lista de modelos muda com frequencia. */
export const DEFAULT_GOOGLE_MODEL = "gemini-2.5-flash";

const SYSTEM = `Voce e o WordSound Insight, um tutor de ingles dentro de uma plataforma de estudos.
O aluno errou um exercicio e quer entender o motivo.

Escreva para um adulto iniciante em ingles, em portugues do Brasil, com tom direto e encorajador.
Nada de emoji, nada de saudacao, nada de elogio vazio. Va direto ao ponto.

Regras:
- A resposta correta informada e a oficial, cadastrada pelo professor. Ela tem prioridade sobre
  qualquer opiniao sua. Se voce discordar dela, ainda assim explique por que a resposta oficial
  e a correta. Nunca sugira que o gabarito esta errado.
- A pergunta de reforco deve testar a mesma regra, com palavras diferentes da pergunta original.
- retry_options precisa ter exatamente tres alternativas, e apenas uma pode estar correta.
- retry_correct_index e o indice base zero da alternativa correta.
- Nao revele qual alternativa e a correta dentro de nenhum texto: o aluno le explanation, rule,
  example e retry_question antes de responder.`;

/**
 * Esquema no formato do Gemini. E o mesmo contrato do InsightSchema (zod), mas
 * escrito na notacao que a API do Google entende. A validacao com zod acontece
 * depois, sobre o JSON devolvido: o schema orienta o modelo, nao garante.
 */
const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    explanation: {
      type: Type.STRING,
      description: "Por que a resposta do aluno esta errada. Dois a tres periodos, em portugues do Brasil.",
    },
    rule: {
      type: Type.STRING,
      description: "A regra de ingles envolvida, curta e direta, em portugues.",
    },
    example: {
      type: Type.STRING,
      description: "Uma frase de exemplo em ingles usando a forma correta.",
    },
    retry_question: {
      type: Type.STRING,
      description: "Uma pergunta nova sobre a mesma regra, em ingles, diferente da original.",
    },
    retry_options: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exatamente tres alternativas em ingles.",
    },
    retry_correct_index: {
      type: Type.INTEGER,
      description: "Indice base zero da alternativa correta em retry_options.",
    },
  },
  required: ["explanation", "rule", "example", "retry_question", "retry_options", "retry_correct_index"],
} as const;

export class GoogleProvider implements AIProvider {
  readonly name = "google";
  readonly model: string;
  private client: GoogleGenAI;

  constructor(apiKey: string, model = DEFAULT_GOOGLE_MODEL) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async explainAnswer(input: ExplainAnswerInput): Promise<Insight> {
    const prompt = [
      `Licao: ${input.lessonContext}`,
      `Tipo de exercicio: ${input.exerciseType}`,
      input.instruction ? `Comando: ${input.instruction}` : null,
      `Pergunta: ${input.question}`,
      `Resposta do aluno: ${input.studentAnswer}`,
      `Resposta correta (oficial): ${input.correctAnswer}`,
      input.officialExplanation ? `Explicacao do professor: ${input.officialExplanation}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    let raw: string | undefined;
    try {
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      });
      raw = response.text;
    } catch (error) {
      throw new AIProviderError(describeGoogleError(error, this.model), error);
    }

    if (!raw) {
      throw new AIProviderError("O modelo nao devolveu conteudo. Pode ter sido bloqueado por filtro de seguranca.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new AIProviderError("O modelo nao devolveu JSON valido.");
    }

    // valida com o mesmo zod da outra implementacao: os dois fornecedores
    // entregam exatamente a mesma forma para o resto do sistema
    const result = InsightSchema.safeParse(parsed);
    if (!result.success) {
      throw new AIProviderError("A resposta do modelo nao bate com o contrato esperado.");
    }

    return normalize(result.data);
  }
}

/** Mensagens uteis para os erros mais comuns, sem vazar a chave. */
function describeGoogleError(error: unknown, model: string): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes("api key") || lower.includes("api_key_invalid") || lower.includes("401") || lower.includes("403")) {
    return "Credencial do Google invalida ou sem permissao para a Generative Language API.";
  }
  if (lower.includes("not found") || lower.includes("404")) {
    return `Modelo "${model}" indisponivel para esta chave. Rode "npm run ai:models" para ver os disponiveis e ajuste GOOGLE_MODEL no .env.`;
  }
  if (lower.includes("quota") || lower.includes("429") || lower.includes("resource_exhausted")) {
    return "Cota do Google esgotada ou muitas solicitacoes agora. Tente em instantes.";
  }
  return "Nao consegui gerar a explicacao agora.";
}

/**
 * Mesma defesa da implementacao da Anthropic: o schema garante os tipos, nao a
 * coerencia. Um indice fora do intervalo passaria pela validacao e quebraria a
 * correcao da pergunta de reforco.
 */
function normalize(insight: Insight): Insight {
  const options = insight.retry_options.map((o) => o.trim()).filter(Boolean).slice(0, 3);
  const index = insight.retry_correct_index;
  const valid = options.length === 3 && Number.isInteger(index) && index >= 0 && index < options.length;

  if (!valid) {
    return { ...insight, retry_question: "", retry_options: [], retry_correct_index: -1 };
  }
  return { ...insight, retry_options: options };
}
