import { Flame, LogOut, Zap } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { signOut } from "@/app/(auth)/actions";
import { Logo } from "@/components/brand";
import { InstallPrompt } from "@/components/install-prompt";
import { MobileNav, SidebarNav } from "@/components/nav";
import { OfflineAudioGuard } from "@/components/offline-audio-guard";
import { OfflineBanner } from "@/components/offline-banner";
import { Badge } from "@/components/ui";
import { getUserStats } from "@/lib/queries";
import { getCurrentUser } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // o middleware ja barra anonimo; esta checagem cobre o caso de sessao
  // invalidada entre o middleware e a renderizacao
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const stats = await getUserStats();

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-20 border-b border-[var(--border)] bg-bg/85 backdrop-blur">
        <OfflineBanner />
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-5 py-3">
          <Link href="/app" className="rounded-xl">
            <Logo />
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <Badge tone="brand" icon={<Zap size={15} aria-hidden />}>
              <span className="sr-only">XP total: </span>
              {stats.xpTotal}
            </Badge>
            <Badge tone="default" icon={<Flame size={15} aria-hidden className="text-error" />}>
              <span className="sr-only">Sequencia: </span>
              {stats.currentStreak}
            </Badge>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sair"
                className="grid size-9 place-items-center rounded-full text-text-muted hover:bg-surface-muted hover:text-text"
              >
                <LogOut size={17} aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* o pb no mobile abre espaco para a barra inferior + a area de gestos */}
      <div className="mx-auto flex max-w-6xl gap-8 px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-6 md:pb-10">
        <aside className="hidden w-48 shrink-0 md:block">
          <div className="sticky top-20">
            <SidebarNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">
          {children}
          <InstallPrompt className="mt-8" />
        </main>
      </div>

      <MobileNav />
      <OfflineAudioGuard userId={user.id} />
    </div>
  );
}
