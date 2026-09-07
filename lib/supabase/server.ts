import "server-only";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { getPublicEnv } from "@/lib/env";

/**
 * Cliente Supabase para Server Components, Route Handlers e Server Actions.
 * Roda como o usuario logado, portanto RLS vale. Use este por padrao.
 */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const { supabaseUrl, supabaseAnonKey } = getPublicEnv();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component nao pode escrever cookie. O middleware ja renova
          // a sessao, entao ignorar aqui e seguro.
        }
      },
    },
  });
}

/** Usuario autenticado, ou null. Sempre valida no servidor de auth. */
export async function getCurrentUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
