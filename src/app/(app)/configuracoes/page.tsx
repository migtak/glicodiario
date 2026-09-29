import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/page-header";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";

export const metadata: Metadata = { title: "Ajustes" };

export default function ConfiguracoesPage() {
  return (
    <>
      <PageHeader title="Ajustes" />
      <ComingSoon phase={7}>
        Faixas de referência, exportação dos dados em CSV e exclusão da conta.
      </ComingSoon>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Sobre o GlicoDiário</h2>
        <p className="text-base leading-relaxed">{DISCLAIMER_TEXT}</p>
      </section>
    </>
  );
}
