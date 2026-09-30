"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CONTEXTOS,
  CONTEXTO_LABEL,
  FAIXAS_PADRAO,
  VALOR_MAX,
  VALOR_MIN,
  faixaValida,
  type Contexto,
  type Faixa,
} from "@/lib/glucose/ranges";
import { createClient } from "@/lib/supabase/server";

export type RangesState = { error?: string; success?: string } | undefined;

function igualAoPadrao(contexto: Contexto, f: Faixa) {
  const p = FAIXAS_PADRAO[contexto];
  return p.normalMin === f.normalMin && p.normalMax === f.normalMax && p.atencaoMax === f.atencaoMax;
}

/**
 * Salva as faixas personalizadas. Só guarda no banco os momentos que diferem
 * do padrão; os que voltaram ao padrão são apagados.
 */
export async function saveRanges(_: RangesState, formData: FormData): Promise<RangesState> {
  const faixas = {} as Record<Contexto, Faixa>;
  for (const c of CONTEXTOS) {
    const f = {
      normalMin: Number(formData.get(`${c}.normalMin`)),
      normalMax: Number(formData.get(`${c}.normalMax`)),
      atencaoMax: Number(formData.get(`${c}.atencaoMax`)),
    };
    if (!faixaValida(f)) {
      return {
        error: `${CONTEXTO_LABEL[c]}: use números inteiros entre ${VALOR_MIN} e ${VALOR_MAX}, com o início do normal menor que o fim, e o fim do normal menor que o limite de atenção.`,
      };
    }
    faixas[c] = f;
  }

  const personalizadas = CONTEXTOS.filter((c) => !igualAoPadrao(c, faixas[c]));
  const padrao = CONTEXTOS.filter((c) => igualAoPadrao(c, faixas[c]));

  const supabase = await createClient();
  if (padrao.length) {
    const { error } = await supabase.from("target_ranges").delete().in("contexto", padrao);
    if (error) return { error: "Não foi possível salvar. Verifique sua conexão e tente de novo." };
  }
  if (personalizadas.length) {
    const { error } = await supabase.from("target_ranges").upsert(
      personalizadas.map((c) => ({
        contexto: c,
        normal_min: faixas[c].normalMin,
        normal_max: faixas[c].normalMax,
        atencao_max: faixas[c].atencaoMax,
      })),
      { onConflict: "user_id,contexto" },
    );
    if (error) return { error: "Não foi possível salvar. Verifique sua conexão e tente de novo." };
  }

  revalidatePath("/", "layout");
  return {
    success: personalizadas.length
      ? `Faixas salvas. ${personalizadas.length} ${personalizadas.length === 1 ? "momento personalizado" : "momentos personalizados"}.`
      : "Faixas salvas. Todas seguem o padrão.",
  };
}

export async function deleteAccount(_: RangesState, formData: FormData): Promise<RangesState> {
  if (String(formData.get("confirmacao") ?? "").trim().toUpperCase() !== "EXCLUIR") {
    return { error: "Digite EXCLUIR para confirmar." };
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("delete_my_account");
  if (error) return { error: "Não foi possível excluir a conta. Tente de novo em instantes." };

  // o usuário já não existe: só limpa a sessão deste navegador
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login?aviso=conta-excluida");
}
