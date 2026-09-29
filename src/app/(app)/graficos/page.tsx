import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Gráficos" };

export default function GraficosPage() {
  return (
    <>
      <PageHeader title="Gráficos e resumo" />
      <ComingSoon phase={6}>Evolução da glicemia em 7, 30 e 90 dias, com médias e estatísticas.</ComingSoon>
    </>
  );
}
