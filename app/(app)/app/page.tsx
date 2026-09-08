import { ChevronRight, RotateCcw } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LearningPath } from "@/components/learning-path";
import { buttonClasses, Card, EmptyState, ProgressBar } from "@/components/ui";
import { getLearningPath, getUserStats } from "@/lib/queries";
import { getReviewCount } from "@/lib/review";
import { getCurrentUser } from "@/lib/supabase/server";
import { greetingFor } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const [user, path, stats, reviewCount] = await Promise.all([
    getCurrentUser(),
    getLearningPath(),
    getUserStats(),
    getReviewCount(),
  ]);

  const firstName = (user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] ?? "aluno";

  if (!path) {
    return (
      <EmptyState
        title="Nenhum curso publicado ainda"
        description="Assim que um curso for publicado no painel, sua trilha aparece aqui."
      />
    );
  }

  const percent = path.totalCount === 0 ? 0 : (path.completedCount / path.totalCount) * 100;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {greetingFor()}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-text-muted">
          {path.currentLesson
            ? `Sua proxima licao e ${path.currentLesson.title}.`
            : "Voce concluiu todas as licoes desta unidade."}
        </p>
      </header>

      <Card className="gradient-flow border-transparent text-white">
        <p className="text-sm/relaxed font-semibold opacity-90">{path.course.title}</p>
        <Link
          href={`/app/module/${path.module.id}`}
          className="mt-1 inline-flex items-center gap-1.5 text-xl font-extrabold hover:underline"
        >
          {path.module.title}
          <ChevronRight size={18} aria-hidden />
          <span className="sr-only">Ver detalhes da unidade</span>
        </Link>
        <div className="mt-5 flex items-center gap-4">
          <ProgressBar
            value={percent}
            label={`Progresso da unidade: ${path.completedCount} de ${path.totalCount} licoes`}
            className="bg-white/25"
          />
          <span className="shrink-0 text-sm font-bold tabular-nums">
            {path.completedCount}/{path.totalCount}
          </span>
        </div>
        <dl className="mt-5 grid grid-cols-3 gap-3 text-center">
          {[
            { label: "XP", value: stats.xpTotal },
            { label: "Sequencia", value: `${stats.currentStreak}d` },
            { label: "Recorde", value: `${stats.bestStreak}d` },
          ].map((item) => (
            <div key={item.label} className="rounded-xl bg-white/15 py-2.5">
              <dt className="text-[11px] font-semibold uppercase tracking-wide opacity-85">{item.label}</dt>
              <dd className="text-lg font-extrabold tabular-nums">{item.value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      {path.currentLesson ? (
        <Card className="flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">Continuar</p>
            <p className="truncate text-lg font-bold">{path.currentLesson.title}</p>
          </div>
          <Link href={`/app/lesson/${path.currentLesson.id}`} className={buttonClasses("primary", "lg", "shrink-0")}>
            Comecar
          </Link>
        </Card>
      ) : null}

      {reviewCount > 0 ? (
        <Link
          href="/app/review"
          className="flex items-center gap-3 rounded-[var(--radius-card)] border border-error/35 bg-error/6 p-4 transition-shadow hover:shadow-[var(--shadow-soft)]"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-error/15 text-error">
            <RotateCcw size={18} aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block font-bold">
              {reviewCount} exercicio(s) para revisar
            </span>
            <span className="block text-sm text-text-muted">
              Refazer o que voce errou fixa mais do que avancar.
            </span>
          </span>
          <ChevronRight size={18} aria-hidden className="ml-auto shrink-0 text-text-muted" />
        </Link>
      ) : null}

      <section aria-labelledby="trilha">
        <h2 id="trilha" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Trilha de licoes
        </h2>
        <LearningPath lessons={path.lessons} currentLessonId={path.currentLesson?.id ?? null} />
      </section>
    </div>
  );
}
