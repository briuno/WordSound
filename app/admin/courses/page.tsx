import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { deleteCourse, saveCourse, setCourseStatus } from "@/app/admin/actions";
import { AdminForm, DeleteButton, Disclosure, PublishToggle } from "@/components/admin-controls";
import { Card, EmptyState, Field, Input } from "@/components/ui";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Cursos" };

export default async function AdminCoursesPage() {
  const supabase = await createSupabaseServerClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id,title,slug,description,level,status,modules(id)")
    .order("position")
    .order("id");

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">Cursos</h1>
        <p className="mt-1 text-sm text-text-muted">
          Um curso reune unidades, que reunem licoes. O aluno ve apenas o que estiver publicado.
        </p>
      </header>

      <Card>
        <Disclosure label="Novo curso">
          {/* bind leva o id para a action; null cria em vez de editar */}
          <AdminForm action={saveCourse.bind(null, null)} submitLabel="Criar curso">
            <Field label="Titulo" htmlFor="new-title">
              <Input id="new-title" name="title" required placeholder="English Basics" />
            </Field>
            <Field label="Slug" htmlFor="new-slug" hint="Identificador na URL, so minusculas, numeros e hifen.">
              <Input id="new-slug" name="slug" required placeholder="english-basics" pattern="[a-z0-9-]+" />
            </Field>
            <Field label="Nivel" htmlFor="new-level">
              <Input id="new-level" name="level" placeholder="A1" />
            </Field>
            <Field label="Descricao" htmlFor="new-description">
              <Input id="new-description" name="description" placeholder="Para quem esta comecando." />
            </Field>
          </AdminForm>
        </Disclosure>
      </Card>

      {!courses?.length ? (
        <EmptyState title="Nenhum curso ainda" description="Crie o primeiro curso acima." />
      ) : (
        <ul className="space-y-3">
          {courses.map((course) => (
            <li key={course.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href={`/admin/courses/${course.id}`}
                    className="inline-flex min-w-0 items-center gap-1.5 font-bold hover:underline"
                  >
                    <span className="truncate">{course.title}</span>
                    <ChevronRight size={16} aria-hidden className="shrink-0" />
                  </Link>
                  <span className="text-xs text-text-muted">
                    {course.modules?.length ?? 0} unidade(s) · {course.level ?? "sem nivel"}
                  </span>
                  <span className="ml-auto flex items-center gap-2">
                    <PublishToggle
                      published={course.status === "published"}
                      action={setCourseStatus.bind(null, course.id)}
                      label="curso"
                    />
                    <DeleteButton
                      action={deleteCourse.bind(null, course.id)}
                      confirmLabel={`o curso ${course.title}`}
                    />
                  </span>
                </div>
                {course.description ? (
                  <p className="mt-1.5 text-sm text-text-muted">{course.description}</p>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
