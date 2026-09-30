"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { campoDe, isUuid, parseActivity, parseMeal, parseWeight, type Campo } from "@/lib/parse-records";
import type { TipoRegistro } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

/** Resultado dos formulários de refeição, atividade e peso. `saved` traz um resumo para exibir. */
export type SaveRecordState = { error?: string; saved?: string; offline?: boolean } | undefined;

const SAVE_ERROR = "Não foi possível salvar. Verifique sua conexão e tente de novo.";

const TABLES = {
  glicemia: "glucose_readings",
  refeicao: "meals",
  atividade: "activities",
  peso: "weights",
} as const satisfies Record<TipoRegistro, string>;

/**
 * Insere (sem `id`) ou atualiza (com `id`). Edição volta ao histórico;
 * criação devolve o resumo para o formulário.
 */
async function salvar(
  tabela: "meals" | "activities" | "weights",
  campo: Campo,
  row: Record<string, unknown>,
  resumo: string,
): Promise<SaveRecordState> {
  const id = campo("id");
  const novoId = campo("novo_id");
  const supabase = await createClient();
  const { data, error } = id
    ? // linhas já validadas por parse-records; o TS não relaciona a tabela ao formato
      await supabase.from(tabela).update(row as never).eq("id", id).select("id")
    : await supabase
        .from(tabela)
        // na criação, o id pode vir do aparelho (mesmo id usado pela fila offline)
        .insert((isUuid(novoId) ? { ...row, id: novoId } : row) as never)
        .select("id");
  if (error || !data?.length) return { error: SAVE_ERROR };

  revalidatePath("/", "layout");
  if (id) redirect("/historico?salvo=1");
  return { saved: resumo };
}

export async function saveMeal(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const campo = campoDe(formData);
  const p = parseMeal(campo);
  if (!p.ok) return { error: p.error };
  return salvar("meals", campo, p.row, resumoRefeicao(p.row.descricao));
}

export async function saveActivity(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const campo = campoDe(formData);
  const p = parseActivity(campo);
  if (!p.ok) return { error: p.error };
  return salvar("activities", campo, p.row, resumoAtividade(p.row.tipo, p.row.duracao_min));
}

export async function saveWeight(_: SaveRecordState, formData: FormData): Promise<SaveRecordState> {
  const campo = campoDe(formData);
  const p = parseWeight(campo);
  if (!p.ok) return { error: p.error };
  return salvar("weights", campo, p.row, resumoPeso(p.row.peso_kg));
}

export async function deleteRecord(tipo: TipoRegistro, id: string) {
  const supabase = await createClient();
  await supabase.from(TABLES[tipo]).delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/historico?excluido=1");
}

// Server Actions só podem exportar funções assíncronas; os textos ficam aqui mesmo.
function resumoRefeicao(descricao: string) {
  return `Refeição registrada: ${descricao}`;
}
function resumoAtividade(tipo: string, min: number) {
  return `Atividade registrada: ${tipo}, ${min} min`;
}
function resumoPeso(kg: number) {
  return `Peso registrado: ${String(kg).replace(".", ",")} kg`;
}
