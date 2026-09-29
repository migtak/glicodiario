import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditPageShell, UUID_RE } from "@/components/edit-page-shell";
import { ReadingForm } from "@/components/reading-form";
import { getFaixasUsuario, getReading } from "@/lib/data/glucose";
import { mealsBefore } from "@/lib/data/records";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar medição" };

export default async function EditarMedicaoPage({ params }: PageProps<"/historico/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();

  const supabase = await createClient();
  const [reading, faixas] = await Promise.all([getReading(supabase, id), getFaixasUsuario(supabase)]);
  if (!reading) notFound();
  const meals = await mealsBefore(supabase, new Date(reading.medido_em));

  return (
    <EditPageShell title="Editar medição" tipo="glicemia" id={reading.id}>
      <ReadingForm
        faixas={faixas}
        meals={meals.map((m) => ({ id: m.id, descricao: m.descricao, ocorreuEm: m.ocorreu_em }))}
        defaults={{
          id: reading.id,
          valor: reading.valor_mg_dl,
          contexto: reading.contexto,
          medidoEm: toLocalInput(new Date(reading.medido_em)),
          observacao: reading.observacao,
          mealId: reading.meal_id,
        }}
      />
    </EditPageShell>
  );
}
