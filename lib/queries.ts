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

export interface CourseUnit {
  id: number;
  title: string;
  position: number;
  total: number;
  completed: number;
  isCurrent: boolean;
}

export interface LearningPath {
  course: { id: number; title: string; description: string | null; level: string | null };
  module: { id: number; title: string; description: string | null };
  lessons: LessonNode[];
  completedCount: number;
  totalCount: number;
  currentLesson: LessonNode | null;
  /** Todas as unidades publicadas, para o aluno ver o curso inteiro. */
  units: CourseUnit[];
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // O filtro por user_id e explicito de proposito. Confiar so no RLS quebra
  // para quem e admin: a policy deixa o admin ver as linhas de todo mundo, e
  // maybeSingle() com varias linhas devolve erro, zerando o XP na propria Home.
  const { data } = user
    ? await supabase
        .from("user_stats")
        .select("xp_total,current_streak,best_streak,total_study_minutes,last_study_date")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  return {
    xpTotal: data?.xp_total ?? 0,
    currentStreak: data?.current_streak ?? 0,
    bestStreak: data?.best_streak ?? 0,
    totalStudyMinutes: data?.total_study_minutes ?? 0,
    lastStudyDate: data?.last_study_date ?? null,
  };
}

/**
 * Trilha do aluno.
 *
 * Le TODAS as unidades publicadas, nao so a primeira. Enquanto existia uma
 * unica unidade dava para carregar so ela, mas assim que a segunda foi
 * publicada esse atalho deixaria o aluno preso: ele terminaria a Unit 1 e a
 * Home continuaria mostrando a mesma unidade, sem caminho adiante.
 *
 * Sem argumento, devolve a unidade atual, que e a primeira ainda nao
 * concluida. Com `moduleId`, devolve aquela unidade especifica.
 */
export async function getLearningPath(moduleId?: number): Promise<LearningPath | null> {
  const supabase = await createSupabaseServerClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id,title,description,level")
    .eq("status", "published")
    .order("position")
    .limit(1)
    .maybeSingle();
  if (!course) return null;

  const { data: modules } = await supabase
    .from("modules")
    .select("id,title,description,position")
    .eq("course_id", course.id)
    .eq("status", "published")
    .order("position");
  if (!modules?.length) return null;

  const { data: lessons } = await supabase
    .from("lessons")
    .select("id,module_id,title,description,objective,estimated_minutes,xp_reward,position")
    .in("module_id", modules.map((m) => m.id))
    .eq("status", "published")
    .order("position");

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // mesmo motivo do getUserStats: sem este filtro, um admin veria o progresso
  // de todos os alunos misturado na propria trilha
  const { data: progress } = await supabase
    .from("user_progress")
    .select("lesson_id,status,progress_percent,accuracy")
    .eq("user_id", user?.id ?? "");

  const byLesson = new Map(progress?.map((p) => [p.lesson_id, p]) ?? []);
  const isDone = (lessonId: number) => byLesson.get(lessonId)?.status === "completed";

  const lessonsOf = (id: number) => (lessons ?? []).filter((l) => l.module_id === id);

  const units = modules.map((m) => {
    const own = lessonsOf(m.id);
    return {
      id: m.id,
      title: m.title,
      position: m.position,
      total: own.length,
      completed: own.filter((l) => isDone(l.id)).length,
    };
  });

  // unidade atual: a primeira com licao pendente; se tudo acabou, a ultima
  const current =
    (moduleId ? units.find((u) => u.id === moduleId) : undefined) ??
    units.find((u) => u.total === 0 || u.completed < u.total) ??
    units[units.length - 1];

  const mod = modules.find((m) => m.id === current.id)!;

  // a licao 1 de uma unidade so abre quando a unidade anterior termina, senao
  // o aluno pularia da Unit 1 direto para o meio do curso
  const index = units.findIndex((u) => u.id === current.id);
  const previousUnitDone =
    index <= 0 || units.slice(0, index).every((u) => u.total > 0 && u.completed === u.total);

  const nodes: LessonNode[] = [];
  let previousCompleted = previousUnitDone;
  for (const l of lessonsOf(mod.id)) {
    const saved = byLesson.get(l.id);
    const status = resolveStatus(l.position === 1 && !previousUnitDone ? 0 : l.position, saved, previousCompleted);
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
    units: units.map((u) => ({ ...u, isCurrent: u.id === current.id })),
  };
}

