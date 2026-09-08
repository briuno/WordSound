"use client";

import { ArrowLeft, BookOpen, Check, ChevronDown, Clock, Sparkles, Target, Trophy, X } from "lucide-react";
import Link from "next/link";
import * as React from "react";

import { completeLesson, submitAnswer, type AnswerFeedback, type LessonSummary } from "@/app/(app)/actions";
import { AIInsight } from "@/components/ai-insight";
import { AudioPlayer } from "@/components/audio-player";
import { DownloadLessonAudio } from "@/components/download-lesson-audio";
import { ExerciseInput, hasAnswer } from "@/components/exercises";
import { BlockRecap, hasRecap, LessonContentBlock } from "@/components/lesson-blocks";
import { TranscriptReveal } from "@/components/listening-block";
import { Button, buttonClasses, Card, ErrorMessage, ProgressBar } from "@/components/ui";
import { buildLessonSteps, type LessonStep } from "@/lib/lesson-flow";
import type { LessonBlock, LessonDetail } from "@/lib/queries";
import { cn, formatMinutes } from "@/lib/utils";

type Phase = "intro" | "run" | "result";

/**
 * A licao acontece uma tela por vez.
 *
 * Antes eram duas telonas: todo o conteudo empilhado em uma, todos os
 * exercicios na outra. Numa licao de listening isso significava tres players
 * de audio juntos, sem pergunta nenhuma por perto, e depois as perguntas
 * repetindo os mesmos audios fora de contexto.
 *
 * Agora buildLessonSteps devolve a licao ja costurada — bloco, perguntas do
 * bloco, proximo bloco — e este componente so caminha por essa fila.
 */
