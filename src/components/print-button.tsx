"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Abre a janela de impressão do navegador (onde também dá para "Salvar como PDF"). */
export function PrintButton() {
  return (
    <Button type="button" className="h-12 gap-2 px-6 text-base" onClick={() => window.print()}>
      <Printer className="size-5" aria-hidden />
      Imprimir ou salvar PDF
    </Button>
  );
}
