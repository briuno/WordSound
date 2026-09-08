import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/supabase/server";

/** Raiz: leva para a trilha quando ha sessao, senao para o login. */
export default async function RootPage() {
  const user = await getCurrentUser();
  redirect(user ? "/app" : "/login");
}
