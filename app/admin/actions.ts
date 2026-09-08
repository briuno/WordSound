"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/admin";
import { EXERCISE_TYPES } from "@/lib/exercises/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Escritas do painel administrativo.
 *
 * Tudo passa pelo cliente do usuario logado, nao pelo service_role: as policies
 * de admin no Postgres sao a autorizacao real. requireAdmin() aqui evita o
 * trabalho inutil e devolve erro legivel, mas nao e o que protege os dados.
 */

export interface ActionResult {
  ok?: true;
  error?: string;
}

const ok: ActionResult = { ok: true };
const fail = (error: string): ActionResult => ({ error });

function firstIssue(result: z.ZodSafeParseResult<unknown>): string | null {
  return result.success ? null : (result.error.issues[0]?.message ?? "Dados invalidos.");
}

function refreshAll(...paths: string[]) {
  for (const path of ["/admin", "/app", ...paths]) revalidatePath(path);
}

/* ============================== cursos ============================== */

const CourseSchema = z.object({
  title: z.string().trim().min(2, "Informe o titulo do curso."),
  slug: z
    .string()
    .trim()
    .min(2, "Informe o slug.")
    .regex(/^[a-z0-9-]+$/, "O slug aceita apenas letras minusculas, numeros e hifen."),
  description: z.string().trim().optional(),
  level: z.string().trim().optional(),
});

export async function saveCourse(courseId: number | null, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const parsed = CourseSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    description: formData.get("description") ?? undefined,
    level: formData.get("level") ?? undefined,
  });
  const issue = firstIssue(parsed);
  if (issue || !parsed.success) return fail(issue ?? "Dados invalidos.");

  const supabase = await createSupabaseServerClient();
  const values = {
    title: parsed.data.title,
    slug: parsed.data.slug,
    description: parsed.data.description || null,
    level: parsed.data.level || null,
  };

  const { error } = courseId
    ? await supabase.from("courses").update(values).eq("id", courseId)
    : await supabase.from("courses").insert(values);

  if (error) {
    return fail(error.code === "23505" ? "Ja existe um curso com esse slug." : error.message);
  }
  refreshAll("/admin/courses");
  return ok;
}

export async function setCourseStatus(courseId: number, publish: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("courses")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", courseId);
  if (error) return fail(error.message);
  refreshAll("/admin/courses");
  return ok;
}

export async function deleteCourse(courseId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("courses").delete().eq("id", courseId);
  if (error) return fail(error.message);
  refreshAll("/admin/courses");
  return ok;
}

/* ============================== modulos ============================== */

const ModuleSchema = z.object({
  title: z.string().trim().min(2, "Informe o titulo da unidade."),
  description: z.string().trim().optional(),
});

export async function saveModule(
  courseId: number,
  moduleId: number | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ModuleSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
  });
  const issue = firstIssue(parsed);
  if (issue || !parsed.success) return fail(issue ?? "Dados invalidos.");

  const supabase = await createSupabaseServerClient();
  const values = { title: parsed.data.title, description: parsed.data.description || null };

  if (moduleId) {
    const { error } = await supabase.from("modules").update(values).eq("id", moduleId);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase
      .from("modules")
      .insert({ ...values, course_id: courseId, position: await nextPosition("modules", "course_id", courseId) });
    if (error) return fail(error.message);
  }
  refreshAll(`/admin/courses/${courseId}`);
  return ok;
}

export async function setModuleStatus(moduleId: number, publish: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("modules")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", moduleId);
  if (error) return fail(error.message);
  refreshAll();
  return ok;
}

export async function deleteModule(moduleId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("modules").delete().eq("id", moduleId);
  if (error) return fail(error.message);
  refreshAll();
  return ok;
}

/* ============================== licoes ============================== */

const LessonSchema = z.object({
  title: z.string().trim().min(2, "Informe o titulo da licao."),
  objective: z.string().trim().optional(),
  description: z.string().trim().optional(),
  estimatedMinutes: z.coerce.number().int().min(1, "O tempo precisa ser ao menos 1 minuto.").max(600),
  xpReward: z.coerce.number().int().min(0).max(10000),
});

