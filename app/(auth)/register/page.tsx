import type { Metadata } from "next";
import Link from "next/link";

import { signUp } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth-form";
import { Card, Field, Input } from "@/components/ui";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return (
    <Card className="p-7">
      <h1 className="text-2xl font-extrabold tracking-tight">Criar conta</h1>
      <p className="mt-1 mb-6 text-sm text-text-muted">Comece pela Unit 1 e avance no seu ritmo.</p>

      <AuthForm action={signUp} submitLabel="Criar conta">
        <Field label="Nome" htmlFor="fullName">
          <Input id="fullName" name="fullName" autoComplete="name" required placeholder="Seu nome" />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" autoComplete="email" required placeholder="voce@email.com" />
        </Field>
        <Field label="Senha" htmlFor="password" hint="Ao menos 8 caracteres.">
          <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} />
        </Field>
      </AuthForm>

      <p className="mt-6 text-sm text-text-muted">
        Ja tem conta?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Entrar
        </Link>
      </p>
    </Card>
  );
}
