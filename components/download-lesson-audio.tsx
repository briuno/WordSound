"use client";

import { CircleCheck, Download, Trash2 } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui";
import {
  downloadLessonAudio,
  isLessonDownloaded,
  isOfflineAudioSupported,
  removeLessonAudio,
  type DownloadableMedia,
} from "@/lib/offline-audio";
import { cn } from "@/lib/utils";

type State = "checking" | "idle" | "downloading" | "saved" | "error";

/**
 * Baixa os audios da licao para ouvir sem internet.
 *
 * Fica em "checking" ate saber o que ja existe no cache, e nesse estado nao
 * desenha nada: o botao so aparece quando ha resposta de verdade. Sem service
 * worker no controle (dev, navegador antigo) ele nunca sai desse estado,
 * porque ali o download nao teria quem servisse depois.
 */
export function DownloadLessonAudio({
  lesson,
  medias,
  className,
}: {
  lesson: { id: number; title: string };
  medias: DownloadableMedia[];
  className?: string;
}) {
  const [state, setState] = React.useState<State>("checking");
  const [progress, setProgress] = React.useState({ done: 0, total: 0 });

  React.useEffect(() => {
    if (medias.length === 0 || !isOfflineAudioSupported()) return;

    let active = true;
    isLessonDownloaded(medias)
      .then((saved) => {
        if (active) setState(saved ? "saved" : "idle");
      })
      .catch(() => {
        if (active) setState("idle");
      });

    return () => {
      active = false;
    };
  }, [medias]);

  function download() {
    setState("downloading");
    setProgress({ done: 0, total: medias.length });
    downloadLessonAudio(lesson, medias, (done, total) => setProgress({ done, total }))
      .then(() => setState("saved"))
      .catch(() => setState("error"));
  }

  function remove() {
    removeLessonAudio(medias)
      .then(() => setState("idle"))
      .catch(() => setState("error"));
  }

  if (state === "checking") return null;

  if (state === "saved") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl bg-success/10 px-3.5 py-2.5 text-sm font-semibold text-success",
          className,
        )}
      >
        <CircleCheck size={16} aria-hidden />
        Audio disponivel offline
        <button
          type="button"
          onClick={remove}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-text-muted hover:bg-surface-muted hover:text-text"
        >
          <Trash2 size={14} aria-hidden />
          Remover
        </button>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      <Button
        variant="secondary"
        size="sm"
        onClick={download}
        disabled={state === "downloading"}
        className="w-full"
      >
        <Download size={16} aria-hidden />
        {state === "downloading"
          ? `Baixando ${progress.done}/${progress.total}…`
          : medias.length > 1
            ? `Baixar os ${medias.length} audios`
            : "Baixar o audio"}
      </Button>
      <p className="text-center text-xs text-text-muted">
        {state === "error"
          ? "Nao deu para baixar. Tente de novo com a conexao estavel."
          : "Fica salvo no aparelho para ouvir sem internet."}
      </p>
    </div>
  );
}
