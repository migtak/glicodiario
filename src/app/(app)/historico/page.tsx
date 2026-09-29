import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Histórico" };

export default function HistoricoPage() {
  return (
    <>
      <PageHeader title="Histórico" />
      <ComingSoon phase={4}>Lista de todas as suas medições, com filtros por período.</ComingSoon>
    </>
  );
}
