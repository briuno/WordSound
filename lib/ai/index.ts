import "server-only";

import { AnthropicProvider } from "./anthropic";
import { SupabaseEdgeProvider } from "./edge";
import { DEFAULT_GOOGLE_MODEL, GoogleProvider } from "./google";
import { AIProviderError, type AIProvider } from "./types";

export * from "./types";

/**
 * - "edge"      chave mora nos secrets da Edge Function; nada de credencial de
 *               IA no ambiente da aplicacao. Padrao.
 * - "google"    chama o Gemini direto daqui, com GOOGLE_API_KEY no .env.
 * - "anthropic" chama a Anthropic direto daqui.
 */
export type ProviderId = "edge" | "google" | "anthropic";

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
  const raw = (process.env.AI_PROVIDER ?? "edge").toLowerCase();
  if (raw === "anthropic") return "anthropic";
  if (raw === "google") return "google";
  return "edge";
}

function googleKey(): string | null {
  return realKey(process.env.GOOGLE_API_KEY) ?? realKey(process.env.GEMINI_API_KEY);
}

/** Credenciais que a opcao "edge" precisa: as do proprio Supabase, ja existentes. */
function edgeCredentials(): { url: string; serviceRoleKey: string } | null {
  const url = realKey(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = realKey(process.env.SUPABASE_SERVICE_ROLE_KEY);
  return url && serviceRoleKey ? { url, serviceRoleKey } : null;
}

/**
 * Fabrica do fornecedor de IA.
 *
 * Este e o unico ponto do sistema que sabe de onde vem a explicacao.
 * Trocar e mudar AI_PROVIDER no .env. Somar um quarto e uma implementacao
 * de AIProvider e um case aqui. Nada mais muda.
 */
export function getAIProvider(): AIProvider {
  switch (activeProvider()) {
    case "edge": {
      const creds = edgeCredentials();
      if (!creds) {
        throw new AIProviderError(
          "NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sao necessarias para chamar a Edge Function.",
        );
      }
      return new SupabaseEdgeProvider(creds.url, creds.serviceRoleKey);
    }
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

/**
 * true quando ha credencial para o fornecedor ativo.
 *
 * Em "edge" nao da para saber daqui se o secret da funcao foi cadastrado: isso
 * so aparece na chamada, e a funcao devolve 503 com a mensagem certa.
 */
export function isAIConfigured(): boolean {
  switch (activeProvider()) {
    case "edge":
      return edgeCredentials() !== null;
    case "google":
      return googleKey() !== null;
    case "anthropic":
      return realKey(process.env.ANTHROPIC_API_KEY) !== null;
  }
}
