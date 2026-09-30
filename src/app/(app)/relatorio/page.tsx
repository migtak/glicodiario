import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Chips } from "@/components/chips";
import { TOM_CLASSES } from "@/components/glucose-badge";
import { PrintButton } from "@/components/print-button";
import { ReferenceRanges } from "@/components/reference-ranges";
import { ContextAverages, DistributionBar, StatTile, extremoDetalhe } from "@/components/summary";
import { TimeChart, type ChartMarker, type ChartPoint } from "@/components/time-chart";
import { dayTicks, niceTicks } from "@/lib/chart";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { listActivities, listMeals, listWeights } from "@/lib/data/records";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";
import { diasAtras, formatDateTime } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import { CONTEXTOS, CONTEXTO_LABEL, FAIXAS_PADRAO, LIMITES_SEGURANCA } from "@/lib/glucose/ranges";
import { formatDuracao, formatPeso } from "@/lib/records";
import { resumirAtividade, resumirGlicemia, resumirPeso } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Relatório para o médico" };

const PERIODOS = [
  { value: "7", label: "7 dias", dias: 7 },
  { value: "30", label: "30 dias", dias: 30 },
  { value: "90", label: "90 dias", dias: 90 },
] as const;

function one(v: string | string[] | undefined) {
  return typeof v === "string" ? v : undefined;
}

const dataCurta = (d: Date) => formatDateTime(d).split(", ")[0];

