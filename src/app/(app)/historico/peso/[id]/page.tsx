import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditPageShell, UUID_RE } from "@/components/edit-page-shell";
import { WeightForm } from "@/components/record-forms";
import { getWeight } from "@/lib/data/records";
import { toLocalInput } from "@/lib/format";
import { pesoParaCampo } from "@/lib/records";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar peso" };

export default async function EditarPesoPage({ params }: PageProps<"/historico/peso/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const weight = await getWeight(await createClient(), id);
  if (!weight) notFound();

  return (
    <EditPageShell title="Editar peso" tipo="peso" id={weight.id}>
      <WeightForm
        weight={{
          id: weight.id,
          pesoKg: pesoParaCampo(weight.peso_kg),
          quando: toLocalInput(new Date(weight.medido_em)),
        }}
      />
    </EditPageShell>
  );
}
