"use client";

import { useState, useTransition } from "react";
import { unstable_rethrow } from "next/navigation";
import { Trash2 } from "lucide-react";
import { deleteRecord } from "@/app/(app)/registros-actions";
import { FormMessage } from "@/components/form-ui";
import { Button } from "@/components/ui/button";
import { SEM_INTERNET_EDICAO } from "@/lib/offline/salvar";
import type { TipoRegistro } from "@/lib/records";

const LABEL: Record<TipoRegistro, string> = {
  glicemia: "esta medição",
  refeicao: "esta refeição",
  atividade: "esta atividade",
  peso: "este registro de peso",
};

/** Exclusão em dois passos, com a confirmação dentro da própria tela. */
export function DeleteRecordButton({ tipo, id }: { tipo: TipoRegistro; id: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();
  const [erro, setErro] = useState<string>();

  const excluir = () =>
    startTransition(async () => {
      if (!navigator.onLine) return setErro(SEM_INTERNET_EDICAO);
      try {
        await deleteRecord(tipo, id);
      } catch (e) {
        unstable_rethrow(e); // o redirecionamento após excluir não é erro
        setErro(SEM_INTERNET_EDICAO);
      }
    });

  if (!confirmando) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="h-12 gap-2 px-5 text-base"
        onClick={() => setConfirmando(true)}
      >
        <Trash2 className="size-5" aria-hidden />
        Excluir
      </Button>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <p className="text-base font-medium">Excluir {LABEL[tipo]}? Não dá para desfazer.</p>
      {erro && (
        <div className="mt-3">
          <FormMessage error={erro} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          className="h-12 bg-destructive px-5 text-base text-white hover:bg-destructive/90"
          onClick={excluir}
        >
          {pending ? "Excluindo…" : "Sim, excluir"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          className="h-12 px-5 text-base"
          onClick={() => setConfirmando(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
