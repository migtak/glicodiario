/** Cálculos do resumo (PROJETO.md §6.4). Funções puras, sem acesso ao banco. */
import { classificar, type Nivel } from "@/lib/glucose/classify";
import { CONTEXTOS, type Contexto, type Faixa } from "@/lib/glucose/ranges";
import { dayKey } from "@/lib/format";

type ReadingLike = { valor_mg_dl: number; contexto: Contexto; medido_em: string };
type WeightLike = { peso_kg: number; medido_em: string };
type ActivityLike = { duracao_min: number; ocorreu_em: string };

/** Agrupamento dos níveis para a barra de distribuição. */
export type Grupo = "baixa" | "normal" | "atencao" | "alta";

export const GRUPO_DE_NIVEL: Record<Nivel, Grupo> = {
  hipo_grave: "baixa",
  hipo: "baixa",
  abaixo: "baixa",
  normal: "normal",
  atencao: "atencao",
  alto: "alta",
  muito_alto: "alta",
};

export type Extremo = { valor: number; contexto: Contexto; em: string };

export type ResumoGlicemia = {
  total: number;
  media: number | null;
  /** % de medições dentro da faixa normal do seu momento (0–100) */
  pctNaFaixa: number | null;
  distribuicao: Record<Grupo, number>;
  /** medições em faixa de risco (hipoglicemia ou muito alta) */
  alertas: number;
  minimo: Extremo | null;
  maximo: Extremo | null;
  porContexto: { contexto: Contexto; n: number; media: number }[];
};

const media = (valores: number[]) => Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);

export function resumirGlicemia(
  readings: ReadingLike[],
  faixas: Record<Contexto, Faixa>,
): ResumoGlicemia {
  const distribuicao: Record<Grupo, number> = { baixa: 0, normal: 0, atencao: 0, alta: 0 };
  let alertas = 0;
  let minimo: Extremo | null = null;
  let maximo: Extremo | null = null;
  const porContexto = new Map<Contexto, number[]>();

  for (const r of readings) {
    const c = classificar(r.valor_mg_dl, r.contexto, faixas[r.contexto]);
    distribuicao[GRUPO_DE_NIVEL[c.nivel]]++;
    if (c.alerta) alertas++;
    const extremo = { valor: r.valor_mg_dl, contexto: r.contexto, em: r.medido_em };
    if (!minimo || r.valor_mg_dl < minimo.valor) minimo = extremo;
    if (!maximo || r.valor_mg_dl > maximo.valor) maximo = extremo;
    porContexto.set(r.contexto, [...(porContexto.get(r.contexto) ?? []), r.valor_mg_dl]);
  }

  const total = readings.length;
  return {
    total,
    media: total ? media(readings.map((r) => r.valor_mg_dl)) : null,
    pctNaFaixa: total ? Math.round((distribuicao.normal / total) * 100) : null,
    distribuicao,
    alertas,
    minimo,
    maximo,
    porContexto: CONTEXTOS.filter((c) => porContexto.has(c)).map((contexto) => {
      const valores = porContexto.get(contexto)!;
      return { contexto, n: valores.length, media: media(valores) };
    }),
  };
}

export type ResumoPeso = {
  atual: number;
  /** atual − primeiro registro do período (kg, 2 casas); null se só há um registro */
  variacao: number | null;
  n: number;
} | null;

export function resumirPeso(weights: WeightLike[]): ResumoPeso {
  if (!weights.length) return null;
  const ordenados = [...weights].sort((a, b) => a.medido_em.localeCompare(b.medido_em));
  const atual = ordenados[ordenados.length - 1].peso_kg;
  const primeiro = ordenados[0].peso_kg;
  return {
    atual,
    variacao: ordenados.length > 1 ? Math.round((atual - primeiro) * 100) / 100 : null,
    n: ordenados.length,
  };
}

export type ResumoAtividade = { totalMin: number; sessoes: number; dias: number };

export function resumirAtividade(activities: ActivityLike[]): ResumoAtividade {
  return {
    totalMin: activities.reduce((s, a) => s + a.duracao_min, 0),
    sessoes: activities.length,
    dias: new Set(activities.map((a) => dayKey(new Date(a.ocorreu_em)))).size,
  };
}
