import type { Metadata } from "next";

import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { getLearningPath, getUserStats } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Progresso" };

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </Card>
  );
}

export default async function ProgressPage() {
  const supabase = await createSupabaseServerClient();
  const [path, stats] = await Promise.all([getLearningPath(), getUserStats()]);

  // precisao geral pela primeira tentativa de cada exercicio
  const { data: attempts } = await supabase
    .from("user_exercise_attempts")
    .select("exercise_id,is_correct,attempt_number")
    .eq("attempt_number", 1);

  const answered = attempts?.length ?? 0;
  const correct = attempts?.filter((a) => a.is_correct).length ?? 0;
  const accuracy = answered === 0 ? null : Math.round((correct / answered) * 100);

  if (!path) return <EmptyState title="Nenhum curso publicado ainda" />;

  const percent = path.totalCount === 0 ? 0 : (path.completedCount / path.totalCount) * 100;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Progresso</h1>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="font-bold">{path.module.title}</p>
          <p className="text-sm font-bold tabular-nums text-text-muted">
            {path.completedCount}/{path.totalCount}
          </p>
        </div>
        <ProgressBar className="mt-3" value={percent} label="Progresso do curso" />
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="XP total" value={String(stats.xpTotal)} />
        <StatCard label="Sequencia" value={`${stats.currentStreak}d`} hint={`Recorde ${stats.bestStreak}d`} />
        <StatCard label="Licoes" value={String(path.completedCount)} hint="concluidas" />
        <StatCard label="Exercicios" value={String(answered)} hint="respondidos" />
        <StatCard label="Precisao" value={accuracy === null ? "—" : `${accuracy}%`} hint="na 1a tentativa" />
        <StatCard label="Tempo" value={formatMinutes(stats.totalStudyMinutes)} hint="estudado" />
      </div>

      <section aria-labelledby="por-licao">
        <h2 id="por-licao" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Desempenho por licao
        </h2>
        {path.lessons.filter((l) => l.status === "completed").length === 0 ? (
          <EmptyState title="Nenhuma licao concluida ainda" description="Conclua a primeira para ver seu desempenho." />
        ) : (
          <ul className="space-y-2">
            {path.lessons
              .filter((l) => l.status === "completed")
              .map((l) => (
                <li
                  key={l.id}
                  className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-surface px-4 py-3"
                >
                  <span className="min-w-0 truncate font-semibold">{l.title}</span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-success">
                    {l.accuracy !== null ? `${l.accuracy}%` : "—"}
                  </span>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
