import "server-only";

import { AnthropicProvider } from "./anthropic";
import { AIProviderError, type AIProvider } from "./types";

export * from "./types";

/**
 * Fabrica do fornecedor de IA.
 *
 * Este e o unico ponto do sistema que sabe qual fornecedor esta em uso.
 * Para trocar, some uma implementacao de AIProvider e um case aqui.
 */
/**
 * Um .env recem copiado do template tem a chave preenchida com um placeholder.
 * Sem esta checagem o app tentaria chamar a API e devolveria "credencial
 * invalida", que manda a pessoa procurar o problema no lugar errado.
 */
function realKey(value: string | undefined): string | null {
  const key = value?.trim();
  if (!key) return null;
  if (/^COLE_/i.test(key) || key.includes("_AQUI")) return null;
  return key;
}

export function getAIProvider(): AIProvider {
  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();

  switch (provider) {
    case "anthropic": {
      const key = realKey(process.env.ANTHROPIC_API_KEY);
      if (!key) {
        throw new AIProviderError(
          "ANTHROPIC_API_KEY nao configurada. Preencha no .env para habilitar o WordSound Insight.",
        );
      }
      return new AnthropicProvider(key);
    }
    default:
      throw new AIProviderError(`Fornecedor de IA desconhecido: ${provider}`);
  }
}

/** true quando ha credencial de verdade para o fornecedor ativo. */
export function isAIConfigured(): boolean {
  const provider = (process.env.AI_PROVIDER ?? "anthropic").toLowerCase();
  if (provider === "anthropic") return realKey(process.env.ANTHROPIC_API_KEY) !== null;
  return false;
}
