"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AuthState {
  error?: string;
  notice?: string;
}

const emailSchema = z.string().trim().email("Informe um email valido.");
const passwordSchema = z.string().min(8, "A senha precisa de pelo menos 8 caracteres.");

function firstError(...results: z.ZodSafeParseResult<unknown>[]): string | null {
  for (const r of results) {
    if (!r.success) return r.error.issues[0]?.message ?? "Dados invalidos.";
  }
  return null;
}

/** Traduz as mensagens mais comuns do Supabase Auth. */
function humanize(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Email ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu email antes de entrar.";
  if (m.includes("already registered")) return "Ja existe uma conta com esse email.";
  if (m.includes("rate limit") || m.includes("too many")) return "Muitas tentativas. Aguarde um pouco.";
  return message;
}

async function siteOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/app");

  const invalid = firstError(emailSchema.safeParse(email), z.string().min(1, "Informe a senha.").safeParse(password));
  if (invalid) return { error: invalid };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: humanize(error.message) };

  redirect(next.startsWith("/") ? next : "/app");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");

  const invalid = firstError(
    z.string().min(2, "Informe seu nome.").safeParse(fullName),
    emailSchema.safeParse(email),
    passwordSchema.safeParse(password),
  );
  if (invalid) return { error: invalid };

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${await siteOrigin()}/auth/callback`,
    },
  });
  if (error) return { error: humanize(error.message) };

  // Com confirmacao de email ligada nao vem sessao; o aluno precisa confirmar.
  if (!data.session) {
    return { notice: "Conta criada. Confira seu email para confirmar o cadastro." };
  }
  redirect("/app");
}

export async function requestPasswordReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "");
  const invalid = firstError(emailSchema.safeParse(email));
  if (invalid) return { error: invalid };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/callback?next=/reset-password`,
  });
  if (error) return { error: humanize(error.message) };

  // Resposta identica exista ou nao a conta, para nao revelar quem tem cadastro.
  return { notice: "Se existir uma conta com esse email, enviamos o link de redefinicao." };
}

/**
 * Define a nova senha. Chamada depois que o link do email trocou o code por
 * sessao no /auth/callback: sem sessao valida, o Supabase recusa a troca, o
 * que impede alguem de redefinir a senha de outra pessoa.
 */
export async function updatePassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");

  const invalid = firstError(passwordSchema.safeParse(password));
  if (invalid) return { error: invalid };
  if (password !== confirmation) return { error: "As senhas nao conferem." };

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "O link expirou. Peca a redefinicao de novo." };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: humanize(error.message) };

  redirect("/app");
}

export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
