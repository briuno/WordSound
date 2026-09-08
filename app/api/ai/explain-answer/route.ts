import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { AIProviderError, getAIProvider, isAIConfigured } from "@/lib/ai";
import { gradeAnswer } from "@/lib/exercises/registry";
import { describeAnswer } from "@/lib/exercises/describe";
import { getServerExercise } from "@/lib/queries";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/explain-answer  (spec 26)
 *
 * Desvio deliberado da spec: o corpo recebe apenas exercise_id e a resposta do
 * aluno. `question`, `correct_answer` e `lesson_context` sao lidos do banco, e
 * nao aceitos do cliente. Confiar no `correct_answer` enviado pelo navegador
 * deixaria qualquer um mandar texto arbitrario para dentro do prompt.
 *
 * A saida tambem omite `retry_correct_answer`: ela fica gravada em
 * ai_insights e so e usada na correcao, senao a pergunta de reforco ja
 * chegaria respondida (spec 25).
 */

const BodySchema = z.object({
  exercise_id: z.number().int().positive(),
  student_answer: z.unknown(),
});

function error(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(request: NextRequest) {
  if (!isAIConfigured()) {
    return error("WordSound Insight ainda nao esta configurado neste ambiente.", 503);
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return error("Sessao expirada.", 401);

  let body: z.infer<typeof BodySchema>;
  try {
    body = BodySchema.parse(await request.json());
  } catch {
    return error("Corpo invalido.", 400);
  }

  const exercise = await getServerExercise(body.exercise_id);
  if (!exercise) return error("Exercicio nao encontrado.", 404);

  // so faz sentido explicar o que o aluno de fato errou
  const { data: attempt } = await supabase
    .from("user_exercise_attempts")
    .select("id,is_correct")
    .eq("exercise_id", body.exercise_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!attempt) return error("Responda o exercicio antes de pedir a explicacao.", 409);
  if (attempt.is_correct) return error("Voce acertou este exercicio.", 409);

  const graded = gradeAnswer(exercise.type, {
    answer: body.student_answer,
    answerKey: exercise.answerKey,
    options: exercise.options,
    prompt: exercise.prompt,
  });

  const admin = createSupabaseAdminClient();
  const { data: lessonRow } = await admin
    .from("lesson_blocks")
    .select("lessons(title,modules(title))")
    .eq("id", exercise.lessonBlockId)
    .maybeSingle();

  const lesson = lessonRow?.lessons as unknown as
    | { title: string; modules: { title: string } | { title: string }[] }
    | null;
  const moduleTitle = Array.isArray(lesson?.modules) ? lesson?.modules[0]?.title : lesson?.modules?.title;
  const lessonContext = [moduleTitle, lesson?.title].filter(Boolean).join(" · ") || "English Basics";

  const provider = getAIProvider();
  let insight;
  try {
    insight = await provider.explainAnswer({
      question: exercise.question,
      instruction: exercise.instruction,
      studentAnswer: describeAnswer(exercise, body.student_answer),
      correctAnswer: graded.correctAnswer,
      officialExplanation: exercise.explanation,
      lessonContext,
      exerciseType: exercise.type,
    });
  } catch (e) {
    const message = e instanceof AIProviderError ? e.message : "Nao consegui gerar a explicacao agora.";
    return error(message, 502);
  }

  const hasRetry = insight.retry_options.length === 3 && insight.retry_correct_index >= 0;

  const { data: saved } = await admin
    .from("ai_insights")
    .insert({
      user_id: user.id,
      exercise_id: exercise.id,
      student_answer: (body.student_answer ?? null) as never,
      explanation: insight.explanation,
      rule: insight.rule,
      example: insight.example,
      retry_question: hasRetry ? insight.retry_question : null,
      retry_options: hasRetry ? insight.retry_options : [],
      retry_correct_index: hasRetry ? insight.retry_correct_index : null,
      provider: provider.name,
      model: provider.model,
    })
    .select("id")
    .single();

  return NextResponse.json({
    insight_id: saved?.id ?? null,
    explanation: insight.explanation,
    rule: insight.rule,
    example: insight.example,
    retry_question: hasRetry ? insight.retry_question : null,
    retry_options: hasRetry ? insight.retry_options : [],
    // retry_correct_answer fica no servidor de proposito
  });
}
