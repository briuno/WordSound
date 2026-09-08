"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import type { AuthState } from "@/app/(auth)/actions";
import { Button, ErrorMessage } from "@/components/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending} aria-busy={pending}>
      {pending ? "Aguarde…" : label}
    </Button>
  );
}

/**
 * Casca compartilhada dos formularios de auth: estado da action, mensagem de
 * erro ou aviso, e botao com estado de envio. Os campos vem como children.
 */
export function AuthForm({
  action,
  submitLabel,
  children,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  submitLabel: string;
  children: React.ReactNode;
}) {
  const [state, formAction] = useActionState(action, {} as AuthState);

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {children}

      {state.error ? <ErrorMessage>{state.error}</ErrorMessage> : null}
      {state.notice ? (
        <p role="status" className="rounded-xl bg-success/10 px-4 py-3 text-sm font-medium text-success">
          {state.notice}
        </p>
      ) : null}

      <SubmitButton label={submitLabel} />
    </form>
  );
}
