import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";

import {
  AIProviderError,
  InsightSchema,
  type AIProvider,
  type ExplainAnswerInput,
  type Insight,
} from "./types";

const MODEL = "claude-opus-5";

/**
 * O prompt so recebe dados da atividade (spec 27). Nada de nome, email ou id.
 *
 * A ultima regra e a mais importante: o gabarito do banco tem prioridade
 * absoluta. Se o modelo discordar, ele explica o gabarito cadastrado em vez
 * de inventar outro, para a IA nunca contradizer o professor.
 */
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

export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  readonly model = MODEL;
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
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

    try {
      const response = await this.client.messages.parse({
        model: MODEL,
        max_tokens: 16000,
        system: SYSTEM,
        thinking: { type: "adaptive" },
        output_config: { format: zodOutputFormat(InsightSchema) },
        messages: [{ role: "user", content: prompt }],
      });

      if (response.stop_reason === "refusal") {
        throw new AIProviderError("O modelo recusou a solicitacao.");
      }

      const parsed = response.parsed_output;
      if (!parsed) {
        throw new AIProviderError("O modelo nao devolveu a estrutura esperada.");
      }

      return normalize(parsed);
    } catch (error) {
      if (error instanceof AIProviderError) throw error;
      if (error instanceof Anthropic.RateLimitError) {
        throw new AIProviderError("Muitas solicitacoes agora. Tente em instantes.", error);
      }
      if (error instanceof Anthropic.AuthenticationError) {
        throw new AIProviderError("Credencial de IA invalida.", error);
      }
      throw new AIProviderError("Nao consegui gerar a explicacao agora.", error);
    }
  }
}

/**
 * Defesa contra saida fora do contrato. O schema garante os tipos, nao a
 * coerencia: um indice fora do intervalo passaria pela validacao e quebraria
 * a correcao da pergunta de reforco.
 */
function normalize(insight: Insight): Insight {
  const options = insight.retry_options.map((o) => o.trim()).filter(Boolean).slice(0, 3);
  const index = insight.retry_correct_index;
  const valid = options.length === 3 && Number.isInteger(index) && index >= 0 && index < options.length;

  if (!valid) {
    // sem pergunta de reforco confiavel, entrega so a explicacao
    return { ...insight, retry_question: "", retry_options: [], retry_correct_index: -1 };
  }
  return { ...insight, retry_options: options };
}