/**
 * Uma unidade com suas licoes (spec 3). Reaproveita getLearningPath para nao
 * duplicar a regra de desbloqueio: ela tem que ser identica na Home e aqui,
 * senao as duas telas discordam sobre o que esta liberado.
 */
export async function getModuleDetail(moduleId: number): Promise<
  | (LearningPath & {
      objectives: string[];
      totalMinutes: number;
      accuracy: number | null;
    })
  | null
> {
  const path = await getLearningPath(moduleId);
  if (!path || path.module.id !== moduleId) return null;

  const completed = path.lessons.filter((l) => l.status === "completed" && l.accuracy !== null);
  const accuracy =
    completed.length === 0
      ? null
      : Math.round(completed.reduce((sum, l) => sum + (l.accuracy ?? 0), 0) / completed.length);

  return {
    ...path,
    objectives: path.lessons.map((l) => l.objective).filter((o): o is string => Boolean(o)),
    totalMinutes: path.lessons.reduce((sum, l) => sum + l.estimatedMinutes, 0),
    accuracy,
  };
}

export interface LessonBlock {
  id: number;
  type: string;
  title: string | null;
  content: Record<string, unknown>;
  mediaId: number | null;
  position: number;
  exercises: StudentExercise[];
}

/**
 * Audio como o aluno recebe.
 *
 * Sem `transcript`: a transcricao contem literalmente a resposta dos
 * exercicios de lacuna. Ela e liberada depois, pela action revealTranscript.
 * A url e assinada e expira; o bucket e privado.
 */
export interface StudentMedia {
  id: number;
  title: string;
  url: string;
  durationSeconds: number | null;
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
  media: Record<number, StudentMedia>;
  totalExercises: number;
}

const SIGNED_URL_TTL_SECONDS = 60 * 60;

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
    .select("id,block_type,title,content,media_id,position")
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
    mediaId: b.media_id,
    position: b.position,
    exercises: byBlock.get(b.id) ?? [],
  }));

  const mediaIds = [
    ...new Set(
      [
        ...mapped.map((b) => b.mediaId),
        ...(exerciseRows ?? []).map((r) => r.media_id),
      ].filter((id): id is number => typeof id === "number"),
    ),
  ];

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
    media: await loadStudentMedia(mediaIds),
    totalExercises: mapped.reduce((n, b) => n + b.exercises.length, 0),
  };
}

/** Busca os audios e assina uma URL temporaria para cada um. */
async function loadStudentMedia(ids: number[]): Promise<Record<number, StudentMedia>> {
  if (ids.length === 0) return {};

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("media")
    .select("id,title,storage_path,duration_seconds")
    .in("id", ids);
  if (!rows?.length) return {};

  const { data: signed } = await supabase.storage
    .from("lesson-media")
    .createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_TTL_SECONDS);

  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const out: Record<number, StudentMedia> = {};
  for (const row of rows) {
    const url = urlByPath.get(row.storage_path);
    if (!url) continue; // sem url assinada nao adianta mandar o registro
    out[row.id] = {
      id: row.id,
      title: row.title,
      url,
      durationSeconds: row.duration_seconds,
    };
  }
  return out;
}

/** Exercicio completo, com gabarito. So para uso do corretor no servidor. */
export async function getServerExercise(exerciseId: number): Promise<ServerExercise | null> {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.from("exercises").select(EXERCISE_COLUMNS).eq("id", exerciseId).maybeSingle();
  return data ? toServerExercise(data) : null;
}

/** Descobre se o aluno pode abrir a licao, aplicando a mesma regra da trilha. */
export async function canAccessLesson(lessonId: number): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  // Carrega a trilha DA UNIDADE da licao, nao a unidade atual do aluno.
  // getLearningPath() sem argumento devolve a unidade em andamento; usar isso
  // aqui negaria acesso a qualquer licao ja concluida de uma unidade anterior,
  // impedindo o aluno de revisitar o que ja estudou.
  const { data: lesson } = await supabase
    .from("lessons")
    .select("module_id")
    .eq("id", lessonId)
    .maybeSingle();
  if (!lesson) return false;

  const path = await getLearningPath(lesson.module_id);
  const node = path?.lessons.find((l) => l.id === lessonId);
  return Boolean(node && node.status !== "locked");
}