export async function saveLesson(
  moduleId: number,
  lessonId: number | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = LessonSchema.safeParse({
    title: formData.get("title"),
    objective: formData.get("objective") ?? undefined,
    description: formData.get("description") ?? undefined,
    estimatedMinutes: formData.get("estimatedMinutes") ?? 10,
    xpReward: formData.get("xpReward") ?? 50,
  });
  const issue = firstIssue(parsed);
  if (issue || !parsed.success) return fail(issue ?? "Dados invalidos.");

  const supabase = await createSupabaseServerClient();
  const values = {
    title: parsed.data.title,
    objective: parsed.data.objective || null,
    description: parsed.data.description || null,
    estimated_minutes: parsed.data.estimatedMinutes,
    xp_reward: parsed.data.xpReward,
  };

  if (lessonId) {
    const { error } = await supabase.from("lessons").update(values).eq("id", lessonId);
    if (error) return fail(error.message);
  } else {
    const { error } = await supabase
      .from("lessons")
      .insert({ ...values, module_id: moduleId, position: await nextPosition("lessons", "module_id", moduleId) });
    if (error) return fail(error.message);
  }
  refreshAll(`/admin/modules/${moduleId}`);
  return ok;
}

export async function setLessonStatus(lessonId: number, publish: boolean): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lessons")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", lessonId);
  if (error) return fail(error.message);
  refreshAll();
  return ok;
}

export async function deleteLesson(lessonId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
  if (error) return fail(error.message);
  refreshAll();
  return ok;
}

/* ============================== blocos ============================== */

export async function createBlock(lessonId: number, blockType: string, title: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lesson_blocks").insert({
    lesson_id: lessonId,
    block_type: blockType,
    title: title.trim() || null,
    content: defaultContentFor(blockType),
    position: await nextPosition("lesson_blocks", "lesson_id", lessonId),
  });
  if (error) return fail(error.message);
  refreshAll(`/admin/lessons/${lessonId}`);
  return ok;
}

export async function updateBlock(
  blockId: number,
  lessonId: number,
  title: string,
  content: unknown,
  mediaId: number | null,
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("lesson_blocks")
    .update({ title: title.trim() || null, content: content as never, media_id: mediaId })
    .eq("id", blockId);
  if (error) return fail(error.message);
  refreshAll(`/admin/lessons/${lessonId}`);
  return ok;
}

export async function deleteBlock(blockId: number, lessonId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("lesson_blocks").delete().eq("id", blockId);
  if (error) return fail(error.message);
  refreshAll(`/admin/lessons/${lessonId}`);
  return ok;
}

/* ============================== exercicios ============================== */

const ExerciseSchema = z.object({
  exerciseType: z.enum(EXERCISE_TYPES),
  question: z.string().trim().min(2, "Informe o enunciado."),
  instruction: z.string().trim().optional(),
  explanation: z.string().trim().optional(),
  difficulty: z.coerce.number().int().min(1).max(5),
  xpReward: z.coerce.number().int().min(0).max(1000),
});

export async function saveExercise(
  blockId: number,
  lessonId: number,
  exerciseId: number | null,
  formData: FormData,
): Promise<ActionResult> {
  await requireAdmin();
  const parsed = ExerciseSchema.safeParse({
    exerciseType: formData.get("exerciseType"),
    question: formData.get("question"),
    instruction: formData.get("instruction") ?? undefined,
    explanation: formData.get("explanation") ?? undefined,
    difficulty: formData.get("difficulty") ?? 1,
    xpReward: formData.get("xpReward") ?? 10,
  });
  const issue = firstIssue(parsed);
  if (issue || !parsed.success) return fail(issue ?? "Dados invalidos.");

  const { exerciseType } = parsed.data;
  const options = formData.getAll("option").map(String).map((s) => s.trim()).filter(Boolean);
  const correctIndex = Number(formData.get("correctOption") ?? -1);
  const mediaRaw = formData.get("mediaId");
  const mediaId = mediaRaw && String(mediaRaw) !== "" ? Number(mediaRaw) : null;

  const shape = buildAnswerShape(exerciseType, formData, options, correctIndex);
  if (shape.error) return fail(shape.error);

  const supabase = await createSupabaseServerClient();
  const values = {
    exercise_type: exerciseType,
    question: parsed.data.question,
    instruction: parsed.data.instruction || null,
    explanation: parsed.data.explanation || null,
    difficulty: parsed.data.difficulty,
    xp_reward: parsed.data.xpReward,
    prompt: shape.prompt as never,
    answer_key: shape.answerKey as never,
    media_id: mediaId,
  };

  let id = exerciseId;
  if (id) {
    const { error } = await supabase.from("exercises").update(values).eq("id", id);
    if (error) return fail(error.message);
  } else {
    const { data, error } = await supabase
      .from("exercises")
      .insert({
        ...values,
        lesson_block_id: blockId,
        position: await nextPosition("exercises", "lesson_block_id", blockId),
      })
      .select("id")
      .single();
    if (error) return fail(error.message);
    id = data.id;
  }

  // opcoes sao substituidas por inteiro: manter as antigas correria o risco de
  // sobrar uma alternativa correta orfa de uma versao anterior do exercicio
  if (usesOptions(exerciseType)) {
    if (options.length < 2) return fail("Informe ao menos duas alternativas.");
    if (!(correctIndex >= 0 && correctIndex < options.length)) return fail("Marque a alternativa correta.");
    await supabase.from("exercise_options").delete().eq("exercise_id", id);
    const { error } = await supabase.from("exercise_options").insert(
      options.map((text, i) => ({
        exercise_id: id,
        text,
        is_correct: i === correctIndex,
        position: i + 1,
      })),
    );
    if (error) return fail(error.message);
  } else {
    await supabase.from("exercise_options").delete().eq("exercise_id", id);
  }

  refreshAll(`/admin/lessons/${lessonId}`);
  return ok;
}

