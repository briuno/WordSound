import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminNav } from "@/components/admin-nav";
import { SoundWave } from "@/components/brand";
import { OfflineBanner } from "@/components/offline-banner";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel WordSound" },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-dvh">
      <header className="pt-safe sticky top-0 z-20 border-b border-[var(--border)] bg-bg/85 backdrop-blur">
        <OfflineBanner />
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-3">
          <Link href="/admin" className="inline-flex items-center gap-2.5 rounded-xl">
            <SoundWave className="h-7 w-auto" />
            <span className="text-lg font-extrabold tracking-tight text-navy dark:text-white">
              WordSound
            </span>
            <span className="rounded-[var(--radius-pill)] bg-purple/12 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-purple">
              Painel
            </span>
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-text-muted sm:inline">{profile?.full_name}</span>
            <Link
              href="/app"
              className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] border border-[var(--border)] px-3 py-1.5 text-sm font-semibold text-text-muted hover:text-text"
            >
              <ArrowLeft size={15} aria-hidden />
              Ver como aluno
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-6 md:flex-row md:gap-8">
        <aside className="md:w-52 md:shrink-0">
          <div className="md:sticky md:top-20">
            <AdminNav />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
