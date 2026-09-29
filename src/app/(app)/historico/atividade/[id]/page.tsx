import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EditPageShell, UUID_RE } from "@/components/edit-page-shell";
import { ActivityForm } from "@/components/record-forms";
import { getActivity } from "@/lib/data/records";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar atividade" };

export default async function EditarAtividadePage({ params }: PageProps<"/historico/atividade/[id]">) {
  const { id } = await params;
  if (!UUID_RE.test(id)) notFound();
  const activity = await getActivity(await createClient(), id);
  if (!activity) notFound();

  return (
    <EditPageShell title="Editar atividade" tipo="atividade" id={activity.id}>
      <ActivityForm
        activity={{
          id: activity.id,
          tipo: activity.tipo,
          duracaoMin: activity.duracao_min,
          quando: toLocalInput(new Date(activity.ocorreu_em)),
        }}
      />
    </EditPageShell>
  );
}
