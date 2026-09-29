import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, GlucoseReading } from "@/lib/database.types";
import { resolverFaixas, type Contexto, type Faixa } from "@/lib/glucose/ranges";

type Client = SupabaseClient<Database>;

export type Reading = Pick<
  GlucoseReading,
  "id" | "valor_mg_dl" | "contexto" | "medido_em" | "observacao" | "meal_id"
>;

const READING_COLUMNS = "id, valor_mg_dl, contexto, medido_em, observacao, meal_id";

/** Faixas do usuário: padrões + personalizações salvas em `target_ranges`. */
export async function getFaixasUsuario(supabase: Client): Promise<Record<Contexto, Faixa>> {
  const { data } = await supabase
    .from("target_ranges")
    .select("contexto, normal_min, normal_max, atencao_max");
  const personalizadas: Partial<Record<Contexto, Faixa>> = {};
  for (const r of data ?? []) {
    personalizadas[r.contexto] = {
      normalMin: r.normal_min,
      normalMax: r.normal_max,
      atencaoMax: r.atencao_max,
    };
  }
  return resolverFaixas(personalizadas);
}

export async function listReadings(
  supabase: Client,
  { desde, contexto, limit = 500 }: { desde?: Date; contexto?: Contexto; limit?: number } = {},
): Promise<{ readings: Reading[]; error: boolean }> {
  let query = supabase
    .from("glucose_readings")
    .select(READING_COLUMNS)
    .order("medido_em", { ascending: false })
    .limit(limit);
  if (desde) query = query.gte("medido_em", desde.toISOString());
  if (contexto) query = query.eq("contexto", contexto);

  const { data, error } = await query;
  return { readings: data ?? [], error: Boolean(error) };
}

export async function getReading(supabase: Client, id: string): Promise<Reading | null> {
  const { data } = await supabase
    .from("glucose_readings")
    .select(READING_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return data;
}
