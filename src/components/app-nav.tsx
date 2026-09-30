"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChartLine, CirclePlus, Droplet, House, List, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/inicio", label: "Início", icon: House },
  { href: "/registrar", label: "Registrar", icon: CirclePlus },
  { href: "/historico", label: "Histórico", icon: List },
  { href: "/graficos", label: "Gráficos", icon: ChartLine },
  { href: "/configuracoes", label: "Ajustes", icon: Settings },
] as const;

/** Barra lateral no desktop (md+) e barra inferior fixa no celular. */
export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="hidden md:flex print:!hidden md:w-60 md:shrink-0 md:flex-col md:border-r md:bg-sidebar">
        <div className="flex items-center gap-2 px-5 py-6 text-lg font-semibold text-primary">
          <Droplet className="size-6" aria-hidden />
          GlicoDiário
        </div>
        <nav aria-label="Navegação principal" className="flex flex-col gap-1 px-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-12 items-center gap-3 rounded-lg px-3 text-base font-medium",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden print:!hidden"
      >
        <ul className="grid grid-cols-5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-medium",
                    active ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <Icon className={cn("size-6", active && "stroke-[2.5]")} aria-hidden />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
