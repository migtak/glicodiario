import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { ComingSoon, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

export default function InicioPage() {
  return (
    <>
      <PageHeader title="Olá!" subtitle="Acompanhe sua glicemia no dia a dia." />

      <Link
        href="/registrar"
        className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg sm:w-auto sm:px-8")}
      >
        <CirclePlus className="size-6" aria-hidden />
        Registrar glicemia
      </Link>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Últimas medições</h2>
        <ComingSoon phase={4}>Aqui vão aparecer suas medições mais recentes.</ComingSoon>
      </section>
    </>
  );
}
