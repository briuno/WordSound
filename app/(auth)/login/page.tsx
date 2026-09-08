import type { Metadata } from "next";
import Link from "next/link";

import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <Card className="p-7">
      <h1 className="text-2xl font-extrabold tracking-tight">Bem-vindo de volta</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">Continue de onde voce parou.</p>

      <AuthForm action={signIn} submitLabel="Entrar">
        <input type="hidden" name="next" value={next ?? "/app"} />
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
        </Field>
        <Field label="Senha" htmlFor="password">
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </Field>
      </AuthForm>

      <div className="mt-6 flex flex-col gap-2 text-sm">
        <Link href="/forgot-password" className="font-semibold text-brand hover:underline">
          Esqueci minha senha
        </Link>
        <p className="text-text-muted">
          Nao tem conta?{" "}
          <Link href="/register" className="font-semibold text-brand hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </Card>
  );
}
