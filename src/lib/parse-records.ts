/**
 * Leitura e validação dos formulários de registro. Funções puras, usadas tanto
 * pelas Server Actions (online) quanto pela fila do aparelho (offline), para
 * que as regras sejam exatamente as mesmas nos dois caminhos.
 */
import { validarValor } from "@/lib/glucose/classify";
import { isContexto, type Contexto } from "@/lib/glucose/ranges";
import { localInputToDate } from "@/lib/format";
import { DESCRICAO_MAX, TIPO_ATIVIDADE_MAX, parsePeso, validarDuracao } from "@/lib/records";

/** Lê um campo do formulário já sem espaços nas pontas ("" se ausente). */
export type Campo = (name: string) => string;

export function campoDe(formData: FormData): Campo {
  return (name) => {
    const v = formData.get(name);
    return typeof v === "string" ? v.trim() : "";
  };
}

type Resultado<T> = { ok: true; row: T } | { ok: false; error: string };

const MAX_OBS = 500;
/** tolerância para relógios levemente adiantados */
const FUTURE_TOLERANCE_MS = 5 * 60_000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(v: string): boolean {
  return UUID.test(v);
}

function dataHora(texto: string, agora: number): { iso: string } | { error: string } {
  const date = localInputToDate(texto);
  if (!date) return { error: "Informe uma data e hora válidas." };
  if (date.getTime() > agora + FUTURE_TOLERANCE_MS) return { error: "A data e hora não podem estar no futuro." };
  return { iso: date.toISOString() };
}

export type ReadingRow = {
  valor_mg_dl: number;
  contexto: Contexto;
  medido_em: string;
  observacao: string | null;
  meal_id: string | null;
};

export function parseReading(campo: Campo, agora = Date.now()): Resultado<ReadingRow> {
  const valorTexto = campo("valor");
  const valor = Number(valorTexto);
  const contexto = campo("contexto");
  const observacao = campo("observacao");
  // só medições pós-refeição podem ter refeição vinculada
  const mealId = contexto === "pos_1h" || contexto === "pos_2h" ? campo("meal_id") : "";

  const erroValor = valorTexto ? validarValor(valor) : "Informe o valor medido.";
  if (erroValor) return { ok: false, error: erroValor };
  if (!isContexto(contexto)) return { ok: false, error: "Escolha o momento da medição." };
  const quando = dataHora(campo("medido_em"), agora);
  if ("error" in quando) return { ok: false, error: quando.error };
  if (mealId && !isUuid(mealId)) return { ok: false, error: "Refeição inválida." };
  if (observacao.length > MAX_OBS) {
    return { ok: false, error: `A observação pode ter no máximo ${MAX_OBS} caracteres.` };
  }
  return {
    ok: true,
    row: {
      valor_mg_dl: valor,
      contexto,
      medido_em: quando.iso,
      observacao: observacao || null,
      meal_id: mealId || null,
    },
  };
}

export type MealRow = { descricao: string; ocorreu_em: string };

export function parseMeal(campo: Campo, agora = Date.now()): Resultado<MealRow> {
  const descricao = campo("descricao");
  if (!descricao) return { ok: false, error: "Descreva o que você comeu." };
  if (descricao.length > DESCRICAO_MAX) {
    return { ok: false, error: `A descrição pode ter no máximo ${DESCRICAO_MAX} caracteres.` };
  }
  const quando = dataHora(campo("quando"), agora);
  if ("error" in quando) return { ok: false, error: quando.error };
  return { ok: true, row: { descricao, ocorreu_em: quando.iso } };
}

export type ActivityRow = { tipo: string; duracao_min: number; ocorreu_em: string };

export function parseActivity(campo: Campo, agora = Date.now()): Resultado<ActivityRow> {
  const escolha = campo("tipo");
  const tipo = escolha === "outra" ? campo("tipo_outra") : escolha;
  const duracaoTexto = campo("duracao_min");
  const duracao = Number(duracaoTexto);

  if (!tipo) {
    return { ok: false, error: escolha === "outra" ? "Escreva qual foi a atividade." : "Escolha a atividade." };
  }
  if (tipo.length > TIPO_ATIVIDADE_MAX) {
    return { ok: false, error: `O nome da atividade pode ter no máximo ${TIPO_ATIVIDADE_MAX} caracteres.` };
  }
  const erroDuracao = duracaoTexto ? validarDuracao(duracao) : "Informe a duração em minutos.";
  if (erroDuracao) return { ok: false, error: erroDuracao };
  const quando = dataHora(campo("quando"), agora);
  if ("error" in quando) return { ok: false, error: quando.error };
  return { ok: true, row: { tipo, duracao_min: duracao, ocorreu_em: quando.iso } };
}

export type WeightRow = { peso_kg: number; medido_em: string };

export function parseWeight(campo: Campo, agora = Date.now()): Resultado<WeightRow> {
  const peso = parsePeso(campo("peso_kg"));
  if ("erro" in peso) return { ok: false, error: peso.erro };
  const quando = dataHora(campo("quando"), agora);
  if ("error" in quando) return { ok: false, error: quando.error };
  return { ok: true, row: { peso_kg: peso.valor, medido_em: quando.iso } };
}
