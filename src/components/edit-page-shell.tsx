import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DeleteRecordButton } from "@/components/delete-record-button";
import { PageHeader } from "@/components/page-header";
import type { TipoRegistro } from "@/lib/records";

export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Moldura das telas de edição: voltar, título, formulário e botão de excluir. */
export function EditPageShell({
  title,
  tipo,
  id,
  children,
}: {
  title: string;
  tipo: TipoRegistro;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Link
        href="/historico"
        className="mb-4 inline-flex min-h-11 items-center gap-2 text-base text-primary hover:underline"
      >
        <ArrowLeft className="size-5" aria-hidden />
        Voltar ao histórico
      </Link>
      <PageHeader title={title} />
      {children}
      <div className="mt-10 border-t pt-6">
        <DeleteRecordButton tipo={tipo} id={id} />
      </div>
    </>
  );
}
