import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CirclePlus, Scale, Utensils } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ReadingList } from "@/components/reading-list";
import { ReferenceRanges } from "@/components/reference-ranges";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

const ATALHOS = [
  { tipo: "refeicao", label: "Refeição", icon: Utensils },
  { tipo: "atividade", label: "Atividade", icon: Activity },
  { tipo: "peso", label: "Peso", icon: Scale },
] as const;

export default async function InicioPage() {
  const supabase = await createClient();
  const [{ data: profile }, faixas, { readings }] = await Promise.all([
    supabase.from("profiles").select("nome").maybeSingle(),
    getFaixasUsuario(supabase),
    listReadings(supabase, { limit: 5 }),
  ]);
  const firstName = profile?.nome?.split(" ")[0];

  return (
    <>
      <PageHeader
        title={firstName ? `Olá, ${firstName}!` : "Olá!"}
        subtitle="Acompanhe sua glicemia no dia a dia."
      />

      <Link
        href="/registrar"
        className={cn(buttonVariants(), "h-14 w-full gap-2 text-lg sm:w-auto sm:px-8")}
      >
        <CirclePlus className="size-6" aria-hidden />
        Registrar glicemia
      </Link>

      <div className="mt-3 grid grid-cols-3 gap-2 sm:flex">
        {ATALHOS.map(({ tipo, label, icon: Icon }) => (
          <Link
            key={tipo}
            href={`/registrar?tipo=${tipo}`}
            className={cn(
              buttonVariants({ variant: "outline" }),
              "h-auto min-h-14 flex-col gap-1 py-2 text-sm sm:h-12 sm:flex-row sm:gap-2 sm:px-4 sm:text-base",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-semibold">Últimas medições</h2>
          {readings.length > 0 && (
            <Link href="/historico" className="text-base text-primary underline-offset-4 hover:underline">
              Ver todas
            </Link>
          )}
        </div>
        {readings.length > 0 ? (
          <ReadingList readings={readings} faixas={faixas} />
        ) : (
          <p className="rounded-xl border border-dashed p-6 text-base text-muted-foreground">
            Você ainda não registrou nenhuma medição. Toque em “Registrar glicemia” para começar.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-lg font-semibold">Como ler seus valores</h2>
        <p className="mb-3 text-base text-muted-foreground">
          O que é considerado normal depende do momento da medição.
        </p>
        <ReferenceRanges faixas={faixas} />
      </section>
    </>
  );
}
