"use client";

import { ShieldCheck, ShieldOff } from "lucide-react";
import * as React from "react";

import type { ActionResult } from "@/app/admin/actions";
import { cn } from "@/lib/utils";

/**
 * Alterna entre admin e aluno.
 *
 * Um admin pode se rebaixar, desde que exista outro: e como alguem deixa de
 * ser administrador sem depender de terceiros. Quem impede o sistema de ficar
 * sem nenhum admin e o trigger do banco, nao este botao.
 */
export function RoleToggle({
  isAdmin,
  isSelf,
  action,
}: {
  isAdmin: boolean;
  isSelf: boolean;
  action: (role: "admin" | "student") => Promise<ActionResult>;
}) {
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  function apply() {
    setError(null);
    startTransition(async () => {
      const result = await action(isAdmin ? "student" : "admin");
      if (result.error) setError(result.error);
      setConfirming(false);
    });
  }

  // rebaixar a si mesmo custa o acesso ao painel, entao pede confirmacao
  const needsConfirmation = isAdmin && isSelf;

  return (
    <span className="inline-flex flex-col items-end gap-1">
      {confirming ? (
        <span className="inline-flex items-center gap-1.5">
          <span className="text-xs text-text-muted">Perder seu acesso ao painel?</span>
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="rounded-[var(--radius-pill)] bg-error px-2.5 py-1 text-xs font-bold text-white disabled:opacity-50"
          >
            {pending ? "…" : "Sim"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold text-text-muted"
          >
            Nao
          </button>
        </span>
      ) : (
        <button
          type="button"
          disabled={pending}
          onClick={() => (needsConfirmation ? setConfirming(true) : apply())}
          title={isAdmin ? "Rebaixar para aluno" : "Promover a administrador"}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-50",
            isAdmin ? "bg-purple/12 text-purple" : "bg-surface-muted text-text-muted hover:text-text",
          )}
        >
          {isAdmin ? <ShieldCheck size={13} aria-hidden /> : <ShieldOff size={13} aria-hidden />}
          {pending ? "…" : isAdmin ? "Admin" : "Aluno"}
        </button>
      )}
      {error ? <span className="text-right text-xs text-error">{error}</span> : null}
    </span>
  );
}
