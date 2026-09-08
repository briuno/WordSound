import { ArrowLeft, Clock, Target, TrendingUp } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LearningPath } from "@/components/learning-path";
import { Card, ProgressBar } from "@/components/ui";
import { getModuleDetail } from "@/lib/queries";
import { formatMinutes } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const detail = await getModuleDetail(Number(id));
  return { title: detail?.module.title ?? "Unidade" };
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-muted px-3.5 py-3">
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-text-muted">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 text-lg font-extrabold tabular-nums">{value}</dd>
    </div>
  );
}

export default async function ModulePage({ params }: Params) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId) || moduleId <= 0) notFound();

  const detail = await getModuleDetail(moduleId);
  if (!detail) notFound();

  const percent = detail.totalCount === 0 ? 0 : (detail.completedCount / detail.totalCount) * 100;

  return (
    <div className="space-y-6">
      <Link
        href="/app"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden />
        Voltar para a trilha
      </Link>

      <header>
        <p className="text-xs font-bold uppercase tracking-wide text-brand">{detail.course.title}</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{detail.module.title}</h1>
        {detail.module.description ? (
          <p className="mt-2 text-text-muted">{detail.module.description}</p>
        ) : null}
      </header>

      <Card>
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-text-muted">Progresso da unidade</p>
          <p className="text-sm font-bold tabular-nums">
            {detail.completedCount}/{detail.totalCount}
          </p>
        </div>
        <ProgressBar className="mt-3" value={percent} label="Progresso da unidade" />

        <dl className="mt-5 grid grid-cols-3 gap-3">
          <Stat icon={<Target size={15} aria-hidden />} label="Licoes" value={String(detail.totalCount)} />
          <Stat icon={<Clock size={15} aria-hidden />} label="Duracao" value={formatMinutes(detail.totalMinutes)} />
          <Stat
            icon={<TrendingUp size={15} aria-hidden />}
            label="Precisao"
            value={detail.accuracy === null ? "—" : `${detail.accuracy}%`}
          />
        </dl>
      </Card>

      {detail.objectives.length > 0 ? (
        <Card>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
            Objetivos de aprendizado
          </h2>
          <ul className="space-y-2 text-sm">
            {detail.objectives.map((objective, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {objective}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <section aria-labelledby="licoes">
        <h2 id="licoes" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Licoes
        </h2>
        <LearningPath lessons={detail.lessons} currentLessonId={detail.currentLesson?.id ?? null} />
      </section>
    </div>
  );
}
