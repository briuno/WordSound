import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { updatePassword } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { Card, Field, Input } from "@/components/ui";
import { getCurrentUser } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Redefinir senha" };

export default async function ResetPasswordPage() {
  // Chega-se aqui pelo link do email, que ja criou a sessao no /auth/callback.
  // Sem sessao, nao ha o que redefinir.
  const user = await getCurrentUser();
  if (!user) redirect("/forgot-password?error=link_expirado");

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-extrabold tracking-tight">Nova senha</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Escolha uma senha nova para <span className="font-semibold text-text">{user.email}</span>.
      </p>

      <AuthForm action={updatePassword} submitLabel="Salvar nova senha">
        <Field label="Nova senha" htmlFor="password" hint="Ao menos 8 caracteres.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
        <Field label="Repita a nova senha" htmlFor="confirmation">
          <Input
            id="confirmation"
            name="confirmation"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
          />
        </Field>
      </AuthForm>

      <p className="mt-6 text-sm text-text-muted">
        Mudou de ideia?{" "}
        <Link href="/app" className="font-semibold text-brand hover:underline">
          Voltar para a trilha
        </Link>
      </p>
    </Card>
  );
}
