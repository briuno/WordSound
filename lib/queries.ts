import "server-only";

import { rowToStudentExercise, toServerExercise } from "@/lib/dto";
import type { ServerExercise, StudentExercise } from "@/lib/exercises/types";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LessonStatus = "locked" | "unlocked" | "in_progress" | "completed";

export interface LessonNode {
  id: number;
  title: string;
  description: string | null;
  objective: string | null;
  estimatedMinutes: number;
  xpReward: number;
  position: number;
  status: LessonStatus;
  progressPercent: number;
  accuracy: number | null;
}

export interface LearningPath {
  course: { id: number; title: string; description: string | null; level: string | null };
  module: { id: number; title: string; description: string | null };
  lessons: LessonNode[];
  completedCount: number;
  totalCount: number;
  currentLesson: LessonNode | null;
}

export interface UserStats {
  xpTotal: number;
  currentStreak: number;
  bestStreak: number;
  totalStudyMinutes: number;
  lastStudyDate: string | null;
}

/**
 * Regra de desbloqueio (spec 13), calculada na leitura.
 *
 * Nao materializamos uma linha 'locked' por licao no cadastro: a licao 1 comeca
 * liberada e cada seguinte abre quando a anterior e concluida. Assim nao existe
 * estado a migrar quando o admin insere ou reordena licoes.
 */
function resolveStatus(
  position: number,
  saved: { status: LessonStatus; progress_percent: number } | undefined,
  previousCompleted: boolean,
): LessonStatus {
  if (saved && saved.status !== "locked") return saved.status;
  if (position === 1 || previousCompleted) return "unlocked";
  return "locked";
}

export async function getUserStats(): Promise<UserStats> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_stats")
    .select("xp_total,current_streak,best_streak,total_study_minutes,last_study_date")
    .maybeSingle();

  return {
    xpTotal: data?.xp_total ?? 0,
    currentStreak: data?.current_streak ?? 0,
    bestStreak: data?.best_streak ?? 0,
    totalStudyMinutes: data?.total_study_minutes ?? 0,
    lastStudyDate: data?.last_study_date ?? null,
  };
}

/** Curso ativo do MVP: o primeiro publicado. */
export async function getLearningPath(): Promise<LearningPath | null> {
  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id,title,description,level")
    .eq("status", "published")
    .order("position")
    .limit(1)
    .maybeSingle();
  if (!course) return null;

  const { data: mod } = await supabase
    .from("modules")
    .select("id,title,description")
    .eq("course_id", course.id)
    .eq("status", "published")
    .order("position")
    .limit(1)
    .maybeSingle();
  if (!mod) return null;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,title,description,objective,estimated_minutes,xp_reward,position")
    .eq("module_id", mod.id)
    .eq("status", "published")
    .order("position");

  const { data: progress } = await supabase
    .from("user_progress")
    .select("lesson_id,status,progress_percent,accuracy");

  const byLesson = new Map(progress?.map((p) => [p.lesson_id, p]) ?? []);

  const nodes: LessonNode[] = [];
  let previousCompleted = false;
  for (const l of lessons ?? []) {
    const saved = byLesson.get(l.id);
    const status = resolveStatus(l.position, saved, previousCompleted);
    nodes.push({
      id: l.id,
      title: l.title,
      description: l.description,
      objective: l.objective,
      estimatedMinutes: l.estimated_minutes,
      xpReward: l.xp_reward,
      position: l.position,
      status,
      progressPercent: saved?.progress_percent ?? 0,
      accuracy: saved?.accuracy ?? null,
    });
    previousCompleted = status === "completed";
  }

  const completedCount = nodes.filter((n) => n.status === "completed").length;

  return {
    course,
    module: mod,
    lessons: nodes,
    completedCount,
    totalCount: nodes.length,
    currentLesson: nodes.find((n) => n.status === "unlocked" || n.status === "in_progress") ?? null,
  };
}

export interface LessonBlock {
  id: number;
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  position: number;
  exercises: StudentExercise[];
}

export interface LessonDetail {
  id: number;
  title: string;
  description: string | null;
  objective: string | null;
  estimatedMinutes: number;
  xpReward: number;
  position: number;
  moduleTitle: string;
  blocks: LessonBlock[];
  totalExercises: number;
}

const EXERCISE_COLUMNS =
  "id,lesson_block_id,exercise_type,instruction,question,explanation,difficulty,xp_reward,position,prompt,answer_key,media_id,exercise_options(id,text,is_correct,position)";

/**
 * Monta a licao para o aluno.
 *
 * O conteudo vem pelo cliente do usuario (RLS vale). Os exercicios vem pelo
 * admin client, porque o aluno nao tem policy de leitura neles, e passam
 * obrigatoriamente por rowToStudentExercise, que remove o gabarito.
 */
export async function getLessonForStudent(lessonId: number): Promise<LessonDetail | null> {
  const supabase = await createSupabaseServerClient();

  const { data: lesson } = await supabase
    .from("lessons")
    .select("id,title,description,objective,estimated_minutes,xp_reward,position,modules(title)")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return null;

  const { data: blocks } = await supabase
    .from("lesson_blocks")
    .select("id,block_type,title,content,position")
    .eq("lesson_id", lessonId)
    .order("position");

  const admin = createSupabaseAdminClient();
  const { data: exerciseRows } = await admin
    .from("exercises")
    .select(EXERCISE_COLUMNS)
    .in("lesson_block_id", (blocks ?? []).map((b) => b.id))
    .order("position");

  const byBlock = new Map<number, StudentExercise[]>();
  for (const row of exerciseRows ?? []) {
    const list = byBlock.get(row.lesson_block_id) ?? [];
    list.push(rowToStudentExercise(row)); // <- gabarito removido aqui
    byBlock.set(row.lesson_block_id, list);
  }

  const moduleTitle =
    (lesson.modules as unknown as { title: string } | { title: string }[] | null) instanceof Array
      ? ((lesson.modules as unknown as { title: string }[])[0]?.title ?? "")
      : ((lesson.modules as unknown as { title: string } | null)?.title ?? "");

  const mapped: LessonBlock[] = (blocks ?? []).map((b) => ({
    id: b.id,
    type: b.block_type,
    title: b.title,
    content: (b.content ?? {}) as Record<string, unknown>,
    position: b.position,
    exercises: byBlock.get(b.id) ?? [],
  }));

  return {
    id: lesson.id,
    title: lesson.title,
    description: lesson.description,
    objective: lesson.objective,
    estimatedMinutes: lesson.estimated_minutes,
    xpReward: lesson.xp_reward,
    position: lesson.position,
    moduleTitle,
    blocks: mapped,
    totalExercises: mapped.reduce((n, b) => n + b.exercises.length, 0),
  };
}

/** Exercicio completo, com gabarito. So para uso do corretor no servidor. */
export async function getServerExercise(exerciseId: number): Promise<ServerExercise | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("exercises").select(EXERCISE_COLUMNS).eq("id", exerciseId).maybeSingle();
  return data ? toServerExercise(data) : null;
}

/** Descobre se o aluno pode abrir a licao, aplicando a mesma regra da trilha. */
export async function canAccessLesson(lessonId: number): Promise<boolean> {
  const path = await getLearningPath();
  const node = path?.lessons.find((l) => l.id === lessonId);
  return Boolean(node && node.status !== "locked");
}