export default async function RelatorioPage({ searchParams }: PageProps<"/relatorio">) {
  const params = await searchParams;
  const periodo = PERIODOS.find((p) => p.value === one(params.periodo)) ?? PERIODOS[1];

  const inicioDate = diasAtras(periodo.dias);
  const agora = new Date(inicioDate.getTime() + periodo.dias * 86_400_000);
  const supabase = await createClient();
  const [{ data: profile }, faixas, glicemias, refeicoes, atividades, pesos] = await Promise.all([
    supabase.from("profiles").select("nome").maybeSingle(),
    getFaixasUsuario(supabase),
    listReadings(supabase, { desde: inicioDate }),
    listMeals(supabase, { desde: inicioDate }),
    listActivities(supabase, { desde: inicioDate }),
    listWeights(supabase, { desde: inicioDate }),
  ]);
  const erro = glicemias.error || refeicoes.error || atividades.error || pesos.error;

  const resumo = resumirGlicemia(glicemias.readings, faixas);
  const peso = resumirPeso(pesos.items);
  const atividade = resumirAtividade(atividades.items);
  const refeicaoPorId = new Map(refeicoes.items.map((m) => [m.id, m]));
  const personalizadas = CONTEXTOS.filter((c) => {
    const f = faixas[c];
    const p = FAIXAS_PADRAO[c];
    return f.normalMin !== p.normalMin || f.normalMax !== p.normalMax || f.atencaoMax !== p.atencaoMax;
  });

  // gráfico (todos os momentos, com refeições e atividades)
  const inicio = inicioDate.getTime();
  const fim = agora.getTime();
  const pontos: ChartPoint[] = glicemias.readings.map((r) => {
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
  const faixaGrafico = faixas.aleatorio;
  const eixoY = niceTicks(
    Math.min(LIMITES_SEGURANCA.hipo, faixaGrafico.normalMin, ...pontos.map((p) => p.v)) - 10,
    Math.max(faixaGrafico.normalMax, ...pontos.map((p) => p.v)) + 10,
  );

  // tabela em ordem cronológica (mais antiga primeiro), como numa ficha
  const cronologica = [...glicemias.readings].reverse();

  return (
    <article className="flex flex-col gap-8">
      {/* barra de ações: não sai no papel */}
      <div className="flex flex-col gap-4 print:hidden">
        <Link
          href={`/graficos?periodo=${periodo.value}`}
          className="inline-flex min-h-11 items-center gap-2 self-start text-base text-primary hover:underline"
        >
          <ArrowLeft className="size-5" aria-hidden />
          Voltar aos gráficos
        </Link>
        <Chips
          label="Período do relatório"
          items={PERIODOS.map((p) => ({
            label: p.label,
            href: p.value === "30" ? "/relatorio" : `/relatorio?periodo=${p.value}`,
            active: p === periodo,
          }))}
        />
        <div>
          <PrintButton />
          <p className="mt-2 text-sm text-muted-foreground">
            Na janela que abrir, escolha a impressora ou “Salvar como PDF” para enviar por e-mail ou WhatsApp.
          </p>
        </div>
      </div>

      <header className="border-b pb-4">
        <p className="text-sm font-medium text-primary">GlicoDiário · Relatório de glicemia</p>
        <h1 className="mt-1 text-2xl font-semibold">{profile?.nome || "Paciente"}</h1>
        <dl className="mt-2 grid gap-x-6 gap-y-1 text-base sm:grid-cols-2">
          <div>
            <dt className="inline text-muted-foreground">Período: </dt>
            <dd className="inline">
              {dataCurta(inicioDate)} a {dataCurta(agora)} ({periodo.dias} dias)
            </dd>
          </div>
          <div>
            <dt className="inline text-muted-foreground">Gerado em: </dt>
            <dd className="inline">{formatDateTime(agora)}</dd>
          </div>
        </dl>
        <p className="mt-3 text-sm text-muted-foreground">
          Valores registrados pelo próprio paciente a partir de glicosímetro de uso doméstico, em mg/dL.{" "}
          {DISCLAIMER_TEXT}
        </p>
      </header>

      {erro && (
        <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-base text-destructive">
          Não foi possível carregar todos os dados. Verifique sua conexão e recarregue a página antes de imprimir.
        </p>
      )}

      <section aria-labelledby="r-resumo" className="break-inside-avoid">
        <h2 id="r-resumo" className="mb-3 text-lg font-semibold">
          Resumo da glicemia
        </h2>
        {resumo.total === 0 ? (
          <p className="text-base text-muted-foreground">Nenhuma medição registrada no período.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTile label="Média geral" value={String(resumo.media)} unit="mg/dL" detail={`${resumo.total} medições`} />
              <StatTile label="Dentro da faixa" value={`${resumo.pctNaFaixa}%`} detail={`${resumo.distribuicao.normal} de ${resumo.total}`} />
              <StatTile label="Menor valor" value={String(resumo.minimo!.valor)} unit="mg/dL" detail={extremoDetalhe(resumo.minimo)} />
              <StatTile label="Maior valor" value={String(resumo.maximo!.valor)} unit="mg/dL" detail={extremoDetalhe(resumo.maximo)} />
            </div>
            <p className="mt-3 text-base">
              Medições em faixa de risco (abaixo de {LIMITES_SEGURANCA.hipo} ou a partir de {LIMITES_SEGURANCA.muitoAlta}{" "}
              mg/dL): <strong>{resumo.alertas}</strong>
            </p>
            <div className="mt-4">
              <DistributionBar resumo={resumo} />
            </div>
          </>
        )}
      </section>

      {resumo.total > 0 && (
        <>
          <section aria-labelledby="r-momento" className="break-inside-avoid">
            <h2 id="r-momento" className="mb-3 text-lg font-semibold">
              Média por momento da medição
            </h2>
            <ContextAverages resumo={resumo} />
          </section>

          <section aria-labelledby="r-grafico" className="break-inside-avoid">
            <h2 id="r-grafico" className="mb-3 text-lg font-semibold">
              Evolução no período
            </h2>
            <div className="rounded-xl border p-3">
              <TimeChart
                pontos={pontos}
                marcadores={marcadores}
                inicio={inicio}
                fim={fim}
                yMin={eixoY.min}
                yMax={eixoY.max}
                yTicks={eixoY.ticks}
                xTicks={dayTicks(inicio, fim)}
                faixa={{
                  min: faixaGrafico.normalMin,
                  max: faixaGrafico.normalMax,
                  label: `Normal fora do jejum (em jejum: até ${faixas.jejum.normalMax})`,
                }}
                linha={false}
                altura={200}
                ariaLabel={`Gráfico da glicemia no período: ${resumo.total} medições, média ${resumo.media} mg/dL.`}
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Pontos coloridos pela classificação: verde normal, amarelo atenção, vermelho alta, laranja baixa. Abaixo
                do gráfico: ● refeição, ◆ atividade física.
              </p>
            </div>
          </section>
        </>
      )}

      <section aria-labelledby="r-faixas" className="break-inside-avoid">
        <h2 id="r-faixas" className="mb-1 text-lg font-semibold">
          Faixas de referência usadas
        </h2>
        <p className="mb-3 text-sm text-muted-foreground">
          {personalizadas.length
            ? `Personalizadas pelo paciente em: ${personalizadas.map((c) => CONTEXTO_LABEL[c].toLowerCase()).join(", ")}. As demais seguem o padrão SBD/ADA.`
            : "Padrão SBD/ADA (não personalizadas pelo paciente)."}
        </p>
        <ReferenceRanges faixas={faixas} />
      </section>

      {cronologica.length > 0 && (
        <section aria-labelledby="r-medicoes">
          <h2 id="r-medicoes" className="mb-3 text-lg font-semibold">
            Todas as medições ({cronologica.length})
          </h2>
          <div className="overflow-x-auto rounded-xl border print:overflow-visible">
            <table className="w-full text-sm">
              <thead className="bg-muted/60">
                <tr>
                  {["Data e hora", "Momento", "Valor (mg/dL)", "Classificação", "Observações"].map((h) => (
                    <th key={h} scope="col" className="px-3 py-2 text-left font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cronologica.map((r) => {
                  const c = classificar(r.valor_mg_dl, r.contexto, faixas[r.contexto]);
                  const refeicao = r.meal_id ? refeicaoPorId.get(r.meal_id) : undefined;
                  const obs = [refeicao && `Após: ${refeicao.descricao}`, r.observacao].filter(Boolean).join(" · ");
                  return (
                    <tr key={r.id} className="border-t break-inside-avoid">
                      <td className="px-3 py-1.5 whitespace-nowrap tabular-nums">{formatDateTime(new Date(r.medido_em))}</td>
                      <td className="px-3 py-1.5">{CONTEXTO_LABEL[r.contexto]}</td>
                      <td className={cn("px-3 py-1.5 font-semibold tabular-nums", c.alerta && TOM_CLASSES[c.tom].text)}>
                        {r.valor_mg_dl}
                      </td>
                      <td className="px-3 py-1.5 whitespace-nowrap">
                        <span className={cn("mr-1.5 inline-block size-2 rounded-full", TOM_CLASSES[c.tom].solid)} aria-hidden />
                        {c.rotulo}
                      </td>
                      <td className="px-3 py-1.5 text-muted-foreground">{obs}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section aria-labelledby="r-habitos" className="break-inside-avoid">
        <h2 id="r-habitos" className="mb-3 text-lg font-semibold">
          Peso e atividade física
        </h2>
        <ul className="flex flex-col gap-1 text-base">
          <li>
            <span className="text-muted-foreground">Peso: </span>
            {peso
              ? `${formatPeso(peso.atual)} (mais recente)` +
                (peso.variacao != null
                  ? `, variação de ${peso.variacao > 0 ? "+" : ""}${peso.variacao.toLocaleString("pt-BR")} kg no período (${peso.n} registros)`
                  : "")
              : "sem registros no período"}
          </li>
          <li>
            <span className="text-muted-foreground">Atividade física: </span>
            {atividade.sessoes
              ? `${formatDuracao(atividade.totalMin)} no total, em ${atividade.sessoes} ${atividade.sessoes === 1 ? "sessão" : "sessões"} e ${atividade.dias} ${atividade.dias === 1 ? "dia" : "dias"}`
              : "sem registros no período"}
          </li>
          <li>
            <span className="text-muted-foreground">Refeições registradas: </span>
            {refeicoes.items.length}
          </li>
        </ul>
      </section>
    </article>
  );
}
