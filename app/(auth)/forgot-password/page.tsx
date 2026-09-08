import type { Metadata } from "next";
import Link from "next/link";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default function ForgotPasswordPage() {
  return (
    <Card className="p-7">
      <h1 className="text-2xl font-extrabold tracking-tight">Esqueci minha senha</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">
        Informe seu email e enviaremos um link para redefinir.
      </p>

      <AuthForm action={requestPasswordReset} submitLabel="Enviar link">
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
        </Field>
      </AuthForm>

      <p className="mt-6 text-sm text-text-muted">
        Lembrou?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Voltar para entrar
        </Link>
      </p>
    </Card>
  );
}
