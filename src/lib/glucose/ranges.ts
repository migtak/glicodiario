/**
 * Faixas de referência da glicemia (mg/dL), conforme PROJETO.md §5.
 * Fontes: Sociedade Brasileira de Diabetes (SBD) e American Diabetes Association (ADA).
 */

/** Mesmos valores do enum `contexto_medicao` no banco. */
export const CONTEXTOS = [
  "jejum",
  "antes_refeicao",
  "pos_1h",
  "pos_2h",
  "antes_dormir",
  "aleatorio",
] as const;

export type Contexto = (typeof CONTEXTOS)[number];

export const CONTEXTO_LABEL: Record<Contexto, string> = {
  jejum: "Jejum",
  antes_refeicao: "Antes da refeição",
  pos_1h: "1h após refeição",
  pos_2h: "2h após refeição",
  antes_dormir: "Antes de dormir",
  aleatorio: "Aleatório",
};

/**
 * Faixa de um contexto:
 * normal = normalMin..normalMax · atenção = normalMax+1..atencaoMax · alto = acima de atencaoMax.
 */
export type Faixa = {
  normalMin: number;
  normalMax: number;
  atencaoMax: number;
};

const PADRAO_POS_REFEICAO: Faixa = { normalMin: 70, normalMax: 139, atencaoMax: 199 };

export const FAIXAS_PADRAO: Record<Contexto, Faixa> = {
  // critério oficial: <100 normal, 100–125 pré-diabetes, ≥126 alto
  jejum: { normalMin: 70, normalMax: 99, atencaoMax: 125 },
  // critério oficial: <140 normal, 140–199 pré-diabetes, ≥200 alto
  pos_2h: PADRAO_POS_REFEICAO,
  // sem critério oficial: aproximação informativa (PROJETO.md §10, validar com médico)
  pos_1h: PADRAO_POS_REFEICAO,
  antes_refeicao: PADRAO_POS_REFEICAO,
  antes_dormir: PADRAO_POS_REFEICAO,
  aleatorio: PADRAO_POS_REFEICAO,
};

/** Contextos cujas faixas seguem critério oficial (os demais são aproximações). */
export const CONTEXTOS_OFICIAIS: readonly Contexto[] = ["jejum", "pos_2h"];

/**
 * Limites de segurança: valem para qualquer contexto e têm prioridade sobre
 * as faixas (inclusive as personalizadas pelo usuário).
 */
export const LIMITES_SEGURANCA = {
  /** abaixo disso: hipoglicemia importante */
  hipoGrave: 54,
  /** abaixo disso: hipoglicemia */
  hipo: 70,
  /** a partir disso: muito alta */
  muitoAlta: 250,
} as const;

/** Valores aceitos no registro (mesma regra do banco). */
export const VALOR_MIN = 20;
export const VALOR_MAX = 600;

export function isContexto(value: unknown): value is Contexto {
  return typeof value === "string" && (CONTEXTOS as readonly string[]).includes(value);
}

export function faixaValida(f: Faixa): boolean {
  return (
    [f.normalMin, f.normalMax, f.atencaoMax].every(
      (v) => Number.isInteger(v) && v >= VALOR_MIN && v <= VALOR_MAX,
    ) &&
    f.normalMin < f.normalMax &&
    f.normalMax < f.atencaoMax
  );
}

/** Junta as faixas personalizadas do usuário (tabela `target_ranges`) com os padrões. */
export function resolverFaixas(
  personalizadas: Partial<Record<Contexto, Faixa>> = {},
): Record<Contexto, Faixa> {
  const result = { ...FAIXAS_PADRAO };
  for (const contexto of CONTEXTOS) {
    const faixa = personalizadas[contexto];
    if (faixa && faixaValida(faixa)) result[contexto] = faixa;
  }
  return result;
}
