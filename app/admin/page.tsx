import { Check, X } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Card, EmptyState } from "@/components/ui";
import { getAdminCounts, getRecentActivity } from "@/lib/admin";

export const metadata: Metadata = { title: "Dashboard" };

function CountCard({ label, value, href }: { label: string; value: number; href?: string }) {
  const inner = (
    <>
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tabular-nums">{value}</p>
    </>
  );
  return href ? (
    <Link href={href}>
      <Card className="p-4 transition-shadow hover:shadow-[var(--shadow-lift)]">{inner}</Card>
    </Link>
  ) : (
    <Card className="p-4">{inner}</Card>
  );
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "agora";
  if (minutes < 60) return `ha ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `ha ${hours} h`;
  return `ha ${Math.round(hours / 24)} d`;
}

export default async function AdminDashboard() {
  const [counts, activity] = await Promise.all([getAdminCounts(), getRecentActivity()]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-text-muted">Visao geral do conteudo e da atividade.</p>
      </header>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <CountCard label="Alunos" value={counts.students} href="/admin/users" />
        <CountCard label="Cursos" value={counts.courses} href="/admin/courses" />
        <CountCard label="Modulos" value={counts.modules} />
        <CountCard label="Licoes" value={counts.lessons} />
        <CountCard label="Exercicios" value={counts.exercises} />
        <CountCard label="Audios e imagens" value={counts.media} href="/admin/media" />
        <CountCard label="Respostas" value={counts.attempts} href="/admin/reports" />
      </div>

      <section aria-labelledby="atividade">
        <h2 id="atividade" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Atividade recente
        </h2>
        {activity.length === 0 ? (
          <EmptyState
            title="Nenhuma resposta ainda"
            description="Assim que os alunos comecarem a responder, a atividade aparece aqui."
          />
        ) : (
          <ul className="space-y-2">
            {activity.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-surface px-4 py-2.5"
              >
                <span
                  className={`grid size-7 shrink-0 place-items-center rounded-full ${
                    item.isCorrect ? "bg-success/15 text-success" : "bg-error/15 text-error"
                  }`}
                >
                  {item.isCorrect ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{item.lessonTitle}</span>
                <span className="shrink-0 text-xs text-text-muted">{relativeTime(item.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
