import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteModule, moveItem, saveCourse, saveModule, setModuleStatus } from "@/app/admin/actions";
import { AdminForm, DeleteButton, Disclosure, MoveButtons, PublishToggle } from "@/components/admin-controls";
import { Card, EmptyState, Field, Input } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("courses").select("title").eq("id", Number(id)).maybeSingle();
  return { title: data?.title ?? "Curso" };
}

export default async function AdminCoursePage({ params }: Params) {
  const { id } = await params;
  const courseId = Number(id);
  if (!Number.isInteger(courseId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: course } = await supabase
    .from("courses")
    .select("id,title,slug,description,level,status")
    .eq("id", courseId)
    .maybeSingle();
  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id,title,description,status,position,lessons(id)")
    .eq("course_id", courseId)
    .order("position")
    .order("id");

  const list = modules ?? [];

  return (
    <div className="space-y-6">
      <Link
        href="/admin/courses"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text"
      >
        <ArrowLeft size={16} aria-hidden />
        Todos os cursos
      </Link>

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{course.title}</h1>
        <p className="mt-1 text-sm text-text-muted">
          /{course.slug} · {course.level ?? "sem nivel"}
        </p>
      </header>

      <Card>
        <Disclosure label="Editar dados do curso">
          <AdminForm action={saveCourse.bind(null, course.id)} submitLabel="Salvar curso">
            <Field label="Titulo" htmlFor="title">
              <Input id="title" name="title" required defaultValue={course.title} />
            </Field>
            <Field label="Slug" htmlFor="slug">
              <Input id="slug" name="slug" required defaultValue={course.slug} pattern="[a-z0-9-]+" />
            </Field>
            <Field label="Nivel" htmlFor="level">
              <Input id="level" name="level" defaultValue={course.level ?? ""} />
            </Field>
            <Field label="Descricao" htmlFor="description">
              <Input id="description" name="description" defaultValue={course.description ?? ""} />
            </Field>
          </AdminForm>
        </Disclosure>
      </Card>

      <Card>
        <Disclosure label="Nova unidade">
          <AdminForm action={saveModule.bind(null, courseId, null)} submitLabel="Criar unidade">
            <Field label="Titulo" htmlFor="new-module-title">
              <Input id="new-module-title" name="title" required placeholder="Unit 2 — Everyday Life" />
            </Field>
            <Field label="Descricao" htmlFor="new-module-description">
              <Input id="new-module-description" name="description" placeholder="O que a unidade cobre." />
            </Field>
          </AdminForm>
        </Disclosure>
      </Card>

      <section aria-labelledby="unidades">
        <h2 id="unidades" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Unidades
        </h2>
        {list.length === 0 ? (
          <EmptyState title="Nenhuma unidade ainda" description="Crie a primeira unidade acima." />
        ) : (
          <ul className="space-y-2">
            {list.map((mod, index) => (
              <li key={mod.id}>
                <Card className="flex flex-wrap items-center gap-3 p-4">
                  <MoveButtons
                    onMove={moveItem.bind(null, "modules", "course_id", courseId, mod.id)}
                    isFirst={index === 0}
                    isLast={index === list.length - 1}
                  />
                  <Link
                    href={`/admin/modules/${mod.id}`}
                    className="inline-flex min-w-0 items-center gap-1.5 font-bold hover:underline"
                  >
                    <span className="truncate">{mod.title}</span>
                    <ChevronRight size={16} aria-hidden className="shrink-0" />
                  </Link>
                  <span className="text-xs text-text-muted">{mod.lessons?.length ?? 0} licao(oes)</span>
                  <span className="ml-auto flex items-center gap-2">
                    <PublishToggle
                      published={mod.status === "published"}
                      action={setModuleStatus.bind(null, mod.id)}
                      label="unidade"
                    />
                    <DeleteButton
                      action={deleteModule.bind(null, mod.id)}
                      confirmLabel={`a unidade ${mod.title}`}
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