export async function deleteExercise(exerciseId: number, lessonId: number): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("exercises").delete().eq("id", exerciseId);
  if (error) return fail(error.message);
  refreshAll(`/admin/lessons/${lessonId}`);
  return ok;
}

/* ============================== midia ============================== */

/** Limite de upload, configuravel por ambiente (spec 49). */
export async function getMediaLimits(): Promise<{ maxBytes: number; accept: string[] }> {
  const configured = Number(process.env.MEDIA_MAX_MB ?? "");
  const maxMb = Number.isFinite(configured) && configured > 0 ? configured : 25;
  return {
    maxBytes: maxMb * 1024 * 1024,
    accept: ["audio/mpeg", "audio/mp4", "audio/x-m4a", "audio/wav", "image/png", "image/jpeg", "image/webp"],
  };
}

/**
 * Registra na tabela um arquivo que ja foi enviado ao Storage.
 *
 * O upload em si acontece no navegador, direto para o Supabase, para o arquivo
 * nao trafegar duas vezes nem esbarrar no limite de corpo de uma server action.
 * A policy de insert do bucket exige admin, entao o caminho continua protegido.
 */
export async function registerMedia(values: {
  kind: "audio" | "image";
  title: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  transcript: string;
}): Promise<ActionResult> {
  const { user } = await requireAdmin();
  const title = values.title.trim();
  if (title.length < 2) return fail("Informe um titulo para o arquivo.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from("media").insert({
    kind: values.kind,
    title,
    storage_path: values.storagePath,
    mime_type: values.mimeType,
    size_bytes: values.sizeBytes,
    duration_seconds: values.durationSeconds,
    transcript: values.transcript.trim() || null,
    created_by: user.id,
  });
  if (error) return fail(error.message);
  refreshAll("/admin/media");
  return ok;
}

export async function updateMedia(mediaId: number, formData: FormData): Promise<ActionResult> {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  if (title.length < 2) return fail("Informe um titulo.");

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase
    .from("media")
    .update({ title, transcript: String(formData.get("transcript") ?? "").trim() || null })
    .eq("id", mediaId);
  if (error) return fail(error.message);
  refreshAll("/admin/media");
  return ok;
}

export async function deleteMedia(mediaId: number, storagePath: string): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  // apaga o arquivo antes da linha: se a ordem fosse inversa e o storage
  // falhasse, sobraria um arquivo orfao que ninguem mais consegue localizar
  const { error: storageError } = await supabase.storage.from("lesson-media").remove([storagePath]);
  if (storageError) return fail(`Nao consegui remover o arquivo: ${storageError.message}`);

  const { error } = await supabase.from("media").delete().eq("id", mediaId);
  if (error) return fail(error.message);
  refreshAll("/admin/media");
  return ok;
}

/* ============================== ordenacao ============================== */

/**
 * Troca a posicao de um item com o vizinho.
 *
 * A spec pede drag and drop. Setas sobem e descem funcionam por teclado e sem
 * biblioteca, o que atende melhor o requisito de acessibilidade da spec 58;
 * arrastar pode ser somado depois sem mudar o modelo de dados.
 */
export async function moveItem(
  table: "modules" | "lessons" | "lesson_blocks" | "exercises",
  parentColumn: string,
  parentId: number,
  itemId: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  await requireAdmin();
  const supabase = await createSupabaseServerClient();

  const { data: rows } = await supabase
    .from(table)
    .select("id,position")
    .eq(parentColumn, parentId)
    .order("position")
    .order("id");
  if (!rows) return fail("Nao consegui ler a ordem atual.");

  const index = rows.findIndex((r) => r.id === itemId);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= rows.length) return ok;

  // reescreve a sequencia inteira: posicoes duplicadas ou com buracos vindas de
  // insercoes antigas se resolvem sozinhas aqui
  const reordered = [...rows];
  [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

  for (const [i, row] of reordered.entries()) {
    await supabase.from(table).update({ position: i + 1 }).eq("id", row.id);
  }

  refreshAll();
  return ok;
}

