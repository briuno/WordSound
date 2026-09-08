"use client";

import { ChevronDown, ChevronUp, Eye, EyeOff, Trash2 } from "lucide-react";
import * as React from "react";

import type { ActionResult } from "@/app/admin/actions";
import { Button, ErrorMessage } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Controles do painel. Todos compartilham a mesma forma: chamam uma server
 * action, mostram estado de espera e exibem o erro no lugar em vez de falhar
 * em silencio.
 */

function useAction() {
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const run = React.useCallback((action: () => Promise<ActionResult>, after?: () => void) => {
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (result.error) setError(result.error);
      else after?.();
    });
  }, []);

  return { error, pending, run, setError };
}

/* --------------------------------------------------------------- formulario */

export function AdminForm({
  action,
  submitLabel,
  children,
  onSaved,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  submitLabel: string;
  children: React.ReactNode;
  onSaved?: () => void;
  className?: string;
}) {
  const { error, pending, run, setError } = useAction();
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      className={cn("space-y-4", className)}
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        run(() => action(data), () => {
          setError(null);
          onSaved?.();
        });
      }}
    >
      {children}
      {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      <Button type="submit" disabled={pending} aria-busy={pending}>
        {pending ? "Salvando…" : submitLabel}
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------ publicar */

export function PublishToggle({
  published,
  action,
  label = "item",
}: {
  published: boolean;
  action: (publish: boolean) => Promise<ActionResult>;
  label?: string;
}) {
  const { error, pending, run } = useAction();
  return (
    <>
      <button
        type="button"
        disabled={pending}
        onClick={() => run(() => action(!published))}
        title={published ? `Despublicar ${label}` : `Publicar ${label}`}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-bold transition-colors disabled:opacity-50",
          published ? "bg-success/15 text-success" : "bg-surface-muted text-text-muted",
        )}
      >
        {published ? <Eye size={13} aria-hidden /> : <EyeOff size={13} aria-hidden />}
        {published ? "Publicado" : "Rascunho"}
      </button>
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </>
  );
}

/* --------------------------------------------------------------- excluir */

export function DeleteButton({
  action,
  confirmLabel,
}: {
  action: () => Promise<ActionResult>;
  confirmLabel: string;
}) {
  const { error, pending, run } = useAction();
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        aria-label={`Excluir ${confirmLabel}`}
        className="grid size-8 place-items-center rounded-lg text-text-muted hover:bg-error/10 hover:text-error"
      >
        <Trash2 size={15} aria-hidden />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-xs text-text-muted">Excluir?</span>
      <Button
        size="sm"
        variant="danger"
        disabled={pending}
        onClick={() => run(action)}
        className="h-7 px-2.5 text-xs"
      >
        {pending ? "…" : "Sim"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => setConfirming(false)}
        className="h-7 px-2.5 text-xs"
      >
        Nao
      </Button>
      {error ? <span className="text-xs text-error">{error}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------- ordenacao */

export function MoveButtons({
  onMove,
  isFirst,
  isLast,
}: {
  onMove: (direction: "up" | "down") => Promise<ActionResult>;
  isFirst: boolean;
  isLast: boolean;
}) {
  const { pending, run } = useAction();
  const base =
    "grid size-7 place-items-center rounded-md text-text-muted hover:bg-surface-muted hover:text-text disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <span className="inline-flex flex-col">
      <button
        type="button"
        aria-label="Mover para cima"
        disabled={isFirst || pending}
        onClick={() => run(() => onMove("up"))}
        className={base}
      >
        <ChevronUp size={15} aria-hidden />
      </button>
      <button
        type="button"
        aria-label="Mover para baixo"
        disabled={isLast || pending}
        onClick={() => run(() => onMove("down"))}
        className={base}
      >
        <ChevronDown size={15} aria-hidden />
      </button>
    </span>
  );
}

/* ------------------------------------------------- painel expansivel */

export function Disclosure({
  label,
  children,
  defaultOpen = false,
}: {
  label: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline"
      >
        {open ? <ChevronUp size={15} aria-hidden /> : <ChevronDown size={15} aria-hidden />}
        {label}
      </button>
      {open ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
