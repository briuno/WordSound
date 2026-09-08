"use client";

import { BarChart3, BookOpen, LayoutDashboard, Music, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/courses", label: "Cursos", icon: BookOpen },
  { href: "/admin/media", label: "Midia", icon: Music },
  { href: "/admin/users", label: "Alunos", icon: Users },
  { href: "/admin/reports", label: "Relatorios", icon: BarChart3 },
] as const;

export function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav aria-label="Navegacao do painel" className="flex gap-1 overflow-x-auto md:flex-col md:overflow-visible">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
              active ? "bg-purple/12 text-purple" : "text-text-muted hover:bg-surface-muted hover:text-text",
            )}
          >
            <Icon size={17} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
