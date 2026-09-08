"use server";

import { revalidatePath } from "next/cache";

import { gradeAnswer } from "@/lib/exercises/registry";
import { canAccessLesson, getServerExercise } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
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
    .eq("user_id", user.id)
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
  studyMinutes: number;
  newAchievements: { code: string; title: string }[];
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
    .eq("user_id", user.id)
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

  const previous = await supabase
    .from("user_progress")
    .select("status,started_at")
    .eq("user_id", user.id)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  // Tempo medido no servidor, de started_at ate agora. Nao aceitamos duracao
  // vinda do cliente, que seria trivial de inflar. O teto de 120 min fica na
  // funcao do banco, para a aba esquecida aberta nao virar tempo de estudo.
  const startedAt = previous.data?.started_at ? new Date(previous.data.started_at) : null;
  const studyMinutes = startedAt
    ? Math.max(1, Math.round((Date.now() - startedAt.getTime()) / 60000))
    : 1;

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

  // XP e tempo de conclusao so na primeira vez que a licao e fechada
  const firstTime = previous.data?.status !== "completed";
  if (firstTime) {
    const { data: lesson } = await supabase.from("lessons").select("xp_reward").eq("id", lessonId).maybeSingle();
    const bonus = lesson?.xp_reward ?? (await getXpSettings()).lesson_complete;
    await supabase.rpc("record_study_activity", { p_xp: bonus, p_minutes: studyMinutes });
    xpEarned += bonus;
  }

  // Concede tudo que ja foi merecido, nao so o que acabou de ser atingido.
  const { data: earned } = await supabase.rpc("award_achievements");
  const newAchievements = ((earned as { code: string; title: string }[] | null) ?? []).map((a) => ({
    code: a.code,
    title: a.title,
  }));

  revalidatePath("/app");
  revalidatePath("/app/profile");
  return {
    accuracy,
    correct,
    incorrect,
    answered,
    xpEarned,
    studyMinutes: firstTime ? studyMinutes : 0,
    newAchievements,
  };
}

/**
 * Libera a transcricao de um audio (spec 7: "texto oculto ou liberado depois").
 *
 * A transcricao nao viaja no payload da licao porque ela contem, literalmente,
 * a resposta dos exercicios de lacuna daquele audio. So e devolvida depois que
 * o aluno respondeu todos os exercicios ligados a esse audio.
 */
export async function revealTranscript(mediaId: number): Promise<{ transcript?: string; error?: string }> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessao expirada." };

  const admin = createSupabaseAdminClient();
  const { data: bound } = await admin.from("exercises").select("id").eq("media_id", mediaId);
  const boundIds = (bound ?? []).map((e) => e.id);

  if (boundIds.length > 0) {
    const { data: attempts } = await supabase
      .from("user_exercise_attempts")
      .select("exercise_id")
      .eq("user_id", user.id)
      .in("exercise_id", boundIds);
    const answered = new Set((attempts ?? []).map((a) => a.exercise_id));
    if (boundIds.some((id) => !answered.has(id))) {
      return { error: "Responda os exercicios deste audio para liberar a transcricao." };
    }
  }

  const { data: media } = await supabase.from("media").select("transcript").eq("id", mediaId).maybeSingle();
  return { transcript: media?.transcript ?? "" };
}

export interface RetryFeedback {
  isCorrect: boolean;
  correctOption: string;
  error?: string;
}

/**
 * Corrige a pergunta de reforco gerada pelo WordSound Insight.
 *
 * O indice correto vive em ai_insights, sem policy de leitura para aluno, e
 * so e comparado aqui. Nao concede XP de proposito: a pergunta de reforco e
 * pratica formativa, nao vale pontos, para nao virar uma forma de farmar XP
 * errando de proposito.
 */
export async function submitRetryAnswer(insightId: number, optionIndex: number): Promise<RetryFeedback> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { isCorrect: false, correctOption: "", error: "Sessao expirada." };

  const admin = createSupabaseAdminClient();
  const { data: insight } = await admin
    .from("ai_insights")
    .select("id,user_id,retry_options,retry_correct_index")
    .eq("id", insightId)
    .maybeSingle();

  if (!insight || insight.user_id !== user.id) {
    return { isCorrect: false, correctOption: "", error: "Insight nao encontrado." };
  }

  const options = (insight.retry_options as string[] | null) ?? [];
  const correctIndex = insight.retry_correct_index;
  if (correctIndex === null || correctIndex < 0 || correctIndex >= options.length) {
    return { isCorrect: false, correctOption: "", error: "Esta pergunta nao tem gabarito valido." };
  }

  const isCorrect = optionIndex === correctIndex;

  await admin
    .from("ai_insights")
    .update({ retry_answered_at: new Date().toISOString(), retry_was_correct: isCorrect })
    .eq("id", insightId);

  return { isCorrect, correctOption: options[correctIndex] };
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
    .eq("user_id", user.id)
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
