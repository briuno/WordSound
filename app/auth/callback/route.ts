import { NextResponse, type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Retorno dos links enviados por email: confirmacao de cadastro e redefinicao
 * de senha. Troca o code por sessao e leva o usuario adiante.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next") ?? "/app";
  // so aceita caminho interno, para o link do email nao virar open redirect
  const next = nextParam.startsWith("/") && !nextParam.startsWith("//") ? nextParam : "/app";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=link_invalido`);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=link_expirado`);
  }

  return NextResponse.redirect(`${origin}${next}`);
}
