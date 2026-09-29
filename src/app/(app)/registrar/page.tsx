import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { NewReadingForm } from "@/components/reading-form";
import { getFaixasUsuario } from "@/lib/data/glucose";
import { toLocalInput } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Registrar" };

export default async function RegistrarPage() {
  const supabase = await createClient();
  const faixas = await getFaixasUsuario(supabase);

  return (
    <>
      <PageHeader title="Registrar glicemia" />
      <NewReadingForm faixas={faixas} defaults={{ medidoEm: toLocalInput(new Date()) }} />
    </>
  );
}
