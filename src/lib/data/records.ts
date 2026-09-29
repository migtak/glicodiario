import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Activity, Database, Meal, Weight } from "@/lib/database.types";

type Client = SupabaseClient<Database>;

export type MealItem = Pick<Meal, "id" | "descricao" | "ocorreu_em">;
export type ActivityItem = Pick<Activity, "id" | "tipo" | "duracao_min" | "ocorreu_em">;
export type WeightItem = Pick<Weight, "id" | "peso_kg" | "medido_em">;

type Range = { desde?: Date; ate?: Date; limit?: number };

export async function listMeals(supabase: Client, { desde, ate, limit = 500 }: Range = {}) {
  let q = supabase
    .from("meals")
    .select("id, descricao, ocorreu_em")
    .order("ocorreu_em", { ascending: false })
    .limit(limit);
  if (desde) q = q.gte("ocorreu_em", desde.toISOString());
  if (ate) q = q.lte("ocorreu_em", ate.toISOString());
  const { data, error } = await q;
  return { items: (data ?? []) as MealItem[], error: Boolean(error) };
}

export async function listActivities(supabase: Client, { desde, limit = 500 }: Range = {}) {
  let q = supabase
    .from("activities")
    .select("id, tipo, duracao_min, ocorreu_em")
    .order("ocorreu_em", { ascending: false })
    .limit(limit);
  if (desde) q = q.gte("ocorreu_em", desde.toISOString());
  const { data, error } = await q;
  return { items: (data ?? []) as ActivityItem[], error: Boolean(error) };
}

export async function listWeights(supabase: Client, { desde, limit = 500 }: Range = {}) {
  let q = supabase
    .from("weights")
    .select("id, peso_kg, medido_em")
    .order("medido_em", { ascending: false })
    .limit(limit);
  if (desde) q = q.gte("medido_em", desde.toISOString());
  const { data, error } = await q;
  // numeric do Postgres pode chegar como texto
  const items = (data ?? []).map((w) => ({ ...w, peso_kg: Number(w.peso_kg) })) as WeightItem[];
  return { items, error: Boolean(error) };
}

export async function getMeal(supabase: Client, id: string) {
  const { data } = await supabase.from("meals").select("id, descricao, ocorreu_em").eq("id", id).maybeSingle();
  return data as MealItem | null;
}

export async function getActivity(supabase: Client, id: string) {
  const { data } = await supabase
    .from("activities")
    .select("id, tipo, duracao_min, ocorreu_em")
    .eq("id", id)
    .maybeSingle();
  return data as ActivityItem | null;
}

export async function getWeight(supabase: Client, id: string) {
  const { data } = await supabase.from("weights").select("id, peso_kg, medido_em").eq("id", id).maybeSingle();
  return data ? ({ ...data, peso_kg: Number(data.peso_kg) } as WeightItem) : null;
}

/** Refeições das 24h anteriores a `ref`, candidatas a vínculo com uma medição pós-refeição. */
export async function mealsBefore(supabase: Client, ref: Date) {
  const { items } = await listMeals(supabase, {
    desde: new Date(ref.getTime() - 24 * 3_600_000),
    ate: new Date(ref.getTime() + 5 * 60_000),
    limit: 20,
  });
  return items;
}
