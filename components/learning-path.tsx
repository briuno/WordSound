import { Check, Lock, Play } from "lucide-react";
import Link from "next/link";

import type { LessonNode } from "@/lib/queries";
import { cn, formatMinutes } from "@/lib/utils";

function NodeIcon({ status }: { status: LessonNode["status"] }) {
  if (status === "completed") {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-success text-white">
        <Check size={19} aria-hidden />
      </span>
    );
  }
  if (status === "locked") {
    return (
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-muted text-text-muted">
        <Lock size={17} aria-hidden />
      </span>
    );
  }
  return (
    <span className="gradient-flow grid size-10 shrink-0 place-items-center rounded-full text-white">
      <Play size={17} aria-hidden fill="currentColor" />
    </span>
  );
}

const STATUS_LABEL: Record<LessonNode["status"], string> = {
  completed: "Concluida",
  in_progress: "Em andamento",
  unlocked: "Disponivel",
  locked: "Bloqueada",
};

function LessonRow({ lesson, highlight }: { lesson: LessonNode; highlight: boolean }) {
  const locked = lesson.status === "locked";

  const inner = (
    <>
      <NodeIcon status={lesson.status} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-x-2">
          <span className={cn("font-semibold", locked ? "text-text-muted" : "text-text")}>{lesson.title}</span>
          <span className="text-xs text-text-muted">{formatMinutes(lesson.estimatedMinutes)}</span>
        </span>
        {lesson.objective ? (
          <span className="mt-0.5 block truncate text-sm text-text-muted">{lesson.objective}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "shrink-0 text-xs font-semibold",
          lesson.status === "completed" && "text-success",
          lesson.status === "locked" && "text-text-muted",
          (lesson.status === "unlocked" || lesson.status === "in_progress") && "text-brand",
        )}
      >
        {lesson.status === "completed" && lesson.accuracy !== null
          ? `${lesson.accuracy}%`
          : STATUS_LABEL[lesson.status]}
      </span>
    </>
  );

  const shell = cn(
    "flex items-center gap-4 rounded-[var(--radius-card)] border p-4 transition-shadow",
    highlight
      ? "border-brand/45 bg-surface shadow-[var(--shadow-lift)]"
      : "border-[var(--border)] bg-surface",
    locked && "opacity-60",
  );

  if (locked) {
    return (
      <li>
        <div className={shell} aria-disabled="true">
          {inner}
        </div>
      </li>
    );
  }

  return (
    <li>
      <Link href={`/app/lesson/${lesson.id}`} className={cn(shell, "hover:shadow-[var(--shadow-lift)]")}>
        {inner}
      </Link>
    </li>
  );
}

/** Trilha da unidade. A licao atual recebe destaque (spec 12). */
export function LearningPath({
  lessons,
  currentLessonId,
}: {
  lessons: LessonNode[];
  currentLessonId: number | null;
}) {
  return (
    <ol className="space-y-3">
      {lessons.map((lesson) => (
        <LessonRow key={lesson.id} lesson={lesson} highlight={lesson.id === currentLessonId} />
      ))}
    </ol>
  );
}
