"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteReading } from "@/app/(app)/glicemia-actions";
import { Button } from "@/components/ui/button";

/** Exclusão em dois passos, com a confirmação dentro da própria tela. */
export function DeleteReadingButton({ id }: { id: string }) {
  const [confirmando, setConfirmando] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!confirmando) {
    return (
      <Button
        type="button"
        variant="destructive"
        className="h-12 gap-2 px-5 text-base"
        onClick={() => setConfirmando(true)}
      >
        <Trash2 className="size-5" aria-hidden />
        Excluir medição
      </Button>
    );
  }

  return (
    <div role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <p className="text-base font-medium">Excluir esta medição? Não dá para desfazer.</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={pending}
          className="h-12 bg-destructive px-5 text-base text-white hover:bg-destructive/90"
          onClick={() => startTransition(() => deleteReading(id))}
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
