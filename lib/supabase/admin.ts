import "server-only";

import { createClient } from "@supabase/supabase-js";

import { getPublicEnv, getServiceRoleKey } from "@/lib/env";

/**
 * Cliente com service_role: IGNORA RLS.
 *
 * Existe por um motivo unico: ler `exercises.answer_key` e
 * `exercise_options.is_correct`, que nao tem policy de leitura para aluno
 * (ver 0002_rls.sql). Toda correcao passa por aqui, no servidor.
 *
 * Nunca importe este modulo em componente de cliente e nunca devolva o
 * resultado cru de uma query de exercicio para o navegador: passe antes por
 * lib/dto.ts, que remove o gabarito.
 */
export function createSupabaseAdminClient() {
  const { supabaseUrl } = getPublicEnv();
  return createClient(supabaseUrl, getServiceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
