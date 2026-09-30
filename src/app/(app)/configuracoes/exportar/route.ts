import { gerarCsv } from "@/lib/csv";
import { getFaixasUsuario, listReadings } from "@/lib/data/glucose";
import { listActivities, listMeals, listWeights } from "@/lib/data/records";
import { dayKey } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

const TUDO = 100_000;

/** Baixa todos os dados do usuário em CSV (o proxy garante que está logado). */
export async function GET() {
  const supabase = await createClient();
  const [faixas, glicemias, refeicoes, atividades, pesos] = await Promise.all([
    getFaixasUsuario(supabase),
    listReadings(supabase, { limit: TUDO }),
    listMeals(supabase, { limit: TUDO }),
    listActivities(supabase, { limit: TUDO }),
    listWeights(supabase, { limit: TUDO }),
  ]);

  if (glicemias.error || refeicoes.error || atividades.error || pesos.error) {
    return new Response("Não foi possível gerar o arquivo. Tente de novo em instantes.", {
      status: 503,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  const csv = gerarCsv(
    {
      glicemias: glicemias.readings,
      refeicoes: refeicoes.items,
      atividades: atividades.items,
      pesos: pesos.items,
    },
    faixas,
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="glicodiario-${dayKey(new Date())}.csv"`,
      "Cache-Control": "private, no-store",
    },
  });
}
