import "server-only";

import {
  AIProviderError,
  InsightSchema,
  type AIProvider,
  type ExplainAnswerInput,
  type Insight,
} from "./types";

/**
 * Fornecedor que delega a chamada do modelo para a Edge Function do Supabase.
 *
 * A chave da IA nao existe neste processo: ela e um secret da funcao. O que
 * este arquivo tem e a service_role, que a aplicacao ja precisava de qualquer
 * forma. A abstracao AIProvider continua valendo, entao nada fora de lib/ai/
 * percebe que a chamada saiu do servidor do app.
 */
export class SupabaseEdgeProvider implements AIProvider {
  readonly name = "supabase-edge";
  readonly model = "edge:explain-answer";

  constructor(
    private supabaseUrl: string,
    private serviceRoleKey: string,
  ) {}

  async explainAnswer(input: ExplainAnswerInput): Promise<Insight> {
    const endpoint = `${this.supabaseUrl.replace(/\/$/, "")}/functions/v1/explain-answer`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // a funcao exige papel service_role: chamada servidor a servidor
          Authorization: `Bearer ${this.serviceRoleKey}`,
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(60_000),
      });
    } catch (error) {
      throw new AIProviderError("Nao consegui falar com a Edge Function.", error);
    }

    let payload: { raw?: string; error?: string };
    try {
      payload = await response.json();
    } catch {
      throw new AIProviderError(
        response.status === 404
          ? "Edge Function 'explain-answer' nao encontrada. Faca o deploy dela."
          : "Resposta invalida da Edge Function.",
      );
    }

    if (!response.ok) {
      throw new AIProviderError(payload.error ?? "A Edge Function respondeu com erro.");
    }
    if (!payload.raw) {
      throw new AIProviderError("A Edge Function nao devolveu conteudo.");
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(payload.raw);
    } catch {
      throw new AIProviderError("O modelo nao devolveu JSON valido.");
    }

    // mesmo contrato zod das outras implementacoes: o resto do sistema recebe
    // exatamente a mesma forma, venha de onde vier
    const result = InsightSchema.safeParse(parsed);
    if (!result.success) {
      throw new AIProviderError("A resposta do modelo nao bate com o contrato esperado.");
    }

    return normalize(result.data);
  }
}

function normalize(insight: Insight): Insight {
  const options = insight.retry_options.map((o) => o.trim()).filter(Boolean).slice(0, 3);
  const index = insight.retry_correct_index;
  const valid = options.length === 3 && Number.isInteger(index) && index >= 0 && index < options.length;

  if (!valid) {
    return { ...insight, retry_question: "", retry_options: [], retry_correct_index: -1 };
  }
  return { ...insight, retry_options: options };
}
