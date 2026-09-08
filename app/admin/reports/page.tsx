import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState, ProgressBar } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatorios" };

/** Corte de "aluno ativo". Fora do componente porque o corpo dele deve ser puro. */
function cutoffForActiveStudents(): string {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
      {hint ? <p className="text-xs text-text-muted">{hint}</p> : null}
    </Card>
  );
}

export default async function AdminReportsPage() {
  const supabase = await createSupabaseServerClient();

  const [{ data: attempts }, { data: exercises }, { data: progress }, { data: lessons }, { data: stats }] =
    await Promise.all([
      supabase.from("user_exercise_attempts").select("exercise_id,lesson_id,user_id,is_correct,attempt_number"),
      supabase.from("exercises").select("id,question,exercise_type,lesson_block_id"),
      supabase.from("user_progress").select("lesson_id,user_id,status,accuracy"),
      supabase.from("lessons").select("id,title,position,status"),
      supabase.from("user_stats").select("user_id,total_study_minutes,last_study_date"),
    ]);

  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const lessonById = new Map((lessons ?? []).map((l) => [l.id, l]));

  /* ----------------------------- indicadores gerais ----------------------------- */

  const firstTries = (attempts ?? []).filter((a) => a.attempt_number === 1);
  const globalAccuracy =
    firstTries.length === 0
      ? null
      : Math.round((firstTries.filter((a) => a.is_correct).length / firstTries.length) * 100);

  const completions = (progress ?? []).filter((p) => p.status === "completed");
  const startedLessons = new Set((progress ?? []).map((p) => `${p.user_id}:${p.lesson_id}`)).size;
  const completionRate =
    startedLessons === 0 ? null : Math.round((completions.length / startedLessons) * 100);

  const avgMinutes =
    (stats ?? []).length === 0
      ? 0
      : Math.round((stats ?? []).reduce((sum, s) => sum + (s.total_study_minutes ?? 0), 0) / (stats ?? []).length);

  // ativo = estudou nos ultimos sete dias
  const sevenDaysAgo = cutoffForActiveStudents();
  const activeStudents = (stats ?? []).filter((s) => (s.last_study_date ?? "") >= sevenDaysAgo).length;

  /* ------------------------- exercicios com mais erros ------------------------- */

  const wrongBy = new Map<number, { wrong: number; total: number }>();
  for (const a of firstTries) {
    const entry = wrongBy.get(a.exercise_id) ?? { wrong: 0, total: 0 };
    entry.total += 1;
    if (!a.is_correct) entry.wrong += 1;
    wrongBy.set(a.exercise_id, entry);
  }
  const hardestExercises = [...wrongBy.entries()]
    .map(([id, e]) => ({ id, ...e, rate: e.wrong / e.total, exercise: exerciseById.get(id) }))
    .filter((e) => e.exercise && e.wrong > 0)
    .sort((a, b) => b.rate - a.rate || b.wrong - a.wrong)
    .slice(0, 8);

  /* ----------------------------- licoes mais dificeis ----------------------------- */

  const lessonAccuracy = new Map<number, number[]>();
  for (const p of completions) {
    if (p.accuracy === null) continue;
    const list = lessonAccuracy.get(p.lesson_id) ?? [];
    list.push(Number(p.accuracy));
    lessonAccuracy.set(p.lesson_id, list);
  }
  const lessonRows = [...lessonAccuracy.entries()]
    .map(([id, values]) => ({
      id,
      title: lessonById.get(id)?.title ?? "(removida)",
      completions: values.length,
      average: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
    }))
    .sort((a, b) => a.average - b.average);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Relatorios</h1>
        <p className="mt-1 text-sm text-text-muted">
          Tudo aqui usa a primeira tentativa de cada exercicio, que e o que mede aprendizado.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Precisao media"
          value={globalAccuracy === null ? "—" : `${globalAccuracy}%`}
          hint="na 1a tentativa"
        />
        <StatCard
          label="Conclusao"
          value={completionRate === null ? "—" : `${completionRate}%`}
          hint="das licoes iniciadas"
        />
        <StatCard label="Tempo medio" value={formatMinutes(avgMinutes)} hint="por aluno" />
        <StatCard label="Alunos ativos" value={String(activeStudents)} hint="nos ultimos 7 dias" />
      </div>

      <section aria-labelledby="dificeis">
        <h2 id="dificeis" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Exercicios com mais erros
        </h2>
        {hardestExercises.length === 0 ? (
          <EmptyState
            title="Nenhum erro registrado ainda"
            description="Quando os alunos errarem, os exercicios mais dificeis aparecem aqui."
          />
        ) : (
          <ul className="space-y-2">
            {hardestExercises.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-[var(--border)] bg-surface px-4 py-3"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {item.exercise?.question}
                  </span>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-error">
                    {Math.round(item.rate * 100)}% de erro
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-text-muted">
                  {item.wrong} erro(s) em {item.total} resposta(s) · {item.exercise?.exercise_type}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="licoes">
        <h2 id="licoes" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Desempenho por licao
        </h2>
        {lessonRows.length === 0 ? (
          <EmptyState title="Nenhuma licao concluida ainda" />
        ) : (
          <ul className="space-y-2">
            {lessonRows.map((row) => (
              <li key={row.id} className="rounded-xl border border-[var(--border)] bg-surface px-4 py-3">
                <div className="flex flex-wrap items-baseline gap-3">
                  <Link href={`/admin/lessons/${row.id}`} className="font-semibold hover:underline">
                    {row.title}
                  </Link>
                  <span className="text-xs text-text-muted">{row.completions} conclusao(oes)</span>
                  <span className="ml-auto text-sm font-bold tabular-nums">{row.average}%</span>
                </div>
                <ProgressBar className="mt-2" value={row.average} label={`Precisao media em ${row.title}`} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
