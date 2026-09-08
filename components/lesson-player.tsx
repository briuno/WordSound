"use client";

import { ArrowLeft, Check, Clock, Sparkles, Target, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { completeLesson, submitAnswer, type AnswerFeedback, type LessonSummary } from "@/app/(app)/actions";
import { ExerciseInput, hasAnswer } from "@/components/exercises";
import { LessonContentBlock } from "@/components/lesson-blocks";
import { Button, buttonClasses, Card, ErrorMessage, ProgressBar } from "@/components/ui";
import type { LessonDetail } from "@/lib/queries";
import type { StudentExercise } from "@/lib/exercises/types";
import { cn, formatMinutes } from "@/lib/utils";

type Phase = "intro" | "study" | "practice" | "result";

export function LessonPlayer({ lesson }: { lesson: LessonDetail }) {
  const contentBlocks = React.useMemo(
    () => lesson.blocks.filter((b) => b.type !== "EXERCISE" && b.type !== "AI_REVIEW"),
    [lesson.blocks],
  );
  const exercises = React.useMemo<StudentExercise[]>(
    () => lesson.blocks.flatMap((b) => b.exercises),
    [lesson.blocks],
  );

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState<unknown>(null);
  const [feedback, setFeedback] = React.useState<AnswerFeedback | null>(null);
  const [summary, setSummary] = React.useState<LessonSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const current = exercises[index];
  const isLast = index >= exercises.length - 1;

  function finish() {
    startTransition(async () => {
      const result = await completeLesson(lesson.id);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      setSummary(result);
      setPhase("result");
    });
  }

  function check() {
    if (!current) return;
    setError(null);
    startTransition(async () => {
      const result = await submitAnswer(lesson.id, current.id, answer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result);
    });
  }

  function next() {
    setFeedback(null);
    setAnswer(null);
    if (isLast) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  /* ------------------------------------------------------------- intro */
  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl space-y-5">
        <BackLink />
        <Card>
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{lesson.moduleTitle}</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{lesson.title}</h1>
          {lesson.objective ? <p className="mt-3 text-text-muted">{lesson.objective}</p> : null}

          <dl className="mt-5 grid grid-cols-2 gap-3">
            <Stat icon={<Clock size={16} aria-hidden />} label="Tempo estimado" value={formatMinutes(lesson.estimatedMinutes)} />
            <Stat icon={<Target size={16} aria-hidden />} label="Exercicios" value={String(exercises.length)} />
          </dl>

          {contentBlocks.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">O que voce vai estudar</p>
              <ul className="space-y-1.5 text-sm text-text">
                {contentBlocks.map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {b.title ?? b.type}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button size="lg" className="mt-6 w-full" onClick={() => setPhase(contentBlocks.length ? "study" : "practice")}>
            Comecar
          </Button>
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------- study */
  if (phase === "study") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <BackLink />
        <h1 className="text-xl font-extrabold tracking-tight">{lesson.title}</h1>
        {contentBlocks.map((b) => (
          <LessonContentBlock key={b.id} type={b.type} title={b.title} content={b.content} />
        ))}
        <Button
          size="lg"
          className="w-full"
          onClick={() => (exercises.length > 0 ? setPhase("practice") : finish())}
          disabled={pending}
        >
          {exercises.length > 0 ? "Ir para os exercicios" : "Concluir licao"}
        </Button>
      </div>
    );
  }

  /* ------------------------------------------------------------ result */
  if (phase === "result" && summary) {
    return <LessonResult lesson={lesson} summary={summary} />;
  }

  /* ---------------------------------------------------------- practice */
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <p className="font-semibold">Esta licao ainda nao tem exercicios cadastrados.</p>
          <p className="mt-1 text-sm text-text-muted">
            Um administrador pode adiciona-los pelo painel. Voce ja pode concluir.
          </p>
          <Button className="mt-5 w-full" onClick={finish} disabled={pending}>
            Concluir licao
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center gap-3">
        <BackLink compact />
        <ProgressBar
          value={((index + (feedback ? 1 : 0)) / exercises.length) * 100}
          label={`Exercicio ${index + 1} de ${exercises.length}`}
        />
        <span className="shrink-0 text-sm font-bold tabular-nums text-text-muted">
          {index + 1}/{exercises.length}
        </span>
      </div>

      <Card>
        {current.instruction ? (
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{current.instruction}</p>
        ) : null}
        <p className="mt-1.5 mb-5 text-lg font-semibold">{current.question}</p>

        <ExerciseInput
          exercise={current}
          value={answer}
          onChange={setAnswer}
          disabled={pending || feedback !== null}
        />
      </Card>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {feedback ? (
        <Feedback feedback={feedback} onContinue={next} pending={pending} isLast={isLast} />
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={check}
          disabled={pending || !hasAnswer(current.type, answer)}
        >
          {pending ? "Verificando…" : "Verificar"}
        </Button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- auxiliares */

function BackLink({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/app"
      className={cn(
        "inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text",
        compact && "shrink-0",
      )}
    >
      <ArrowLeft size={16} aria-hidden />
      {compact ? <span className="sr-only">Voltar para a trilha</span> : "Voltar para a trilha"}
    </Link>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-bold">{value}</dd>
    </div>
  );
}

function Feedback({
  feedback,
  onContinue,
  pending,
  isLast,
}: {
  feedback: AnswerFeedback;
  onContinue: () => void;
  pending: boolean;
  isLast: boolean;
}) {
  const ok = feedback.isCorrect;
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-[var(--radius-card)] border-2 p-5",
        ok ? "border-success/45 bg-success/8" : "border-error/45 bg-error/8",
      )}
    >
      <p className={cn("flex items-center gap-2 text-lg font-extrabold", ok ? "text-success" : "text-error")}>
        {ok ? <Check size={20} aria-hidden /> : <X size={20} aria-hidden />}
        {ok ? "Correct!" : "Not this time."}
        {feedback.xpEarned > 0 ? (
          <span className="ml-auto text-sm font-bold text-brand">+{feedback.xpEarned} XP</span>
        ) : null}
      </p>

      {!ok && feedback.correctAnswer ? (
        <p className="mt-3 text-sm">
          <span className="font-semibold text-text-muted">Correct answer: </span>
          <span className="font-bold">{feedback.correctAnswer}</span>
        </p>
      ) : null}

      {feedback.explanation ? <p className="mt-2 text-sm/relaxed text-text">{feedback.explanation}</p> : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button onClick={onContinue} disabled={pending} size="lg" className="flex-1">
          {pending ? "Aguarde…" : isLast ? "Ver resultado" : "Continuar"}
        </Button>
        {!ok ? (
          <Button
            variant="secondary"
            size="lg"
            disabled
            title="WordSound Insight chega na proxima entrega"
            className="gap-1.5"
          >
            <Sparkles size={16} aria-hidden />
            Entender melhor
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function LessonResult({ lesson, summary }: { lesson: LessonDetail; summary: LessonSummary }) {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <Card className="text-center">
        <p className="text-sm font-bold uppercase tracking-wide text-brand">Lesson completed!</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight">{lesson.title}</h1>

        <p className="text-gradient-flow mt-6 text-5xl font-extrabold tabular-nums">{summary.accuracy}%</p>
        <p className="text-sm text-text-muted">de acerto</p>

        <dl className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-4">
          {[
            { label: "XP ganho", value: `+${summary.xpEarned}` },
            { label: "Respondidos", value: String(summary.answered) },
            { label: "Acertos", value: String(summary.correct) },
            { label: "Erros", value: String(summary.incorrect) },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{item.label}</dt>
              <dd className="text-lg font-extrabold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>

        <Link href="/app" className={buttonClasses("primary", "lg", "mt-7 w-full")}>
          Voltar para a trilha
        </Link>
      </Card>
    </div>
  );
}
