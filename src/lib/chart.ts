/** Escalas e marcações de eixo dos gráficos. Funções puras. */
import { dayKey, localInputToDate } from "@/lib/format";

const PASSOS = [1, 2, 2.5, 5, 10];

/**
 * Marcações "redondas" para um eixo que precisa cobrir [lo, hi].
 * O domínio devolvido começa e termina em uma marcação.
 */
export function niceTicks(lo: number, hi: number, alvo = 5): { min: number; max: number; ticks: number[] } {
  if (hi <= lo) hi = lo + 1;
  const bruto = (hi - lo) / alvo;
  const magnitude = 10 ** Math.floor(Math.log10(bruto));
  const passo = magnitude * PASSOS.find((p) => p * magnitude >= bruto)!;
  const min = Math.floor(lo / passo) * passo;
  const max = Math.ceil(hi / passo) * passo;
  const ticks: number[] = [];
  // arredonda para evitar 0.30000000000000004
  for (let v = min; v <= max + passo / 2; v += passo) ticks.push(Math.round(v * 100) / 100);
  return { min, max, ticks };
}

const DIA_MS = 86_400_000;

/**
 * Marcações de dia (meia-noite no fuso do app) entre `inicio` e `fim` (ms),
 * espaçadas para caber cerca de 7 rótulos. Rótulo no formato "24/09".
 */
export function dayTicks(inicio: number, fim: number): { t: number; label: string }[] {
  const dias = Math.max(1, Math.round((fim - inicio) / DIA_MS));
  const passo = dias <= 8 ? 1 : dias <= 31 ? 5 : 15;
  const ticks: { t: number; label: string }[] = [];
  // primeira meia-noite local a partir do início
  let dia = localInputToDate(`${dayKey(new Date(inicio))}T00:00`)!.getTime();
  if (dia < inicio) dia += DIA_MS;
  for (let i = 0; dia <= fim; dia += DIA_MS, i++) {
    if (i % passo !== 0) continue;
    const [, mes, d] = dayKey(new Date(dia)).split("-");
    ticks.push({ t: dia, label: `${d}/${mes}` });
  }
  return ticks;
}
