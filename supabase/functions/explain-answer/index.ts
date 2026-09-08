/**
 * Edge Function: gera a explicacao do WordSound Insight.
 *
 * Existe para que a chave do fornecedor de IA fique so aqui, como secret do
 * Supabase, e nunca no ambiente da aplicacao Next.js:
 *
 *   supabase secrets set GOOGLE_API_KEY=...
 *
 * Chamada apenas servidor a servidor. O app envia a service_role no
 * Authorization; qualquer outro papel e recusado, senao um aluno logado
 * poderia usar a funcao como um proxy de LLM gratuito com prompt arbitrario.
 *
 * A funcao nao consulta banco e nao decide nada sobre a licao. Ela recebe os
 * campos ja validados pelo servidor do app, chama o modelo e devolve a
 * estrutura. Toda a regra de negocio continua em um lugar so.
 */
import { GoogleGenAI, Type } from "npm:@google/genai@2.21.0";

const MODEL = Deno.env.get("GOOGLE_MODEL") ?? "gemini-3.5-flash-lite";
const API_KEY = Deno.env.get("GOOGLE_API_KEY");

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

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    explanation: { type: Type.STRING },
    rule: { type: Type.STRING },
    example: { type: Type.STRING },
    retry_question: { type: Type.STRING },
    retry_options: { type: Type.ARRAY, items: { type: Type.STRING } },
    retry_correct_index: { type: Type.INTEGER },
  },
  required: ["explanation", "rule", "example", "retry_question", "retry_options", "retry_correct_index"],
};

interface RequestBody {
  /** Override opcional do modelo. So o servidor chama esta funcao, entao e
   *  seguro; serve para comparar modelos sem um redeploy por tentativa. */
  model?: string;
  question: string;
  instruction: string | null;
  studentAnswer: string;
  correctAnswer: string;
  officialExplanation: string | null;
  lessonContext: string;
  exerciseType: string;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * O Gemini devolve 503 UNAVAILABLE quando o modelo esta sob demanda alta, e
 * isso passa em poucos segundos. Sem esta repeticao, um blip momentaneo do
 * fornecedor viraria erro na tela do aluno: foi exatamente o que aconteceu no
 * primeiro teste desta funcao, e a tentativa seguinte funcionou.
 */
async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
      const transient =
        message.includes("503") ||
        message.includes("unavailable") ||
        message.includes("high demand") ||
        message.includes("429") ||
        message.includes("overloaded");
      if (!transient || attempt === attempts) break;
      await new Promise((resolve) => setTimeout(resolve, attempt * 1500));
    }
  }
  throw lastError;
}

/** Le o claim `role` do JWT sem verificar assinatura. */
function roleFromJwt(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const decoded = JSON.parse(atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=")));
    return typeof decoded.role === "string" ? decoded.role : null;
  } catch {
    return null;
  }
}

Deno.serve(async (request: Request) => {
  // O Supabase ja valida a assinatura do JWT antes de chegar aqui. O que falta
  // checar e QUAL papel esta chamando: so o servidor do app, nunca um aluno.
  const auth = request.headers.get("Authorization") ?? "";
  const role = roleFromJwt(auth.replace(/^Bearer\s+/i, ""));
  if (role !== "service_role") {
    return json({ error: "Somente chamada servidor a servidor." }, 403);
  }

  if (!API_KEY) {
    return json({ error: "GOOGLE_API_KEY nao cadastrada nos secrets da funcao." }, 503);
  }

  // GET lista os modelos que esta chave alcanca. Diagnostico: a chave vive
  // so aqui, entao esta e a unica forma de descobrir o que esta disponivel
  // sem tirar o segredo de dentro da funcao.
  if (request.method === "GET") {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const page = await ai.models.list();
      const models: { id: string; input?: number; output?: number }[] = [];
      for await (const model of page) {
        const actions = model.supportedActions ?? [];
        if (actions.length && !actions.includes("generateContent")) continue;
        models.push({
          id: (model.name ?? "").replace(/^models\//, ""),
          input: model.inputTokenLimit,
          output: model.outputTokenLimit,
        });
      }
      return json({ current: MODEL, models });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return json({ error: "Falha ao listar modelos.", detail: message.slice(0, 400) }, 502);
    }
  }

  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Corpo invalido." }, 400);
  }
  if (!body?.question || !body?.correctAnswer) {
    return json({ error: "Campos obrigatorios ausentes." }, 400);
  }

  const prompt = [
    `Licao: ${body.lessonContext}`,
    `Tipo de exercicio: ${body.exerciseType}`,
    body.instruction ? `Comando: ${body.instruction}` : null,
    `Pergunta: ${body.question}`,
    `Resposta do aluno: ${body.studentAnswer}`,
    `Resposta correta (oficial): ${body.correctAnswer}`,
    body.officialExplanation ? `Explicacao do professor: ${body.officialExplanation}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const chosenModel = body.model?.trim() || MODEL;
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: chosenModel,
        contents: prompt,
        config: {
          systemInstruction: SYSTEM,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      })
    );

    const text = response.text;
    if (!text) {
      return json({ error: "O modelo nao devolveu conteudo." }, 502);
    }
    // devolve cru: quem valida o contrato e o servidor do app, com o mesmo zod
    // que a implementacao da Anthropic usa
    return json({ raw: text, model: chosenModel });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("explain-answer:", message);
    const lower = message.toLowerCase();

    // `detail` so trafega servidor a servidor: a funcao recusa qualquer papel
    // que nao seja service_role, entao isso nunca chega ao navegador do aluno.
    // Sem ele, diagnosticar uma falha aqui exige redeploy so para ver o motivo.
    const detail = message.slice(0, 400);

    if (lower.includes("api key") || lower.includes("401") || lower.includes("403")) {
      return json({ error: "Credencial do Google invalida ou sem permissao.", detail }, 502);
    }
    if (lower.includes("not found") || lower.includes("404")) {
      return json({ error: `Modelo "${MODEL}" indisponivel para esta chave.`, detail }, 502);
    }
    if (lower.includes("503") || lower.includes("unavailable") || lower.includes("high demand")) {
      return json({ error: "O modelo esta sobrecarregado. Tente de novo em instantes.", detail }, 502);
    }
    if (lower.includes("quota") || lower.includes("429")) {
      return json({ error: "Cota do Google esgotada. Tente em instantes.", detail }, 502);
    }
    return json({ error: "Nao consegui gerar a explicacao agora.", detail }, 502);
  }
});
