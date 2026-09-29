import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditPageShell, UUID_RE } from "@/components/edit-page-shell";
import { MealForm } from "@/components/record-forms";
import { getMeal } from "@/lib/data/records";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar refeição" };

export default async function EditarRefeicaoPage({ params }: PageProps<"/historico/refeicao/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const meal = await getMeal(await createClient(), id);
  if (!meal) notFound();

  return (
    <EditPageShell title="Editar refeição" tipo="refeicao" id={meal.id}>
      <MealForm
        meal={{ id: meal.id, descricao: meal.descricao, quando: toLocalInput(new Date(meal.ocorreu_em)) }}
      />
    </EditPageShell>
  );
}
