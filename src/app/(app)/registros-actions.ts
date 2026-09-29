"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { localInputToDate } from "@/lib/format";
import {
  DESCRICAO_MAX,
  TIPO_ATIVIDADE_MAX,
  parsePeso,
  validarDuracao,
  type TipoRegistro,
} from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

/** Resultado dos formulários de refeição, atividade e peso. `saved` traz um resumo para exibir. */
export type SaveRecordState = { error?: string; saved?: string } | undefined;

const FUTURE_TOLERANCE_MS = 5 * 60_000;
const SAVE_ERROR = "Não foi possível salvar. Verifique sua conexão e tente de novo.";

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/** Lê e valida a data/hora do campo `quando`. */
function parseQuando(formData: FormData): { iso: string } | { error: string } {
  const date = localInputToDate(text(formData, "quando"));
  if (!date) return { error: "Informe uma data e hora válidas." };
  if (date.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
    return { error: "A data e hora não podem estar no futuro." };
  }
  return { iso: date.toISOString() };
}

/** Depois de salvar: edição volta ao histórico; criação mostra o resumo no próprio formulário. */
function finish(id: string, saved: string): SaveRecordState {
  revalidatePath("/", "layout");
  if (id) redirect("/historico?salvo=1");
  return { saved };
}

export async function saveMeal(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const id = text(formData, "id");
  const descricao = text(formData, "descricao");
  const quando = parseQuando(formData);

  if (!descricao) return { error: "Descreva o que você comeu." };
  if (descricao.length > DESCRICAO_MAX) {
    return { error: `A descrição pode ter no máximo ${DESCRICAO_MAX} caracteres.` };
  }
  if ("error" in quando) return quando;

  const row = { descricao, ocorreu_em: quando.iso };
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("meals").update(row).eq("id", id).select("id")
    : await supabase.from("meals").insert(row).select("id");
  if (error || !data?.length) return { error: SAVE_ERROR };

  return finish(id, `Refeição registrada: ${descricao}`);
}

export async function saveActivity(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const id = text(formData, "id");
  const escolha = text(formData, "tipo");
  const tipo = escolha === "outra" ? text(formData, "tipo_outra") : escolha;
  const duracaoTexto = text(formData, "duracao_min");
  const duracao = Number(duracaoTexto);
  const quando = parseQuando(formData);

  if (!tipo) return { error: escolha === "outra" ? "Escreva qual foi a atividade." : "Escolha a atividade." };
  if (tipo.length > TIPO_ATIVIDADE_MAX) {
    return { error: `O nome da atividade pode ter no máximo ${TIPO_ATIVIDADE_MAX} caracteres.` };
  }
  const erroDuracao = duracaoTexto ? validarDuracao(duracao) : "Informe a duração em minutos.";
  if (erroDuracao) return { error: erroDuracao };
  if ("error" in quando) return quando;

  const row = { tipo, duracao_min: duracao, ocorreu_em: quando.iso };
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("activities").update(row).eq("id", id).select("id")
    : await supabase.from("activities").insert(row).select("id");
  if (error || !data?.length) return { error: SAVE_ERROR };

  return finish(id, `Atividade registrada: ${tipo}, ${duracao} min`);
}

export async function saveWeight(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const id = text(formData, "id");
  const peso = parsePeso(text(formData, "peso_kg"));
  const quando = parseQuando(formData);

  if ("erro" in peso) return { error: peso.erro };
  if ("error" in quando) return quando;

  const row = { peso_kg: peso.valor, medido_em: quando.iso };
  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("weights").update(row).eq("id", id).select("id")
    : await supabase.from("weights").insert(row).select("id");
  if (error || !data?.length) return { error: SAVE_ERROR };

  return finish(id, `Peso registrado: ${String(peso.valor).replace(".", ",")} kg`);
}

const TABLES = {
  glicemia: "glucose_readings",
  refeicao: "meals",
  atividade: "activities",
  peso: "weights",
} as const satisfies Record<TipoRegistro, string>;

export async function deleteRecord(tipo: TipoRegistro, id: string) {
  const supabase = await createClient();
  await supabase.from(TABLES[tipo]).delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/historico?excluido=1");
}
