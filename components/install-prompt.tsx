"use client";

import { Download, X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const DISMISS_KEY = "ws:install-dismissed";

/** Evento do Chrome/Edge; ainda nao esta no lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // iOS ainda usa o flag proprietario
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function wasDismissed() {
  try {
    return localStorage.getItem(DISMISS_KEY) === "1";
  } catch {
    // navegacao privada pode bloquear o storage; sem memoria, apenas mostramos
    return false;
  }
}

/**
 * O Safari do iPhone nao dispara beforeinstallprompt, entao la o convite so
 * pode ensinar o caminho manual. Lido com useSyncExternalStore porque depende
 * de APIs do navegador: no servidor a resposta e sempre false e a hidratacao
 * nao quebra.
 */
const NEVER_CHANGES = () => () => {};

function iosHintSnapshot() {
  if (isStandalone() || wasDismissed()) return false;
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) && /safari/i.test(ua) && !/crios|fxios/i.test(ua);
}

/**
 * Convite para instalar o app.
 *
 * No Chrome e no Edge o botao abre o dialogo nativo de instalacao. Some quando
 * o app ja esta instalado ou quando o usuario dispensa.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const [deferred, setDeferred] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = React.useState(false);
  const iosHint = React.useSyncExternalStore(NEVER_CHANGES, iosHintSnapshot, () => false);

  React.useEffect(() => {
    function onBeforeInstallPrompt(event: Event) {
      // sem preventDefault o Chrome mostra a propria barra de instalacao
      event.preventDefault();
      if (wasDismissed()) return;
      setDeferred(event as BeforeInstallPromptEvent);
    }

    function onInstalled() {
      setDeferred(null);
      setDismissed(true);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (dismissed || (!deferred && !iosHint)) return null;

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // sem storage o convite volta na proxima visita; nao e motivo de erro
    }
    setDismissed(true);
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setDismissed(true);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border)] bg-surface p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-[var(--radius-pill)] bg-brand/10 text-brand">
        <Download size={18} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold">Instale o WordSound</p>
        <p className="mt-0.5 text-xs text-text-muted">
          {deferred
            ? "Abre em tela cheia, direto da sua tela inicial."
            : "Toque em Compartilhar e depois em Adicionar a Tela de Inicio."}
        </p>
      </div>
      {deferred ? (
        <Button size="sm" onClick={install}>
          Instalar
        </Button>
      ) : null}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dispensar convite de instalacao"
        className="grid size-8 shrink-0 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
      >
        <X size={16} aria-hidden />
      </button>
    </div>
  );
}
