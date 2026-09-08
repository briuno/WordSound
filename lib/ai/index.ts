import "server-only";

import { AnthropicProvider } from "./anthropic";
import { DEFAULT_GOOGLE_MODEL, GoogleProvider } from "./google";
import { AIProviderError, type AIProvider } from "./types";

export * from "./types";

export type ProviderId = "google" | "anthropic";

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

function activeProvider(): ProviderId {
  const raw = (process.env.AI_PROVIDER ?? "google").toLowerCase();
  return raw === "anthropic" ? "anthropic" : "google";
}

function googleKey(): string | null {
  // aceita os dois nomes usuais para nao obrigar a renomear o que ja existe
  return realKey(process.env.GOOGLE_API_KEY) ?? realKey(process.env.GEMINI_API_KEY);
}

/**
 * Fabrica do fornecedor de IA.
 *
 * Este e o unico ponto do sistema que sabe qual fornecedor esta em uso.
 * Para trocar, basta AI_PROVIDER no .env. Para somar um terceiro, uma
 * implementacao de AIProvider e um case aqui. Nada mais muda.
 */
export function getAIProvider(): AIProvider {
  switch (activeProvider()) {
    case "google": {
      const key = googleKey();
      if (!key) {
        throw new AIProviderError(
          "GOOGLE_API_KEY nao configurada. Preencha no .env para habilitar o WordSound Insight.",
        );
      }
      return new GoogleProvider(key, process.env.GOOGLE_MODEL?.trim() || DEFAULT_GOOGLE_MODEL);
    }
    case "anthropic": {
      const key = realKey(process.env.ANTHROPIC_API_KEY);
      if (!key) {
        throw new AIProviderError(
          "ANTHROPIC_API_KEY nao configurada. Preencha no .env para habilitar o WordSound Insight.",
        );
      }
      return new AnthropicProvider(key);
    }
  }
}

/** true quando ha credencial de verdade para o fornecedor ativo. */
export function isAIConfigured(): boolean {
  return activeProvider() === "google"
    ? googleKey() !== null
    : realKey(process.env.ANTHROPIC_API_KEY) !== null;
}
