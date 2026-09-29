/** Regras dos registros complementares (PROJETO.md §6.3): refeição, atividade física e peso. */

export const PESO_MIN = 20;
export const PESO_MAX = 400;
export const DURACAO_MIN = 1;
export const DURACAO_MAX = 1440;
export const DESCRICAO_MAX = 500;
export const TIPO_ATIVIDADE_MAX = 100;

export const ATIVIDADES_COMUNS = [
  "Caminhada",
  "Corrida",
  "Bicicleta",
  "Musculação",
  "Natação",
  "Dança",
] as const;

/** Tipos de registro, usados em rotas (/historico/refeicao/…) e filtros. */
export const TIPOS_REGISTRO = ["glicemia", "refeicao", "atividade", "peso"] as const;
export type TipoRegistro = (typeof TIPOS_REGISTRO)[number];

export const TIPO_REGISTRO_LABEL: Record<TipoRegistro, string> = {
  glicemia: "Glicemia",
  refeicao: "Refeição",
  atividade: "Atividade",
  peso: "Peso",
};

export function isTipoRegistro(value: unknown): value is TipoRegistro {
  return typeof value === "string" && (TIPOS_REGISTRO as readonly string[]).includes(value);
}

/** "72,5" ou "72.5" → 72.5 (com até 2 casas); retorna erro em texto se inválido. */
export function parsePeso(texto: string): { valor: number } | { erro: string } {
  const normalizado = texto.trim().replace(",", ".");
  if (!normalizado) return { erro: "Informe o peso." };
  if (!/^\d{1,3}(\.\d{1,2})?$/.test(normalizado)) {
    return { erro: "Informe o peso em kg, com até 2 casas decimais (ex.: 72,5)." };
  }
  const valor = Number(normalizado);
  if (valor < PESO_MIN || valor > PESO_MAX) {
    return { erro: `O peso precisa estar entre ${PESO_MIN} e ${PESO_MAX} kg.` };
  }
  return { valor };
}

export function validarDuracao(minutos: number): string | null {
  if (!Number.isInteger(minutos)) return "Informe a duração em minutos, sem vírgula.";
  if (minutos < DURACAO_MIN || minutos > DURACAO_MAX) {
    return `A duração precisa estar entre ${DURACAO_MIN} e ${DURACAO_MAX} minutos.`;
  }
  return null;
}

/** Ex.: 45 → "45 min", 90 → "1h30", 120 → "2h" */
export function formatDuracao(minutos: number): string {
  if (minutos < 60) return `${minutos} min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

/** Ex.: 72.5 → "72,5 kg" */
export function formatPeso(kg: number): string {
  return `${kg.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} kg`;
}

/** Peso no formato do campo de texto: 72.5 → "72,5" */
export function pesoParaCampo(kg: number): string {
  return String(kg).replace(".", ",");
}
