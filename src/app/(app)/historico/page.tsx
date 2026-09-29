import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus } from "lucide-react";
import { FormMessage } from "@/components/form-ui";
import { PageHeader } from "@/components/page-header";
import { ReadingListByDay } from "@/components/reading-list";
import { buttonVariants } from "@/components/ui/button";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { CONTEXTOS, CONTEXTO_LABEL, isContexto } from "@/lib/glucose/ranges";
import { diasAtras } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Histórico" };

const PERIODOS = [
  { value: "7", label: "7 dias", dias: 7 },
  { value: "30", label: "30 dias", dias: 30 },
  { value: "90", label: "90 dias", dias: 90 },
  { value: "tudo", label: "Tudo", dias: null },
] as const;
const PERIODO_PADRAO = "30";

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function HistoricoPage({ searchParams }: PageProps<"/historico">) {
  const params = await searchParams;
  const periodo = PERIODOS.find((p) => p.value === one(params.periodo)) ?? PERIODOS[1];
  const contextoParam = one(params.contexto);
  const contexto = isContexto(contextoParam) ? contextoParam : undefined;

  const desde = periodo.dias ? diasAtras(periodo.dias) : undefined;
  const supabase = await createClient();
  const [faixas, { readings, error }] = await Promise.all([
    getFaixasUsuario(supabase),
    listReadings(supabase, { desde, contexto }),
  ]);

  const href = (next: { periodo?: string; contexto?: string | null }) => {
    const q = new URLSearchParams();
    const p = next.periodo ?? periodo.value;
    const c = next.contexto === undefined ? contexto : next.contexto;
    if (p !== PERIODO_PADRAO) q.set("periodo", p);
    if (c) q.set("contexto", c);
    const s = q.toString();
    return s ? `/historico?${s}` : "/historico";
  };

  const aviso = params.salvo ? "Alterações salvas." : params.excluido ? "Medição excluída." : undefined;

  return (
    <>
      <PageHeader title="Histórico" />

      {aviso && (
        <div className="mb-4">
          <FormMessage success={aviso} />
        </div>
      )}

      <nav aria-label="Filtros" className="mb-6 flex flex-col gap-3">
        <Chips
          label="Período"
          items={PERIODOS.map((p) => ({ label: p.label, href: href({ periodo: p.value }), active: p === periodo }))}
        />
        <Chips
          label="Momento"
          items={[
            { label: "Todos", href: href({ contexto: null }), active: !contexto },
            ...CONTEXTOS.map((c) => ({
              label: CONTEXTO_LABEL[c],
              href: href({ contexto: c }),
              active: c === contexto,
            })),
          ]}
        />
      </nav>

      {error ? (
        <FormMessage error="Não foi possível carregar as medições. Verifique sua conexão e recarregue a página." />
      ) : readings.length === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-base text-muted-foreground">Nenhuma medição neste período.</p>
          <Link href="/registrar" className={cn(buttonVariants(), "mt-4 h-12 gap-2 px-6 text-base")}>
            <CirclePlus className="size-5" aria-hidden />
            Registrar glicemia
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-muted-foreground">
            {readings.length} {readings.length === 1 ? "medição" : "medições"}
          </p>
          <ReadingListByDay readings={readings} faixas={faixas} />
        </>
      )}
    </>
  );
}

function Chips({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map((item) => (
          <li key={item.label} className="shrink-0">
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-base",
                item.active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
