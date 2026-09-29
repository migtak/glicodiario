import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { ReadingList } from "@/components/reading-list";
import { ReferenceRanges } from "@/components/reference-ranges";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Início" };

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
