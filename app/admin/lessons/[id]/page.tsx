import { ArrowLeft, Eye } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteBlock, deleteExercise, moveItem, saveLesson, setLessonStatus } from "@/app/admin/actions";
import { AddBlockButtons } from "@/components/admin-add-block";
import { BlockContentEditor } from "@/components/admin-block-editor";
import { AdminForm, DeleteButton, Disclosure, MoveButtons, PublishToggle } from "@/components/admin-controls";
import { ExerciseEditor, type ExerciseDraft } from "@/components/admin-exercise-editor";
import { Card, EmptyState, Field, Input } from "@/components/ui";
import { EXERCISE_REGISTRY } from "@/lib/exercises/registry";
import type { ExerciseType } from "@/lib/exercises/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { params: Promise<{ id: string }> };

const BLOCK_LABEL: Record<string, string> = {
  CONTENT: "Conteudo",
  VOCABULARY: "Vocabulario",
  GRAMMAR: "Gramatica",
  READING: "Reading",
  LISTENING: "Listening",
  EXERCISE: "Exercicios",
  AI_REVIEW: "Revisao com IA",
};

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("lessons").select("title").eq("id", Number(id)).maybeSingle();
  return { title: data?.title ?? "Licao" };
}

export default async function AdminLessonPage({ params }: Params) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId)) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,title,objective,description,estimated_minutes,xp_reward,status,module_id,modules(title)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) notFound();

  const moduleTitle =
    (Array.isArray(lesson.modules) ? lesson.modules[0]?.title : (lesson.modules as { title: string } | null)?.title) ??
    "";

  const [{ data: blocks }, { data: audios }] = await Promise.all([
    supabase
      .from("lesson_blocks")
      .select("id,block_type,title,content,media_id,position")
      .eq("lesson_id", lessonId)
      .order("position")
      .order("id"),
    supabase.from("media").select("id,title").eq("kind", "audio").order("title"),
  ]);

  const blockList = blocks ?? [];
  const audioList = audios ?? [];

  // O admin le exercicios pela policy de admin, entao o cliente do usuario basta
  const { data: exercises } = await supabase
    .from("exercises")
    .select(
      "id,lesson_block_id,exercise_type,question,instruction,explanation,difficulty,xp_reward,position,prompt,answer_key,media_id,exercise_options(text,is_correct,position)",
    )
    .in("lesson_block_id", blockList.map((b) => b.id))
    .order("position");

  const byBlock = new Map<number, ExerciseDraft[]>();
  for (const row of exercises ?? []) {
    const list = byBlock.get(row.lesson_block_id) ?? [];
    list.push({
      id: row.id,
      type: row.exercise_type as ExerciseType,
      question: row.question,
      instruction: row.instruction,
      explanation: row.explanation,
      difficulty: row.difficulty,
      xpReward: row.xp_reward,
      mediaId: row.media_id,
      prompt: (row.prompt ?? {}) as Record<string, unknown>,
      answerKey: (row.answer_key ?? {}) as Record<string, unknown>,
      options: (row.exercise_options ?? [])
        .sort((a, b) => a.position - b.position)
        .map((o) => ({ text: o.text, isCorrect: o.is_correct })),
    });
    byBlock.set(row.lesson_block_id, list);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href={`/admin/modules/${lesson.module_id}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-muted hover:text-text"
        >
          <ArrowLeft size={16} aria-hidden />
          {moduleTitle || "Voltar a unidade"}
        </Link>
        <span className="ml-auto flex items-center gap-2">
          <PublishToggle
            published={lesson.status === "published"}
            action={setLessonStatus.bind(null, lesson.id)}
            label="licao"
          />
          <Link
            href={`/app/lesson/${lesson.id}`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-xs font-semibold text-text-muted hover:text-text"
          >
            <Eye size={14} aria-hidden />
            Ver como aluno
          </Link>
        </span>
      </div>

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight">{lesson.title}</h1>
        {lesson.objective ? <p className="mt-1 text-sm text-text-muted">{lesson.objective}</p> : null}
      </header>

      <Card>
        <Disclosure label="Editar dados da licao">
          <AdminForm action={saveLesson.bind(null, lesson.module_id, lesson.id)} submitLabel="Salvar licao">
            <Field label="Titulo" htmlFor="title">
              <Input id="title" name="title" required defaultValue={lesson.title} />
            </Field>
            <Field label="Objetivo" htmlFor="objective">
              <Input id="objective" name="objective" defaultValue={lesson.objective ?? ""} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Minutos" htmlFor="minutes">
                <Input
                  id="minutes"
                  name="estimatedMinutes"
                  type="number"
                  min={1}
                  defaultValue={lesson.estimated_minutes}
                />
              </Field>
              <Field label="XP da licao" htmlFor="xp">
                <Input id="xp" name="xpReward" type="number" min={0} defaultValue={lesson.xp_reward} />
              </Field>
            </div>
          </AdminForm>
        </Disclosure>
      </Card>

      <Card>
        <p className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">Adicionar bloco</p>
        <AddBlockButtons lessonId={lessonId} />
      </Card>

      <section aria-labelledby="blocos" className="space-y-3">
        <h2 id="blocos" className="text-sm font-bold uppercase tracking-wide text-text-muted">
          Blocos da licao
        </h2>

        {blockList.length === 0 ? (
          <EmptyState title="Nenhum bloco ainda" description="Use os botoes acima para montar a licao." />
        ) : (
          blockList.map((block, index) => {
            const blockExercises = byBlock.get(block.id) ?? [];
            return (
              <Card key={block.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <MoveButtons
                    onMove={moveItem.bind(null, "lesson_blocks", "lesson_id", lessonId, block.id)}
                    isFirst={index === 0}
                    isLast={index === blockList.length - 1}
                  />
                  <span className="rounded-[var(--radius-pill)] bg-surface-muted px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-text-muted">
                    {BLOCK_LABEL[block.block_type] ?? block.block_type}
                  </span>
                  <span className="min-w-0 truncate font-bold">{block.title ?? "(sem titulo)"}</span>
                  <span className="ml-auto">
                    <DeleteButton
                      action={deleteBlock.bind(null, block.id, lessonId)}
                      confirmLabel="este bloco"
                    />
                  </span>
                </div>

                <div className="mt-4 border-t border-[var(--border)] pt-4">
                  {block.block_type === "EXERCISE" ? (
                    <div className="space-y-3">
                      {blockExercises.length === 0 ? (
                        <p className="text-sm text-text-muted">Nenhum exercicio neste bloco ainda.</p>
                      ) : (
                        <ul className="space-y-2">
                          {blockExercises.map((exercise, exerciseIndex) => (
                            <li
                              key={exercise.id}
                              className="rounded-xl border border-[var(--border)] bg-surface-muted/50 p-3"
                            >
                              <div className="flex flex-wrap items-center gap-2.5">
                                <MoveButtons
                                  onMove={moveItem.bind(
                                    null,
                                    "exercises",
                                    "lesson_block_id",
                                    block.id,
                                    exercise.id,
                                  )}
                                  isFirst={exerciseIndex === 0}
                                  isLast={exerciseIndex === blockExercises.length - 1}
                                />
                                <span className="text-[11px] font-bold uppercase tracking-wide text-brand">
                                  {EXERCISE_REGISTRY[exercise.type]?.label ?? exercise.type}
                                </span>
                                <span className="min-w-0 flex-1 truncate text-sm">{exercise.question}</span>
                                <DeleteButton
                                  action={deleteExercise.bind(null, exercise.id, lessonId)}
                                  confirmLabel="este exercicio"
                                />
                              </div>
                              <div className="mt-3">
                                <Disclosure label="Editar exercicio">
                                  <ExerciseEditor
                                    blockId={block.id}
                                    lessonId={lessonId}
                                    audios={audioList}
                                    draft={exercise}
                                  />
                                </Disclosure>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}

                      <Disclosure label="Adicionar exercicio">
                        <ExerciseEditor blockId={block.id} lessonId={lessonId} audios={audioList} />
                      </Disclosure>
                    </div>
                  ) : (
                    <BlockContentEditor
                      blockId={block.id}
                      lessonId={lessonId}
                      blockType={block.block_type}
                      title={block.title}
                      content={(block.content ?? {}) as Record<string, unknown>}
                      mediaId={block.media_id}
                      audios={audioList}
                    />
                  )}
                </div>
              </Card>
            );
          })
        )}
      </section>
    </div>
  );
}
