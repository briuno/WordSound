import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { startLesson } from "@/app/(app)/actions";
import { LessonPlayer } from "@/components/lesson-player";
import { canAccessLesson, getLessonForStudent } from "@/lib/queries";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  const lesson = await getLessonForStudent(Number(id));
  return { title: lesson?.title ?? "Licao" };
}

export default async function LessonPage({ params }: Params) {
  const { id } = await params;
  const lessonId = Number(id);
  if (!Number.isInteger(lessonId) || lessonId <= 0) notFound();

  // a regra de desbloqueio e reavaliada no servidor: navegar direto pela URL
  // nao pula licao
  if (!(await canAccessLesson(lessonId))) redirect("/app");

  const lesson = await getLessonForStudent(lessonId);
  if (!lesson) notFound();

  await startLesson(lessonId);

  return <LessonPlayer lesson={lesson} />;
}
