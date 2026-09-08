import "server-only";

import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Guarda do painel administrativo.
 *
 * O papel vem do banco, nunca do JWT: promover ou rebaixar alguem tem efeito
 * imediato, sem esperar o token expirar. As policies do Postgres ja barram
 * escrita indevida de qualquer forma; esta checagem existe para nao renderizar
 * uma tela que o usuario nao poderia usar.
 */
export async function requireAdmin() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") redirect("/app");
  return { user, profile };
}

export interface AdminCounts {
  students: number;
  courses: number;
  modules: number;
  lessons: number;
  exercises: number;
  media: number;
  attempts: number;
}

export async function getAdminCounts(): Promise<AdminCounts> {
  const supabase = await createSupabaseServerClient();

  const count = async (table: string, filter?: (q: ReturnType<typeof supabase.from>) => unknown) => {
    let query = supabase.from(table).select("*", { count: "exact", head: true });
    if (filter) query = filter(query as never) as typeof query;
    const { count: n } = await query;
    return n ?? 0;
  };

  const [students, courses, modules, lessons, exercises, media, attempts] = await Promise.all([
    count("profiles"),
    count("courses"),
    count("modules"),
    count("lessons"),
    count("exercises"),
    count("media"),
    count("user_exercise_attempts"),
  ]);

  return { students, courses, modules, lessons, exercises, media, attempts };
}

export interface RecentActivity {
  id: number;
  lessonTitle: string;
  isCorrect: boolean;
  createdAt: string;
}

export async function getRecentActivity(limit = 8): Promise<RecentActivity[]> {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("user_exercise_attempts")
    .select("id,is_correct,created_at,lessons(title)")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const lesson = row.lessons as unknown as { title: string } | { title: string }[] | null;
    const title = Array.isArray(lesson) ? (lesson[0]?.title ?? "") : (lesson?.title ?? "");
    return {
      id: row.id,
      lessonTitle: title || "(licao removida)",
      isCorrect: row.is_correct,
      createdAt: row.created_at,
    };
  });
}