export function LessonPlayer({ lesson }: { lesson: LessonDetail }) {
  const steps = React.useMemo(() => buildLessonSteps(lesson), [lesson]);

  const studyBlocks = React.useMemo(
    () => steps.flatMap((s) => (s.kind === "study" ? [s.block] : [])),
    [steps],
  );
  const exerciseCount = React.useMemo(
    () => steps.filter((s) => s.kind === "exercise").length,
    [steps],
  );
  // numero de cada pergunta dentro da licao, para o aluno se localizar
  const exerciseNumbers = React.useMemo(() => {
    let n = 0;
    return steps.map((s) => (s.kind === "exercise" ? ++n : 0));
  }, [steps]);

  // so audio: imagem de bloco tambem vive em lesson.media, e nao tem o que
  // baixar para ouvir offline
  const medias = React.useMemo(
    () => Object.values(lesson.media).filter((m) => m.kind === "audio"),
    [lesson.media],
  );

  const [phase, setPhase] = React.useState<Phase>("intro");
  const [index, setIndex] = React.useState(0);
  const [answer, setAnswer] = React.useState<unknown>(null);
  const [feedback, setFeedback] = React.useState<AnswerFeedback | null>(null);
  const [summary, setSummary] = React.useState<LessonSummary | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [showInsight, setShowInsight] = React.useState(false);
  const [pending, startTransition] = React.useTransition();

  // cada etapa e uma tela nova: comecar no meio dela, na altura em que o botao
  // anterior estava, esconde o titulo do que acabou de abrir
  React.useEffect(() => {
    if (phase === "intro") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, phase]);

  const step: LessonStep | undefined = steps[index];
  const isLastStep = index >= steps.length - 1;

  // a regra so serve de consulta depois de lida: mostrar o que ainda vem seria
  // entregar a resposta antes da pergunta
  const recapBlocks = React.useMemo<LessonBlock[]>(
    () => steps.slice(0, index).flatMap((s) => (s.kind === "study" && hasRecap(s.block.content) ? [s.block] : [])),
    [steps, index],
  );

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

  function advance() {
    setFeedback(null);
    setAnswer(null);
    setShowInsight(false);
    setError(null);
    if (isLastStep) {
      finish();
      return;
    }
    setIndex((i) => i + 1);
  }

  function check() {
    if (step?.kind !== "exercise") return;
    setError(null);
    const exerciseId = step.exercise.id;
    startTransition(async () => {
      const result = await submitAnswer(lesson.id, exerciseId, answer);
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result);
    });
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
            <Stat icon={<Target size={16} aria-hidden />} label="Exercicios" value={String(exerciseCount)} />
          </dl>

          {studyBlocks.length > 0 ? (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-text-muted">O que voce vai estudar</p>
              <ul className="space-y-1.5 text-sm text-text">
                {studyBlocks.map((b) => (
                  <li key={b.id} className="flex items-center gap-2">
                    <span className="size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                    {b.title ?? b.type}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <Button size="lg" className="mt-6 w-full" onClick={() => setPhase("run")}>
            Comecar
          </Button>

          {medias.length > 0 ? (
            <DownloadLessonAudio
              lesson={{ id: lesson.id, title: lesson.title }}
              medias={medias}
              className="mt-4"
            />
          ) : null}
        </Card>
      </div>
    );
  }

  /* ------------------------------------------------------------ result */
  if (phase === "result" && summary) {
    return <LessonResult lesson={lesson} summary={summary} />;
  }

  /* ------------------------------------------------------- licao vazia */
  if (!step) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Card>
          <p className="font-semibold">Esta licao ainda nao tem conteudo cadastrado.</p>
          <p className="mt-1 text-sm text-text-muted">
            Um administrador pode adiciona-lo pelo painel. Voce ja pode concluir.
          </p>
          <Button className="mt-5 w-full" onClick={finish} disabled={pending}>
            {pending ? "Aguarde…" : "Concluir licao"}
          </Button>
        </Card>
        {error ? <ErrorMessage>{error}</ErrorMessage> : null}
      </div>
    );
  }

  const header = (
    <div className="flex items-center gap-3">
      <BackLink compact />
      <ProgressBar
        value={((index + (feedback ? 1 : 0)) / steps.length) * 100}
        label={
          step.kind === "study"
            ? (step.block.title ?? "Conteudo")
            : `Exercicio ${exerciseNumbers[index]} de ${exerciseCount}`
        }
      />
      <span className="shrink-0 text-sm font-bold tabular-nums text-text-muted">
        {index + 1}/{steps.length}
      </span>
    </div>
  );

  /* ------------------------------------------------------------ estudo */
  if (step.kind === "study") {
    const label = isLastStep
      ? "Concluir licao"
      : step.questionCount === 0
        ? "Continuar"
        : step.questionCount === 1
          ? "Ir para a pergunta"
          : "Ir para as perguntas";

    return (
      <div className="mx-auto max-w-2xl space-y-5">
        {header}

        <LessonContentBlock
          key={step.key}
          type={step.block.type}
          title={step.block.title}
          content={step.block.content}
          media={step.media}
          questionCount={step.questionCount}
        />

        {error ? <ErrorMessage>{error}</ErrorMessage> : null}

        <Button size="lg" className="w-full" onClick={advance} disabled={pending}>
          {pending ? "Aguarde…" : label}
        </Button>
      </div>
    );
  }

  /* ---------------------------------------------------------- exercicio */
  const exercise = step.exercise;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {header}

      <RuleSheet blocks={recapBlocks} />

      <Card>
        {exercise.instruction ? (
          <p className="text-xs font-bold uppercase tracking-wide text-brand">{exercise.instruction}</p>
        ) : null}
        <p className="mt-1.5 mb-5 text-lg font-semibold">{exercise.question}</p>

        {/* exercicio de listening: o audio da faixa fica junto da pergunta */}
        {step.media?.kind === "audio" ? (
          <AudioPlayer
            src={step.media.url}
            durationHint={step.media.durationSeconds}
            className="mb-5 bg-surface-muted/60"
          />
        ) : null}

        <ExerciseInput
          exercise={exercise}
          value={answer}
          onChange={setAnswer}
          disabled={pending || feedback !== null}
        />
      </Card>

      {error ? <ErrorMessage>{error}</ErrorMessage> : null}

      {showInsight && feedback && !feedback.isCorrect ? (
        <AIInsight
          key={exercise.id}
          exerciseId={exercise.id}
          studentAnswer={answer}
          onClose={() => setShowInsight(false)}
        />
      ) : null}

      {/* fim da faixa: agora a transcricao ja nao entrega resposta nenhuma */}
      {feedback && step.endsTrack && step.media ? (
        <Card className="p-5">
          <p className="mb-3 text-xs font-bold uppercase tracking-wide text-text-muted">
            {step.media.title}
          </p>
          <TranscriptReveal mediaId={step.media.id} />
        </Card>
      ) : null}

      {feedback ? (
        <Feedback
          feedback={feedback}
          onContinue={advance}
          onExplain={() => setShowInsight(true)}
          insightOpen={showInsight}
          pending={pending}
          isLast={isLastStep}
        />
      ) : (
        <Button
          size="lg"
          className="w-full"
          onClick={check}
          disabled={pending || !hasAnswer(exercise.type, answer)}
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

/**
 * Consulta rapida durante a pratica.
 *
 * A explicacao sai da tela quando o exercicio comeca, e o aluno acabava
 * respondendo de memoria a tabela que leu dois minutos antes. Fechado por
 * padrao: quem nao precisa nao perde a tela, e quem precisa nao perde a
 * resposta ja digitada, porque <details> nao remonta o formulario.
 */
function RuleSheet({ blocks }: { blocks: LessonBlock[] }) {
  if (blocks.length === 0) return null;
  return (
    <details className="group rounded-[var(--radius-card)] border border-[var(--border)] bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-5 py-3.5 text-sm font-semibold text-text-muted hover:text-text [&::-webkit-details-marker]:hidden">
        <BookOpen size={16} aria-hidden />
        Ver a regra
        <ChevronDown size={16} className="ml-auto transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="space-y-5 border-t border-[var(--border)] px-5 py-4">
        {blocks.map((block) => (
          <BlockRecap key={block.id} title={block.title} content={block.content} />
        ))}
      </div>
    </details>
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
  onExplain,
  insightOpen,
  pending,
  isLast,
}: {
  feedback: AnswerFeedback;
  onContinue: () => void;
  onExplain: () => void;
  insightOpen: boolean;
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
        {!ok && !insightOpen ? (
          <Button variant="secondary" size="lg" onClick={onExplain} className="gap-1.5">
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

        <dl className="mt-6 grid grid-cols-2 gap-3 text-left sm:grid-cols-5">
          {[
            { label: "XP ganho", value: `+${summary.xpEarned}` },
            { label: "Tempo", value: formatMinutes(summary.studyMinutes) },
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

        {summary.newAchievements.length > 0 ? (
          <div className="mt-6 rounded-xl border-2 border-brand/40 bg-brand/6 p-4 text-left">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-brand">
              <Trophy size={14} aria-hidden />
              {summary.newAchievements.length === 1 ? "Nova conquista" : "Novas conquistas"}
            </p>
            <ul className="space-y-1">
              {summary.newAchievements.map((a) => (
                <li key={a.code} className="font-semibold">
                  {a.title}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Link href="/app" className={buttonClasses("primary", "lg", "mt-7 w-full")}>
          Voltar para a trilha
        </Link>
      </Card>
    </div>
  );
}
