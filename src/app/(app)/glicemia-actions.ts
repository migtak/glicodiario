"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";
import type { Contexto } from "@/lib/glucose/ranges";
import { campoDe, isUuid, parseReading } from "@/lib/parse-records";
import { createClient } from "@/lib/supabase/server";

export type SaveReadingState =
  | { error?: string; saved?: { valor: number; contexto: Contexto }; offline?: boolean }
  | undefined;

type GlucoseInsert = Database["public"]["Tables"]["glucose_readings"]["Insert"];

/** Cria (sem `id`) ou atualiza (com `id`) uma medição de glicemia. */
export async function saveReading(
  _: SaveReadingState,
  formData: FormData,
): Promise<SaveReadingState> {
  const campo = campoDe(formData);
  const id = campo("id");
  const parsed = parseReading(campo);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  // na criação, o id pode vir do aparelho (mesmo id usado pela fila offline)
  const novoId = campo("novo_id");
  const nova: GlucoseInsert = isUuid(novoId) ? { ...parsed.row, id: novoId } : parsed.row;
  const { data, error } = id
    ? await supabase.from("glucose_readings").update(parsed.row).eq("id", id).select("id")
    : await supabase
        .from("glucose_readings")
        .insert(nova)
        .select("id");

  if (error || !data?.length) {
    return { error: "Não foi possível salvar. Verifique sua conexão e tente de novo." };
  }

  revalidatePath("/", "layout");
  if (id) redirect("/historico?salvo=1");
  return { saved: { valor: parsed.row.valor_mg_dl, contexto: parsed.row.contexto } };
}
