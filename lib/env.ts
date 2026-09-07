/**
 * Variaveis de ambiente com validacao explicita.
 *
 * Falhar cedo e com mensagem clara e melhor do que um erro obscuro do Supabase
 * na primeira query. As chaves NEXT_PUBLIC_* vao para o navegador; a
 * SERVICE_ROLE nunca sai do servidor.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Variavel de ambiente ausente: ${name}. Copie .env.example para .env e preencha. ` +
        `As chaves estao no painel do Supabase em Project Settings > API Keys.`,
    );
  }
  return value.trim();
}

export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

export function getPublicEnv() {
  return {
    supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", publicEnv.supabaseUrl),
    supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", publicEnv.supabaseAnonKey),
  };
}

/** So pode ser chamada no servidor. */
export function getServiceRoleKey(): string {
  if (typeof window !== "undefined") {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao pode ser lida no navegador.");
  }
  return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
}