/* ============================== auxiliares ============================== */

async function nextPosition(table: string, parentColumn: string, parentId: number): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from(table)
    .select("position")
    .eq(parentColumn, parentId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data?.position ?? 0) + 1;
}

/** Hash estavel: a ordem embaralhada nao muda entre salvamentos do mesmo conteudo. */
function hash(text: string): number {
  let value = 0;
  for (let i = 0; i < text.length; i++) value = (value * 31 + text.charCodeAt(i)) % 100000;
  return value;
}

function usesOptions(type: string): boolean {
  return ["MULTIPLE_CHOICE", "READING_QUESTION", "LISTENING_MULTIPLE_CHOICE", "CHOICE_INLINE"].includes(type);
}

function defaultContentFor(blockType: string): Record<string, unknown> {
  switch (blockType) {
    case "CONTENT":
    case "GRAMMAR":
      return { paragraphs: [] };
    case "VOCABULARY":
      return { items: [] };
    case "READING":
      return { text: "", vocabulary: [] };
    case "LISTENING":
      return { instructions: "" };
    default:
      return {};
  }
}

/** Monta prompt e answer_key conforme o tipo, espelhando lib/exercises/registry.ts. */
function buildAnswerShape(
  type: string,
  formData: FormData,
  options: string[],
  correctIndex: number,
): { prompt: Record<string, unknown>; answerKey: Record<string, unknown>; error?: string } {
  const empty = { prompt: {}, answerKey: {} };

  if (usesOptions(type)) {
    if (options.length < 2) return { ...empty, error: "Informe ao menos duas alternativas." };
    if (!(correctIndex >= 0 && correctIndex < options.length)) {
      return { ...empty, error: "Marque a alternativa correta." };
    }
    return empty;
  }

  switch (type) {
    case "TRUE_FALSE":
      return { prompt: {}, answerKey: { value: String(formData.get("trueFalse")) === "true" } };

    case "FILL_BLANK":
    case "LISTENING_FILL_BLANK":
    case "FORM_FILL": {
      const template = String(formData.get("template") ?? "").trim();
      const accepted = String(formData.get("accepted") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (!template.includes("{{0}}")) {
        return { ...empty, error: "O texto precisa conter {{0}} para marcar a lacuna." };
      }
      if (accepted.length === 0) return { ...empty, error: "Informe ao menos uma resposta aceita." };
      return { prompt: { template }, answerKey: { blanks: [{ accepted }] } };
    }

    case "SHORT_ANSWER":
    case "CORRECT_SENTENCE": {
      const accepted = String(formData.get("accepted") ?? "")
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (accepted.length === 0) return { ...empty, error: "Informe ao menos uma resposta aceita." };
      return { prompt: {}, answerKey: { accepted } };
    }

    case "ORDER_WORDS":
    case "ORDER_SENTENCES": {
      const order = String(formData.get("order") ?? "")
        .split(/\s*\|\s*|\s+/)
        .map((s) => s.trim())
        .filter(Boolean);
      if (order.length < 2) return { ...empty, error: "Informe ao menos duas palavras na ordem correta." };
      return { prompt: { tokens: order }, answerKey: { order } };
    }

    case "MATCHING":
    case "CATEGORY_SORT": {
      const left = String(formData.get("left") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      const right = String(formData.get("right") ?? "").split("\n").map((s) => s.trim()).filter(Boolean);
      if (left.length < 2 || left.length !== right.length) {
        return { ...empty, error: "As duas colunas precisam ter a mesma quantidade, com ao menos dois pares." };
      }

      // O admin digita os pares alinhados linha a linha, mas guardar assim
      // deixaria a coluna da direita na mesma ordem da esquerda e o exercicio
      // se resolveria sozinho. Embaralhamos a direita aqui e gravamos os pares
      // ja apontando para as novas posicoes.
      const shuffled = right
        .map((text, originalIndex) => ({ text, originalIndex }))
        .sort((a, b) => hash(a.text) - hash(b.text));
      const newIndexOf = new Map(shuffled.map((item, index) => [item.originalIndex, index]));

      return {
        prompt: { left, right: shuffled.map((item) => item.text) },
        answerKey: { pairs: left.map((_, i) => [i, newIndexOf.get(i) ?? i]) },
      };
    }

    default:
      return empty;
  }
}
