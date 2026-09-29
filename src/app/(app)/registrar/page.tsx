import type { Metadata } from "next";
import { ComingSoon, PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Registrar" };

export default function RegistrarPage() {
  return (
    <>
      <PageHeader title="Registrar glicemia" />
      <ComingSoon phase={4}>
        Aqui você vai informar o valor do glicosímetro e o momento da medição.
      </ComingSoon>
    </>
  );
}
