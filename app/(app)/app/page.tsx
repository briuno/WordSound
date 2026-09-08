import type { Metadata } from "next";
import Link from "next/link";

import { LearningPath } from "@/components/learning-path";
import { buttonClasses, Card, EmptyState, ProgressBar } from "@/components/ui";
import { getLearningPath, getUserStats } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/server";
import { greetingFor } from "@/lib/utils";

export const metadata: Metadata = { title: "Home" };

export default async function HomePage() {
  const [user, path, stats] = await Promise.all([getCurrentUser(), getLearningPath(), getUserStats()]);

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
        <h2 className="mt-1 text-xl font-extrabold">{path.module.title}</h2>
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

      <section aria-labelledby="trilha">
        <h2 id="trilha" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Trilha de licoes
        </h2>
        <LearningPath lessons={path.lessons} currentLessonId={path.currentLesson?.id ?? null} />
      </section>
    </div>
  );
}
