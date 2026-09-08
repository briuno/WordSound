import type { Metadata } from "next";

import { signOut } from "@/app/(auth)/actions";
import { Button, Card } from "@/components/ui";
import { getUserStats } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatMinutes } from "@/lib/utils";

export const metadata: Metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const [{ data: auth }, stats] = await Promise.all([supabase.auth.getUser(), getUserStats()]);

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name,avatar_url,role,created_at")
    .maybeSingle();

  const { data: achievements } = await supabase
    .from("achievements")
    .select("code,title,description")
    .order("position");
  const { data: earned } = await supabase.from("user_achievements").select("achievement_code");
  const earnedSet = new Set(earned?.map((e) => e.achievement_code) ?? []);

  const name = profile?.full_name ?? auth.user?.email?.split("@")[0] ?? "Aluno";
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Perfil</h1>

      <Card className="flex items-center gap-4">
        <span className="gradient-flow grid size-16 shrink-0 place-items-center rounded-full text-2xl font-extrabold text-white">
          {initial}
        </span>
        <div className="min-w-0">
          <p className="truncate text-lg font-bold">{name}</p>
          <p className="truncate text-sm text-text-muted">{auth.user?.email}</p>
          {profile?.role === "admin" ? (
            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-brand">Administrador</p>
          ) : null}
        </div>
      </Card>

      <dl className="grid grid-cols-3 gap-3">
        {[
          { label: "XP total", value: String(stats.xpTotal) },
          { label: "Sequencia", value: `${stats.currentStreak}d` },
          { label: "Tempo", value: formatMinutes(stats.totalStudyMinutes) },
        ].map((item) => (
          <Card key={item.label} className="p-4 text-center">
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{item.label}</dt>
            <dd className="mt-0.5 text-xl font-extrabold tabular-nums">{item.value}</dd>
          </Card>
        ))}
      </dl>

      <section aria-labelledby="conquistas">
        <h2 id="conquistas" className="mb-3 text-sm font-bold uppercase tracking-wide text-text-muted">
          Conquistas
        </h2>
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {(achievements ?? []).map((a) => {
            const has = earnedSet.has(a.code);
            return (
              <li
                key={a.code}
                className={`rounded-xl border p-3.5 ${
                  has ? "border-brand/40 bg-brand/6" : "border-[var(--border)] bg-surface opacity-60"
                }`}
              >
                <p className="font-semibold">{a.title}</p>
                <p className="text-sm text-text-muted">{a.description}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <form action={signOut}>
        <Button type="submit" variant="secondary" size="lg" className="w-full">
          Sair
        </Button>
      </form>
    </div>
  );
}
