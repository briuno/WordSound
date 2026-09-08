"use client";

import { FileText, Headphones, Lock } from "lucide-react";
import * as React from "react";

import { revealTranscript } from "@/app/(app)/actions";
import { AudioPlayer } from "@/components/audio-player";
import { Card } from "@/components/ui";
import type { StudentMedia } from "@/lib/queries";

/**
 * Abre a transcricao de uma faixa.
 *
 * A transcricao nao viaja no payload da licao: ela contem, literalmente, a
 * resposta dos exercicios de lacuna. Quem decide se pode abrir e a action, que
 * exige as perguntas daquela faixa respondidas — por isso este botao vive no
 * fim da ultima pergunta, e nao na tela do audio.
 */
export function TranscriptReveal({ mediaId, className }: { mediaId: number; className?: string }) {
  const [transcript, setTranscript] = React.useState<string | null>(null);
  const [message, setMessage] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function reveal() {
    setMessage(null);
    startTransition(async () => {
      const result = await revealTranscript(mediaId);
      if (result.error) {
        setMessage(result.error);
        return;
      }
      setTranscript(result.transcript ?? "");
    });
  }

  return (
    <div className={className}>
      {transcript === null ? (
        <button
          type="button"
          onClick={reveal}
          disabled={pending}
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:underline disabled:opacity-60"
        >
          <FileText size={15} aria-hidden />
          {pending ? "Abrindo…" : "Ver a transcricao"}
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
  );
}

/**
 * Uma faixa de listening, sozinha na tela.
 *
 * A ordem e a do laboratorio de idiomas: primeiro o que ouvir, depois o audio,
 * depois as perguntas — que vem nas telas seguintes, nao aqui. O aviso do fim
 * existe para o aluno saber quanto vale a escuta antes de apertar o play.
 */
export function ListeningBlock({
  title,
  content,
  media,
  questionCount = 0,
}: {
  title: string | null;
  content: Record<string, unknown>;
  media: StudentMedia | undefined;
  questionCount?: number;
}) {
  const instructions = typeof content.instructions === "string" ? content.instructions.trim() : "";
  const paragraphs = Array.isArray(content.paragraphs) ? (content.paragraphs as string[]) : [];

  if (!media) {
    return (
      <Card>
        <h2 className="text-lg font-bold">{title ?? "Listening"}</h2>
        <p className="mt-1 text-sm text-text-muted">Audio indisponivel no momento.</p>
      </Card>
    );
  }

  return (
    <Card>
      <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand">
        <Headphones size={14} aria-hidden />
        Listening
      </p>
      <h2 className="mt-1 text-lg font-bold">{title ?? media.title}</h2>

      {instructions ? <p className="mt-2 text-[15px]/relaxed text-text-muted">{instructions}</p> : null}
      {paragraphs.map((p, i) => (
        <p key={i} className="mt-2 text-[15px]/relaxed text-text-muted">
          {p}
        </p>
      ))}

      <AudioPlayer
        src={media.url}
        durationHint={media.durationSeconds}
        className="mt-5 bg-surface-muted/60"
      />

      {questionCount > 0 ? (
        <p className="mt-4 flex items-start gap-2 text-sm text-text-muted">
          <Lock size={14} className="mt-0.5 shrink-0" aria-hidden />
          <span>
            Ouca quantas vezes quiser. Em seguida vem{" "}
            {questionCount === 1 ? "1 pergunta" : `${questionCount} perguntas`} sobre esta faixa — o
            audio continua disponivel em cada uma, e a transcricao abre no fim.
          </span>
        </p>
      ) : (
        <TranscriptReveal mediaId={media.id} className="mt-4" />
      )}
    </Card>
  );
}
