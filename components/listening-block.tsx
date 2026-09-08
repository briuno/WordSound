"use client";

import { FileText, Lock } from "lucide-react";
import * as React from "react";

import { revealTranscript } from "@/app/(app)/actions";
import { AudioPlayer } from "@/components/audio-player";
import { Card } from "@/components/ui";
import type { StudentMedia } from "@/lib/queries";

/**
 * Bloco de listening: player mais transcricao sob demanda.
 *
 * A transcricao nao vem no payload da pagina. Ela e buscada por uma action que
 * so devolve o texto depois que o aluno respondeu os exercicios daquele audio,
 * porque a transcricao contem a resposta dos exercicios de lacuna.
 */
export function ListeningBlock({
  title,
  content,
  media,
}: {
  title: string | null;
  content: Record<string, unknown>;
  media: StudentMedia | undefined;
}) {
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const instructions = typeof content.instructions === "string" ? content.instructions : null;

  if (!media) {
    return (
      <Card>
        <h3 className="text-lg font-bold">{title ?? "Listening"}</h3>
        <p className="mt-1 text-sm text-text-muted">Audio indisponivel no momento.</p>
      </Card>
    );
  }

  function reveal() {
    setMessage(null);
    startTransition(async () => {
      const result = await revealTranscript(media!.id);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setTranscript(result.transcript ?? "");
    });
  }

  return (
    <Card>
      <h3 className="text-lg font-bold">{title ?? "Listening"}</h3>
      {instructions ? <p className="mt-1 mb-4 text-sm text-text-muted">{instructions}</p> : <div className="mb-4" />}

      <AudioPlayer src={media.url} durationHint={media.durationSeconds} />

      <div className="mt-4">
        {transcript === null ? (
          <button
            type="button"
            onClick={reveal}
            disabled={pending}
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline disabled:opacity-60"
          >
            <FileText size={15} aria-hidden />
            {pending ? "Verificando…" : "Ver transcricao"}
          </button>
        ) : (
          <div className="rounded-xl bg-surface-muted p-4">
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-text-muted">Transcricao</p>
            <p className="text-sm/relaxed text-text">{transcript || "(sem transcricao cadastrada)"}</p>
          </div>
        )}

        {message ? (
          <p role="status" className="mt-2 inline-flex items-center gap-1.5 text-sm text-text-muted">
            <Lock size={14} aria-hidden />
            {message}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
