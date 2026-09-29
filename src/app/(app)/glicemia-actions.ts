"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validarValor } from "@/lib/glucose/classify";
import { isContexto, type Contexto } from "@/lib/glucose/ranges";
import { localInputToDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export type SaveReadingState =
  | { error?: string; saved?: { valor: number; contexto: Contexto } }
  | undefined;

const MAX_OBS = 500;
/** tolerância para relógios levemente adiantados */
const FUTURE_TOLERANCE_MS = 5 * 60_000;

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v.trim() : "";
}

/** Cria (sem `id`) ou atualiza (com `id`) uma medição de glicemia. */
export async function saveReading(
  _: SaveReadingState,
  formData: FormData,
): Promise<SaveReadingState> {
  const id = text(formData, "id");
  const valor = Number(text(formData, "valor"));
  const contexto = text(formData, "contexto");
  const medidoEm = localInputToDate(text(formData, "medido_em"));
  const observacao = text(formData, "observacao");

  const erroValor = text(formData, "valor") ? validarValor(valor) : "Informe o valor medido.";
  if (erroValor) return { error: erroValor };
  if (!isContexto(contexto)) return { error: "Escolha o momento da medição." };
  if (!medidoEm) return { error: "Informe uma data e hora válidas." };
  if (medidoEm.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
    return { error: "A data e hora não podem estar no futuro." };
  }
  if (observacao.length > MAX_OBS) {
    return { error: `A observação pode ter no máximo ${MAX_OBS} caracteres.` };
  }

  const row = {
    valor_mg_dl: valor,
    contexto,
    medido_em: medidoEm.toISOString(),
    observacao: observacao || null,
  };

  const supabase = await createClient();
  const { data, error } = id
    ? await supabase.from("glucose_readings").update(row).eq("id", id).select("id")
    : await supabase.from("glucose_readings").insert(row).select("id");

  if (error || !data?.length) {
    return { error: "Não foi possível salvar. Verifique sua conexão e tente de novo." };
  }

  revalidatePath("/", "layout");
  if (id) redirect("/historico?salvo=1");
  return { saved: { valor, contexto } };
}

export async function deleteReading(id: string) {
  const supabase = await createClient();
  await supabase.from("glucose_readings").delete().eq("id", id);
  revalidatePath("/", "layout");
  redirect("/historico?excluido=1");
}
