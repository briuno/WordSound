import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteLesson, moveItem, saveLesson, saveModule, setLessonStatus } from "@/app/admin/actions";
import { AdminForm, DeleteButton, Disclosure, MoveButtons, PublishToggle } from "@/components/admin-controls";
import { Card, EmptyState, Field, Input } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("modules").select("title").eq("id", Number(id)).maybeSingle();
  return { title: data?.title ?? "Unidade" };
}

export default async function AdminModulePage({ params }: Params) {
  const { id } = await params;
  const moduleId = Number(id);
  if (!Number.isInteger(moduleId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: mod } = await supabase
    .from("modules")
    .select("id,title,description,course_id,courses(title)")
    .eq("id", moduleId)
    .maybeSingle();
  if (!mod) notFound();

  const courseTitle =
    (Array.isArray(mod.courses) ? mod.courses[0]?.title : (mod.courses as { title: string } | null)?.title) ?? "";

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,objective,status,position,estimated_minutes,xp_reward,lesson_blocks(id)")
    .eq("module_id", moduleId)
    .order("position")
    .order("id");

  const list = lessons ?? [];

  return (
    <div className="space-y-6">
      <Link
        href={`/admin/courses/${mod.course_id}`}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden />
        {courseTitle || "Voltar ao curso"}
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{mod.title}</h1>
        {mod.description ? <p className="mt-1 text-sm text-text-muted">{mod.description}</p> : null}
      </header>

      <Card>
        <Disclosure label="Editar dados da unidade">
          <AdminForm action={saveModule.bind(null, mod.course_id, mod.id)} submitLabel="Salvar unidade">
            <Field label="Titulo" htmlFor="title">
              <Input id="title" name="title" required defaultValue={mod.title} />
            </Field>
            <Field label="Descricao" htmlFor="description">
              <Input id="description" name="description" defaultValue={mod.description ?? ""} />
            </Field>
          </AdminForm>
        </Disclosure>
      </Card>

      <Card>
        <Disclosure label="Nova licao">
          <AdminForm action={saveLesson.bind(null, moduleId, null)} submitLabel="Criar licao">
            <Field label="Titulo" htmlFor="new-lesson-title">
              <Input id="new-lesson-title" name="title" required placeholder="Greetings & Introductions" />
            </Field>
            <Field label="Objetivo" htmlFor="new-lesson-objective">
              <Input id="new-lesson-objective" name="objective" placeholder="O que o aluno sabera fazer." />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minutos" htmlFor="new-lesson-minutes">
                <Input id="new-lesson-minutes" name="estimatedMinutes" type="number" min={1} defaultValue={10} />
              </Field>
              <Field label="XP" htmlFor="new-lesson-xp">
                <Input id="new-lesson-xp" name="xpReward" type="number" min={0} defaultValue={50} />
              </Field>
            </div>
          </AdminForm>
        </Disclosure>
      </Card>

      <section aria-labelledby="licoes">
        <h2 id="licoes" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Licoes
        </h2>
        {list.length === 0 ? (
          <EmptyState title="Nenhuma licao ainda" description="Crie a primeira licao acima." />
        ) : (
          <ul className="space-y-2">
            {list.map((lesson, index) => (
              <li key={lesson.id}>
                <Card className="flex flex-wrap items-center gap-3 p-4">
                  <MoveButtons
                    onMove={moveItem.bind(null, "lessons", "module_id", moduleId, lesson.id)}
                    isFirst={index === 0}
                    isLast={index === list.length - 1}
                  />
                  <span className="w-6 shrink-0 text-sm font-bold tabular-nums text-text-muted">{index + 1}</span>
                  <Link
                    href={`/admin/lessons/${lesson.id}`}
                    className="inline-flex min-w-0 items-center gap-1.5 font-bold hover:underline"
                  >
                    <span className="truncate">{lesson.title}</span>
                    <ChevronRight size={16} aria-hidden className="shrink-0" />
                  </Link>
                  <span className="text-xs text-text-muted">
                    {lesson.lesson_blocks?.length ?? 0} bloco(s) · {formatMinutes(lesson.estimated_minutes)} ·{" "}
                    {lesson.xp_reward} XP
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <PublishToggle
                      published={lesson.status === "published"}
                      action={setLessonStatus.bind(null, lesson.id)}
                      label="licao"
                    />
                    <DeleteButton
                      action={deleteLesson.bind(null, lesson.id)}
                      confirmLabel={`a licao ${lesson.title}`}
                    />
                  </span>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
