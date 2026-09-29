import type { Metadata } from "next";
import Link from "next/link";
import { Activity, Droplet, Scale, Utensils } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { NewReadingForm, type MealOption } from "@/components/reading-form";
import { ActivityForm, MealForm, WeightForm } from "@/components/record-forms";
import { getFaixasUsuario } from "@/lib/data/glucose";
import { mealsBefore } from "@/lib/data/records";
import { toLocalInput } from "@/lib/format";
import { TIPOS_REGISTRO, TIPO_REGISTRO_LABEL, isTipoRegistro, type TipoRegistro } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Registrar" };

const ICONS: Record<TipoRegistro, typeof Droplet> = {
  glicemia: Droplet,
  refeicao: Utensils,
  atividade: Activity,
  peso: Scale,
};

const TITULOS: Record<TipoRegistro, string> = {
  glicemia: "Registrar glicemia",
  refeicao: "Registrar refeição",
  atividade: "Registrar atividade física",
  peso: "Registrar peso",
};

/** Refeição sugerida para vincular: a mais recente das últimas 4 horas. */
const SUGESTAO_REFEICAO_MS = 4 * 3_600_000;

export default async function RegistrarPage({ searchParams }: PageProps<"/registrar">) {
  const { tipo: tipoParam } = await searchParams;
  const tipo: TipoRegistro = isTipoRegistro(tipoParam) ? tipoParam : "glicemia";

  return (
    <>
      <PageHeader title={TITULOS[tipo]} />
      <nav aria-label="Tipo de registro" className="mb-6">
        <ul className="grid grid-cols-4 gap-1 rounded-xl bg-muted p-1">
          {TIPOS_REGISTRO.map((t) => {
            const Icon = ICONS[t];
            const active = t === tipo;
            return (
              <li key={t}>
                <Link
                  href={t === "glicemia" ? "/registrar" : `/registrar?tipo=${t}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-lg text-sm font-medium sm:flex-row sm:gap-2 sm:text-base",
                    active ? "bg-background text-primary shadow-sm" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-5" aria-hidden />
                  {TIPO_REGISTRO_LABEL[t]}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {tipo === "glicemia" && <GlucoseTab />}
      {tipo === "refeicao" && <MealForm />}
      {tipo === "atividade" && <ActivityForm />}
      {tipo === "peso" && <WeightForm />}
    </>
  );
}

async function GlucoseTab() {
  const supabase = await createClient();
  const now = new Date();
  const [faixas, meals] = await Promise.all([getFaixasUsuario(supabase), mealsBefore(supabase, now)]);
  const options: MealOption[] = meals.map((m) => ({ id: m.id, descricao: m.descricao, ocorreuEm: m.ocorreu_em }));
  const sugestao = meals.find((m) => now.getTime() - new Date(m.ocorreu_em).getTime() <= SUGESTAO_REFEICAO_MS);

  return (
    <NewReadingForm
      faixas={faixas}
      meals={options}
      defaults={{ medidoEm: toLocalInput(now), mealId: sugestao?.id }}
    />
  );
}
