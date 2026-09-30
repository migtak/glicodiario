import type { Metadata } from "next";
import Link from "next/link";
import { CirclePlus, TriangleAlert } from "lucide-react";
import { Chips } from "@/components/chips";
import { PageHeader } from "@/components/page-header";
import { ContextAverages, DistributionBar, StatTile, extremoDetalhe } from "@/components/summary";
import { TOM_CLASSES } from "@/components/glucose-badge";
import { TimeChart, type ChartMarker, type ChartPoint } from "@/components/time-chart";
import { buttonVariants } from "@/components/ui/button";
import { dayTicks, niceTicks } from "@/lib/chart";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { listActivities, listMeals, listWeights } from "@/lib/data/records";
import { diasAtras, formatDateTime } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import { CONTEXTOS, CONTEXTO_LABEL, isContexto, LIMITES_SEGURANCA } from "@/lib/glucose/ranges";
import { formatDuracao, formatPeso } from "@/lib/records";
import { resumirAtividade, resumirGlicemia, resumirPeso } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gráficos" };

const PERIODOS = [
  { value: "7", label: "7 dias", dias: 7 },
  { value: "30", label: "30 dias", dias: 30 },
  { value: "90", label: "90 dias", dias: 90 },
] as const;
const PERIODO_PADRAO = "30";

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

