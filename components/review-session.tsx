"use client";

import { Check, PartyPopper, RotateCcw, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";

import { submitAnswer, type AnswerFeedback } from "@/app/(app)/actions";
import { AIInsight } from "@/components/ai-insight";
import { AudioPlayer } from "@/components/audio-player";
import { ExerciseInput, hasAnswer } from "@/components/exercises";
import { Button, buttonClasses, Card, ErrorMessage, ProgressBar } from "@/components/ui";
import type { StudentMedia } from "@/lib/queries";
import type { ReviewItem } from "@/lib/review";
import { cn } from "@/lib/utils";

/**
 * Sessao de revisao.
 *
 * Reaproveita o mesmo submitAnswer da licao, entao a correcao, a contagem de
 * tentativas e o XP seguem exatamente as mesmas regras. Como toda resposta aqui
 * e ao menos a segunda, o XP sai na taxa de repeticao, sem caminho novo.
 */
export function ReviewSession({
  items,
  media,
}: {
  items: ReviewItem[];
  media: Record<number, StudentMedia>;
}) {
  const router = useRouter();
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState<unknown>(null);
  const [feedback, setFeedback] = React.useState<AnswerFeedback | null>(null);
  const [showInsight, setShowInsight] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [resolved, setResolved] = React.useState(0);
  const [pending, startTransition] = React.useTransition();

  const current = items[index];
  const isLast = index >= items.length - 1;
  const currentMedia = current?.exercise.mediaId ? media[current.exercise.mediaId] : undefined;

  function check() {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const result = await submitAnswer(current.lessonId, current.exercise.id, answer);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.isCorrect) setResolved((n) => n + 1);
      setFeedback(result);
    });
  }

  function next() {
    setFeedback(null);
    setAnswer(null);
    setShowInsight(false);
    if (isLast) {
      // a fila e recalculada no servidor: o que foi acertado sai dela
      router.refresh();
      setIndex(items.length);
      return;
    }
    setIndex((i) => i + 1);
  }

  /* --------------------------------- fim --------------------------------- */
  if (!current) {
    return (
      <Card className="text-center">
        <PartyPopper size={28} aria-hidden className="mx-auto text-brand" />
        <h2 className="mt-3 text-xl font-extrabold">Revisao concluida</h2>
        <p className="mt-1 text-sm text-text-muted">
          {resolved === 0
            ? "Nada resolvido desta vez. Os exercicios continuam na fila."
            : `Voce tirou ${resolved} exercicio(s) da fila.`}
        </p>
        <Link href="/app" className={buttonClasses("primary", "lg", "mt-6 w-full")}>
          Voltar para a trilha
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <ProgressBar
          value={(index / items.length) * 100}
          label={`Exercicio ${index + 1} de ${items.length}`}
        />
        <span className="shrink-0 text-sm font-bold tabular-nums text-text-muted">
          {index + 1}/{items.length}
        </span>
      </div>

      <Card>
        <p className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-[var(--radius-pill)] bg-surface-muted px-2.5 py-1 font-semibold text-text-muted">
            {current.lessonTitle}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-error">
            <RotateCcw size={12} aria-hidden />
            {current.wrongCount} erro(s)
          </span>
        </p>

        {current.exercise.instruction ? (
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{current.exercise.instruction}</p>
        ) : null}
        <p className="mt-1.5 mb-5 text-lg font-semibold">{current.exercise.question}</p>

        {currentMedia ? (
          <AudioPlayer
            src={currentMedia.url}
            durationHint={currentMedia.durationSeconds}
            className="mb-5 bg-surface-muted/60"
          />
        ) : null}

        <ExerciseInput
          exercise={current.exercise}
          value={answer}
          onChange={setAnswer}
          disabled={pending || feedback !== null}
        />
      </Card>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {showInsight && feedback && !feedback.isCorrect ? (
        <AIInsight
          key={current.exercise.id}
          exerciseId={current.exercise.id}
          studentAnswer={answer}
          onClose={() => setShowInsight(false)}
        />
      ) : null}

      {feedback ? (
        <div
          role="status"
          aria-live="polite"
          className={cn(
            "rounded-[var(--radius-card)] border-2 p-5",
            feedback.isCorrect ? "border-success/45 bg-success/8" : "border-error/45 bg-error/8",
          )}
        >
          <p
            className={cn(
              "flex items-center gap-2 text-lg font-extrabold",
              feedback.isCorrect ? "text-success" : "text-error",
            )}
          >
            {feedback.isCorrect ? <Check size={20} aria-hidden /> : <X size={20} aria-hidden />}
            {feedback.isCorrect ? "Agora sim. Saiu da fila." : "Ainda nao. Continua na revisao."}
            {feedback.xpEarned > 0 ? (
              <span className="ml-auto text-sm font-bold text-brand">+{feedback.xpEarned} XP</span>
            ) : null}
          </p>

          {!feedback.isCorrect && feedback.correctAnswer ? (
            <p className="mt-3 text-sm">
              <span className="font-semibold text-text-muted">Resposta correta: </span>
              <span className="font-bold">{feedback.correctAnswer}</span>
            </p>
          ) : null}
          {feedback.explanation ? (
            <p className="mt-2 text-sm/relaxed text-text">{feedback.explanation}</p>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2.5">
            <Button onClick={next} disabled={pending} size="lg" className="flex-1">
              {isLast ? "Concluir revisao" : "Proximo"}
            </Button>
            {!feedback.isCorrect && !showInsight ? (
              <Button variant="secondary" size="lg" onClick={() => setShowInsight(true)} className="gap-1.5">
                <Sparkles size={16} aria-hidden />
                Entender melhor
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={check}
          disabled={pending || !hasAnswer(current.exercise.type, answer)}
        >
          {pending ? "Verificando…" : "Verificar"}
        </Button>
      )}
    </div>
  );
}
