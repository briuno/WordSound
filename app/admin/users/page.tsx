import type { Metadata } from "next";

import { Card, EmptyState } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Alunos" };

function formatDate(iso: string | null): string {
  if (!iso) return "nunca";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default async function AdminUsersPage() {
  const supabase = await createSupabaseServerClient();

  // As policies de admin liberam a leitura destas tabelas; nada de service_role
  const [{ data: profiles }, { data: stats }, { data: progress }, { data: attempts }] = await Promise.all([
    supabase.from("profiles").select("id,full_name,role,created_at").order("created_at"),
    supabase.from("user_stats").select("user_id,xp_total,current_streak,total_study_minutes,last_study_date"),
    supabase.from("user_progress").select("user_id,status"),
    supabase.from("user_exercise_attempts").select("user_id,is_correct,attempt_number"),
  ]);

  const statsBy = new Map((stats ?? []).map((s) => [s.user_id, s]));

  const completedBy = new Map<string, number>();
  for (const row of progress ?? []) {
    if (row.status === "completed") completedBy.set(row.user_id, (completedBy.get(row.user_id) ?? 0) + 1);
  }

  // precisao pela primeira tentativa de cada exercicio, igual a tela do aluno
  const answered = new Map<string, number>();
  const correct = new Map<string, number>();
  for (const row of attempts ?? []) {
    if (row.attempt_number !== 1) continue;
    answered.set(row.user_id, (answered.get(row.user_id) ?? 0) + 1);
    if (row.is_correct) correct.set(row.user_id, (correct.get(row.user_id) ?? 0) + 1);
  }

  const rows = (profiles ?? []).map((p) => {
    const total = answered.get(p.id) ?? 0;
    return {
      id: p.id,
      name: p.full_name ?? "(sem nome)",
      role: p.role,
      joinedAt: p.created_at,
      xp: statsBy.get(p.id)?.xp_total ?? 0,
      streak: statsBy.get(p.id)?.current_streak ?? 0,
      minutes: statsBy.get(p.id)?.total_study_minutes ?? 0,
      lastStudy: statsBy.get(p.id)?.last_study_date ?? null,
      lessons: completedBy.get(p.id) ?? 0,
      accuracy: total === 0 ? null : Math.round(((correct.get(p.id) ?? 0) / total) * 100),
      answered: total,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Alunos</h1>
        <p className="mt-1 text-sm text-text-muted">
          {rows.length} conta(s). A precisao considera a primeira tentativa de cada exercicio.
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState title="Nenhuma conta ainda" />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[46rem] text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs uppercase tracking-wide text-text-muted">
                <th className="px-4 py-3 font-semibold">Aluno</th>
                <th className="px-4 py-3 text-right font-semibold">XP</th>
                <th className="px-4 py-3 text-right font-semibold">Sequencia</th>
                <th className="px-4 py-3 text-right font-semibold">Licoes</th>
                <th className="px-4 py-3 text-right font-semibold">Respostas</th>
                <th className="px-4 py-3 text-right font-semibold">Precisao</th>
                <th className="px-4 py-3 text-right font-semibold">Tempo</th>
                <th className="px-4 py-3 text-right font-semibold">Ultimo acesso</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-b border-[var(--border)] last:border-0">
                  <td className="px-4 py-3">
                    <span className="font-semibold">{row.name}</span>
                    {row.role === "admin" ? (
                      <span className="ml-2 rounded-[var(--radius-pill)] bg-purple/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-purple">
                        admin
                      </span>
                    ) : null}
                    <span className="block text-xs text-text-muted">desde {formatDate(row.joinedAt)}</span>
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.xp}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.streak}d</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.lessons}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{row.answered}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {row.accuracy === null ? "—" : `${row.accuracy}%`}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMinutes(row.minutes)}</td>
                  <td className="px-4 py-3 text-right text-text-muted">{formatDate(row.lastStudy)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
