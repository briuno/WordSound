"use server";

import { revalidatePath } from "next/cache";

import { gradeAnswer } from "@/lib/exercises/registry";
import { canAccessLesson, getServerExercise } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AnswerFeedback {
  isCorrect: boolean;
  correctAnswer: string;
  explanation: string | null;
  xpEarned: number;
  attemptNumber: number;
  error?: string;
}

interface XpSettings {
  correct_first_try: number;
  correct_retry: number;
  lesson_complete: number;
  module_review: number;
}

const XP_FALLBACK: XpSettings = {
  correct_first_try: 10,
  correct_retry: 5,
  lesson_complete: 50,
  module_review: 100,
};

async function getXpSettings(): Promise<XpSettings> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("app_settings").select("value").eq("key", "xp").maybeSingle();
  return { ...XP_FALLBACK, ...((data?.value as Partial<XpSettings> | null) ?? {}) };
}

function fail(message: string): AnswerFeedback {
  return { isCorrect: false, correctAnswer: "", explanation: null, xpEarned: 0, attemptNumber: 0, error: message };
}

/**
 * Corrige uma resposta.
 *
 * Toda a correcao acontece aqui, no servidor. O gabarito e lido com
 * service_role e nunca volta para o navegador antes de o aluno responder.
 * O XP e concedido pelo servidor, entao o cliente nao consegue inflar pontos.
 */
export async function submitAnswer(
  lessonId: number,
  exerciseId: number,
  answer: unknown,
): Promise<AnswerFeedback> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("Sessao expirada. Entre novamente.");

  if (!(await canAccessLesson(lessonId))) return fail("Esta licao ainda esta bloqueada.");

  const exercise = await getServerExercise(exerciseId);
  if (!exercise) return fail("Exercicio nao encontrado.");

  // quantas vezes o aluno ja respondeu este exercicio
  const { count } = await supabase
    .from("user_exercise_attempts")
    .select("id", { count: "exact", head: true })
    .eq("exercise_id", exerciseId);
  const attemptNumber = (count ?? 0) + 1;

  const result = gradeAnswer(exercise.type, {
    answer,
    answerKey: exercise.answerKey,
    options: exercise.options,
    prompt: exercise.prompt,
  });

  const xp = await getXpSettings();
  const base = attemptNumber === 1 ? xp.correct_first_try : xp.correct_retry;
  const xpEarned = result.isCorrect ? Math.round((base * exercise.xpReward) / XP_FALLBACK.correct_first_try) : 0;

  await supabase.from("user_exercise_attempts").insert({
    user_id: user.id,
    exercise_id: exerciseId,
    lesson_id: lessonId,
    answer: answer as never,
    is_correct: result.isCorrect,
    attempt_number: attemptNumber,
    xp_earned: xpEarned,
  });

  if (xpEarned > 0) {
    await supabase.rpc("record_study_activity", { p_xp: xpEarned });
  }

  return {
    isCorrect: result.isCorrect,
    correctAnswer: result.correctAnswer,
    explanation: exercise.explanation,
    xpEarned,
    attemptNumber,
  };
}

export interface LessonSummary {
  accuracy: number;
  correct: number;
  incorrect: number;
  answered: number;
  xpEarned: number;
}

/**
 * Fecha a licao: grava progresso, concede o XP de conclusao e libera a proxima.
 * A precisao e recalculada a partir das tentativas gravadas, nao do que o
 * cliente informa.
 */
export async function completeLesson(lessonId: number): Promise<LessonSummary | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessao expirada. Entre novamente." };

  if (!(await canAccessLesson(lessonId))) return { error: "Esta licao ainda esta bloqueada." };

  const { data: attempts } = await supabase
    .from("user_exercise_attempts")
    .select("exercise_id,is_correct,attempt_number,xp_earned")
    .eq("lesson_id", lessonId)
    .order("attempt_number");

  // uma linha por exercicio: vale a primeira tentativa
  const firstTry = new Map<number, boolean>();
  let xpEarned = 0;
  for (const a of attempts ?? []) {
    if (!firstTry.has(a.exercise_id)) firstTry.set(a.exercise_id, a.is_correct);
    xpEarned += a.xp_earned;
  }
  const answered = firstTry.size;
  const correct = [...firstTry.values()].filter(Boolean).length;
  const incorrect = answered - correct;
  const accuracy = answered === 0 ? 0 : Math.round((correct / answered) * 100);

  const alreadyDone = await supabase
    .from("user_progress")
    .select("status")
    .eq("lesson_id", lessonId)
    .maybeSingle();

  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "completed",
      progress_percent: 100,
      accuracy,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );

  // XP de conclusao so na primeira vez que a licao e fechada
  if (alreadyDone.data?.status !== "completed") {
    const { data: lesson } = await supabase.from("lessons").select("xp_reward").eq("id", lessonId).maybeSingle();
    const bonus = lesson?.xp_reward ?? (await getXpSettings()).lesson_complete;
    await supabase.rpc("record_study_activity", { p_xp: bonus });
    xpEarned += bonus;
  }

  revalidatePath("/app");
  return { accuracy, correct, incorrect, answered, xpEarned };
}

/** Marca a licao como iniciada, para a trilha mostrar 'em andamento'. */
export async function startLesson(lessonId: number): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !(await canAccessLesson(lessonId))) return;

  const { data: existing } = await supabase
    .from("user_progress")
    .select("status")
    .eq("lesson_id", lessonId)
    .maybeSingle();
  if (existing?.status === "completed") return;

  await supabase.from("user_progress").upsert(
    {
      user_id: user.id,
      lesson_id: lessonId,
      status: "in_progress",
      started_at: new Date().toISOString(),
    },
    { onConflict: "user_id,lesson_id" },
  );
}
