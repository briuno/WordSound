import "server-only";

import { rowToStudentExercise } from "@/lib/dto";
import { EXERCISE_REGISTRY } from "@/lib/exercises/registry";
import type { ExerciseType, StudentExercise } from "@/lib/exercises/types";
import type { StudentMedia } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Area de revisao (spec 37).
 *
 * A fila em si vem da funcao get_review_queue no banco, que devolve os
 * exercicios cuja ultima tentativa foi errada, dos que mais erraram para os
 * que erraram menos. Aqui so buscamos os detalhes e removemos o gabarito,
 * pelo mesmo caminho que a licao usa.
 */

export interface ReviewItem {
  exercise: StudentExercise;
  lessonId: number;
  lessonTitle: string;
  wrongCount: number;
  attemptCount: number;
}

export interface ReviewQueue {
  items: ReviewItem[];
  /** Quantos itens por licao, para o aluno ver onde esta a dificuldade. */
  byLesson: { lessonId: number; title: string; count: number }[];
  /** Quantos por tipo de exercicio: separa listening de vocabulario, spec 37. */
  byType: { type: string; label: string; count: number }[];
}

const EXERCISE_COLUMNS =
  "id,lesson_block_id,exercise_type,instruction,question,explanation,difficulty,xp_reward,position,prompt,answer_key,media_id,exercise_options(id,text,is_correct,position)";

const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function getReviewQueue(limit = 20): Promise<ReviewQueue> {
  const supabase = await createSupabaseServerClient();
  const { data: queue } = await supabase.rpc("get_review_queue");

  const rows = (queue as
    | { exercise_id: number; lesson_id: number; wrong_count: number; attempt_count: number }[]
    | null) ?? [];

  if (rows.length === 0) return { items: [], byLesson: [], byType: [] };

  const admin = createSupabaseAdminClient();
  const [{ data: exercises }, { data: lessons }] = await Promise.all([
    admin.from("exercises").select(EXERCISE_COLUMNS).in("id", rows.map((r) => r.exercise_id)),
    supabase.from("lessons").select("id,title").in("id", [...new Set(rows.map((r) => r.lesson_id))]),
  ]);

  const exerciseById = new Map((exercises ?? []).map((e) => [e.id, e]));
  const lessonTitleById = new Map((lessons ?? []).map((l) => [l.id, l.title]));

  const items: ReviewItem[] = [];
  for (const row of rows) {
    const raw = exerciseById.get(row.exercise_id);
    // um exercicio apagado pelo admin some da fila em vez de quebrar a tela
    if (!raw) continue;
    items.push({
      exercise: rowToStudentExercise(raw), // <- gabarito removido aqui
      lessonId: row.lesson_id,
      lessonTitle: lessonTitleById.get(row.lesson_id) ?? "(licao removida)",
      wrongCount: row.wrong_count,
      attemptCount: row.attempt_count,
    });
  }

  const lessonCounts = new Map<number, number>();
  const typeCounts = new Map<string, number>();
  for (const item of items) {
    lessonCounts.set(item.lessonId, (lessonCounts.get(item.lessonId) ?? 0) + 1);
    typeCounts.set(item.exercise.type, (typeCounts.get(item.exercise.type) ?? 0) + 1);
  }

  return {
    items: items.slice(0, limit),
    byLesson: [...lessonCounts.entries()]
      .map(([lessonId, count]) => ({ lessonId, title: lessonTitleById.get(lessonId) ?? "", count }))
      .sort((a, b) => b.count - a.count),
    byType: [...typeCounts.entries()]
      .map(([type, count]) => ({
        type,
        label: EXERCISE_REGISTRY[type as ExerciseType]?.label ?? type,
        count,
      }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Quantidade pendente, para o aviso na Home sem carregar a fila inteira. */
export async function getReviewCount(): Promise<number> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.rpc("get_review_queue");
  return Array.isArray(data) ? data.length : 0;
}

/** Audios dos exercicios de listening que caem na revisao. */
export async function getReviewMedia(items: ReviewItem[]): Promise<Record<number, StudentMedia>> {
  const ids = [...new Set(items.map((i) => i.exercise.mediaId).filter((id): id is number => typeof id === "number"))];
  if (ids.length === 0) return {};

  const supabase = await createSupabaseServerClient();
  const { data: rows } = await supabase
    .from("media")
    .select("id,kind,title,storage_path,duration_seconds")
    .in("id", ids);
  if (!rows?.length) return {};

  const { data: signed } = await supabase.storage
    .from("lesson-media")
    .createSignedUrls(rows.map((r) => r.storage_path), SIGNED_URL_TTL_SECONDS);
  const urlByPath = new Map((signed ?? []).map((s) => [s.path, s.signedUrl]));

  const out: Record<number, StudentMedia> = {};
  for (const row of rows) {
    const url = urlByPath.get(row.storage_path);
    if (!url) continue;
    out[row.id] = {
      id: row.id,
      kind: row.kind === "image" ? "image" : "audio",
      title: row.title,
      url,
      durationSeconds: row.duration_seconds,
    };
  }
  return out;
}
