"use client";

import { House, RotateCcw, TrendingUp, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/app", label: "Home", icon: House },
  { href: "/app/review", label: "Revisao", icon: RotateCcw },
  { href: "/app/progress", label: "Progresso", icon: TrendingUp },
  { href: "/app/profile", label: "Perfil", icon: User },
] as const;

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
}

/** Navegacao lateral, a partir de md. */
export function SidebarNav() {
  const isActive = useIsActive();
  return (
    <nav aria-label="Navegacao principal" className="space-y-1">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-brand/10 text-brand" : "text-text-muted hover:bg-surface-muted hover:text-text",
            )}
          >
            <Icon size={18} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Barra inferior no mobile (mobile-first, spec 51). */
export function MobileNav() {
  const isActive = useIsActive();
  return (
    <nav
      aria-label="Navegacao principal"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--border)] bg-surface/95 backdrop-blur md:hidden"
    >
      <ul className="flex">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold",
                  active ? "text-brand" : "text-text-muted",
                )}
              >
                <Icon size={20} aria-hidden />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