export default async function GraficosPage({ searchParams }: PageProps<"/graficos">) {
  const params = await searchParams;
  const periodo = PERIODOS.find((p) => p.value === one(params.periodo)) ?? PERIODOS[1];
  const contextoParam = one(params.contexto);
  const contexto = isContexto(contextoParam) ? contextoParam : undefined;

  const inicioDate = diasAtras(periodo.dias);
  const supabase = await createClient();
  const [faixas, glicemias, refeicoes, atividades, pesos] = await Promise.all([
    getFaixasUsuario(supabase),
    listReadings(supabase, { desde: inicioDate }),
    listMeals(supabase, { desde: inicioDate }),
    listActivities(supabase, { desde: inicioDate }),
    listWeights(supabase, { desde: inicioDate }),
  ]);
  const inicio = inicioDate.getTime();
  const fim = inicio + periodo.dias * 86_400_000;

  const href = (next: { periodo?: string; contexto?: string | null }) => {
    const q = new URLSearchParams();
    const p = next.periodo ?? periodo.value;
    const c = next.contexto === undefined ? contexto : next.contexto;
    if (p !== PERIODO_PADRAO) q.set("periodo", p);
    if (c) q.set("contexto", c);
    const s = q.toString();
    return s ? `/graficos?${s}` : "/graficos";
  };

  const resumo = resumirGlicemia(glicemias.readings, faixas);
  const peso = resumirPeso(pesos.items);
  const atividade = resumirAtividade(atividades.items);
  const erro = glicemias.error || refeicoes.error || atividades.error || pesos.error;

  // ---- gráfico de glicemia (filtrável por momento)
  const doGrafico = contexto ? glicemias.readings.filter((r) => r.contexto === contexto) : glicemias.readings;
  const pontos: ChartPoint[] = doGrafico.map((r) => {
    const c = classificar(r.valor_mg_dl, r.contexto, faixas[r.contexto]);
    return {
      t: new Date(r.medido_em).getTime(),
      v: r.valor_mg_dl,
      fillClass: TOM_CLASSES[c.tom].fill,
      titulo: `${r.valor_mg_dl} mg/dL · ${c.rotulo}`,
      linhas: [CONTEXTO_LABEL[r.contexto], formatDateTime(new Date(r.medido_em))],
    };
  });
  const marcadores: ChartMarker[] = [
    ...refeicoes.items.map((m) => ({
      t: new Date(m.ocorreu_em).getTime(),
      tipo: "refeicao" as const,
      titulo: "Refeição",
      linhas: [formatDateTime(new Date(m.ocorreu_em)), m.descricao],
    })),
    ...atividades.items.map((a) => ({
      t: new Date(a.ocorreu_em).getTime(),
      tipo: "atividade" as const,
      titulo: a.tipo,
      linhas: [`${formatDateTime(new Date(a.ocorreu_em))} · ${formatDuracao(a.duracao_min)}`],
    })),
  ];
  // sem momento escolhido, a faixa sombreada é a de fora do jejum
  const faixaGrafico = faixas[contexto ?? "aleatorio"];
  const faixaLabel = contexto
    ? `Normal em ${CONTEXTO_LABEL[contexto].toLowerCase()}`
    : `Normal fora do jejum (em jejum: até ${faixas.jejum.normalMax})`;
  const valores = pontos.map((p) => p.v);
  const eixoY = niceTicks(
    Math.min(LIMITES_SEGURANCA.hipo, faixaGrafico.normalMin, ...valores) - 10,
    Math.max(faixaGrafico.normalMax, ...valores) + 10,
  );
  const xTicks = dayTicks(inicio, fim);

  // ---- gráfico de peso
  const pontosPeso: ChartPoint[] = pesos.items.map((w) => ({
    t: new Date(w.medido_em).getTime(),
    v: w.peso_kg,
    fillClass: "fill-primary",
    titulo: formatPeso(w.peso_kg),
    linhas: [formatDateTime(new Date(w.medido_em))],
  }));
  const eixoPeso = pontosPeso.length
    ? niceTicks(Math.min(...pontosPeso.map((p) => p.v)) - 1, Math.max(...pontosPeso.map((p) => p.v)) + 1, 4)
    : null;

  return (
    <>
      <PageHeader title="Gráficos e resumo" />

      <nav aria-label="Período" className="mb-6">
        <Chips
          label="Período"
          items={PERIODOS.map((p) => ({ label: p.label, href: href({ periodo: p.value }), active: p === periodo }))}
        />
      </nav>

      {erro && (
        <p role="alert" className="mb-6 rounded-lg bg-destructive/10 p-3 text-base text-destructive">
          Não foi possível carregar todos os dados. Verifique sua conexão e recarregue a página.
        </p>
      )}

      {resumo.total === 0 ? (
        <div className="rounded-xl border border-dashed p-6 text-center">
          <p className="text-base text-muted-foreground">
            Nenhuma medição de glicemia nos últimos {periodo.dias} dias.
          </p>
          <Link href="/registrar" className={cn(buttonVariants(), "mt-4 h-12 gap-2 px-6 text-base")}>
            <CirclePlus className="size-5" aria-hidden />
            Registrar glicemia
          </Link>
        </div>
      ) : (
        <>
          <section aria-labelledby="resumo-titulo" className="mb-10">
            <h2 id="resumo-titulo" className="mb-3 text-lg font-semibold">
              Resumo dos últimos {periodo.dias} dias
            </h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Média geral" value={String(resumo.media)} unit="mg/dL" detail={`${resumo.total} ${resumo.total === 1 ? "medição" : "medições"}`} />
              <StatTile label="Dentro da faixa" value={`${resumo.pctNaFaixa}%`} detail={`${resumo.distribuicao.normal} de ${resumo.total}`} />
              <StatTile label="Menor valor" value={String(resumo.minimo!.valor)} unit="mg/dL" detail={extremoDetalhe(resumo.minimo)} />
              <StatTile label="Maior valor" value={String(resumo.maximo!.valor)} unit="mg/dL" detail={extremoDetalhe(resumo.maximo)} />
            </div>

            {resumo.alertas > 0 && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-glu-high/40 bg-glu-high/10 p-3 text-base">
                <TriangleAlert className="mt-0.5 size-5 shrink-0 text-glu-high" aria-hidden />
                <span>
                  {resumo.alertas} {resumo.alertas === 1 ? "medição ficou" : "medições ficaram"} em faixa de risco
                  (abaixo de {LIMITES_SEGURANCA.hipo} ou a partir de {LIMITES_SEGURANCA.muitoAlta} mg/dL). Vale conversar
                  com um profissional de saúde.
                </span>
              </p>
            )}

            <h3 className="mt-6 mb-3 text-base font-semibold">Como ficaram as medições</h3>
            <DistributionBar resumo={resumo} />

            <h3 className="mt-6 mb-3 text-base font-semibold">Média por momento</h3>
            <ContextAverages resumo={resumo} />
          </section>

          <section aria-labelledby="grafico-titulo" className="mb-10">
            <h2 id="grafico-titulo" className="mb-3 text-lg font-semibold">
              Evolução da glicemia
            </h2>
            <div className="mb-4">
              <Chips
                label="Momento"
                items={[
                  { label: "Todos", href: href({ contexto: null }), active: !contexto },
                  ...CONTEXTOS.filter((c) => glicemias.readings.some((r) => r.contexto === c)).map((c) => ({
                    label: CONTEXTO_LABEL[c],
                    href: href({ contexto: c }),
                    active: c === contexto,
                  })),
                ]}
              />
            </div>
            {pontos.length === 0 ? (
              <p className="rounded-xl border border-dashed p-6 text-base text-muted-foreground">
                Nenhuma medição neste momento do dia no período.
              </p>
            ) : (
              <div className="rounded-xl border p-3 sm:p-4">
                <TimeChart
                  pontos={pontos}
                  marcadores={marcadores}
                  inicio={inicio}
                  fim={fim}
                  yMin={eixoY.min}
                  yMax={eixoY.max}
                  yTicks={eixoY.ticks}
                  xTicks={xTicks}
                  faixa={{ min: faixaGrafico.normalMin, max: faixaGrafico.normalMax, label: faixaLabel }}
                  linha={Boolean(contexto)}
                  ariaLabel={`Gráfico da glicemia em mg/dL nos últimos ${periodo.dias} dias: ${pontos.length} medições, média ${resumo.media}. A lista completa está no Histórico.`}
                />
                <ChartLegend marcadores={marcadores.length > 0} />
              </div>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Toque ou passe o mouse sobre um ponto para ver os detalhes.{" "}
              <Link href={`/historico?periodo=${periodo.value}`} className="text-primary underline-offset-4 hover:underline">
                Ver como lista
              </Link>
            </p>
          </section>
        </>
      )}

      <section aria-labelledby="peso-titulo" className="mb-10">
        <h2 id="peso-titulo" className="mb-3 text-lg font-semibold">
          Peso e atividade física
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            label="Peso mais recente"
            value={peso ? formatPeso(peso.atual).replace(" kg", "") : "—"}
            unit={peso ? "kg" : undefined}
            detail={
              peso?.variacao != null
                ? `${peso.variacao > 0 ? "+" : ""}${peso.variacao.toLocaleString("pt-BR")} kg no período`
                : peso
                  ? "1 registro no período"
                  : "sem registros"
            }
          />
          <StatTile
            label="Atividade física"
            value={formatDuracao(atividade.totalMin || 0).replace(" min", "")}
            unit={atividade.totalMin < 60 ? "min" : undefined}
            detail={`${atividade.sessoes} ${atividade.sessoes === 1 ? "sessão" : "sessões"} em ${atividade.dias} ${atividade.dias === 1 ? "dia" : "dias"}`}
          />
        </div>
        {eixoPeso && pontosPeso.length > 1 && (
          <div className="mt-4 rounded-xl border p-3 sm:p-4">
            <h3 className="mb-2 text-base font-semibold">Evolução do peso (kg)</h3>
            <TimeChart
              pontos={pontosPeso}
              inicio={inicio}
              fim={fim}
              yMin={eixoPeso.min}
              yMax={eixoPeso.max}
              yTicks={eixoPeso.ticks}
              xTicks={xTicks}
              altura={160}
              ariaLabel={`Gráfico do peso nos últimos ${periodo.dias} dias: ${pontosPeso.length} registros, mais recente ${peso ? formatPeso(peso.atual) : ""}.`}
            />
          </div>
        )}
      </section>
    </>
  );
}

function ChartLegend({ marcadores }: { marcadores: boolean }) {
  const itens: { tom: keyof typeof TOM_CLASSES; label: string }[] = [
    { tom: "glu-normal", label: "Normal" },
    { tom: "glu-attention", label: "Atenção / abaixo da faixa" },
    { tom: "glu-high", label: "Alta" },
    { tom: "glu-low", label: "Baixa" },
  ];
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {itens.map((i) => (
        <li key={i.tom} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", TOM_CLASSES[i.tom].solid)} aria-hidden />
          {i.label}
        </li>
      ))}
      {marcadores && (
        <>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-full bg-foreground/70" aria-hidden />
            Refeição
          </li>
          <li className="flex items-center gap-1.5">
            <span className="size-2.5 rotate-45 bg-primary" aria-hidden />
            Atividade
          </li>
        </>
      )}
    </ul>
  );
}

