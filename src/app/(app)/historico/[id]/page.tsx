import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { DeleteReadingButton } from "@/components/delete-reading-button";
import { PageHeader } from "@/components/page-header";
import { ReadingForm } from "@/components/reading-form";
import { getFaixasUsuario, getReading } from "@/lib/data/glucose";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Editar medição" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditarMedicaoPage({ params }: PageProps<"/historico/[id]">) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const [reading, faixas] = await Promise.all([getReading(supabase, id), getFaixasUsuario(supabase)]);
  if (!reading) notFound();

  return (
    <>
      <Link
        href="/historico"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-base text-primary hover:underline"
      >
        <ArrowLeft className="size-5" aria-hidden />
        Voltar ao histórico
      </Link>
      <PageHeader title="Editar medição" />
      <ReadingForm
        faixas={faixas}
        defaults={{
          id: reading.id,
          valor: reading.valor_mg_dl,
          contexto: reading.contexto,
          medidoEm: toLocalInput(new Date(reading.medido_em)),
          observacao: reading.observacao,
        }}
      />
      <div className="mt-10 border-t pt-6">
        <DeleteReadingButton id={reading.id} />
      </div>
    </>
  );
}
