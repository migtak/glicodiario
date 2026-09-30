"use client";

import { useActionState, useState } from "react";
import { Trash2 } from "lucide-react";
import { deleteAccount } from "@/app/(app)/configuracoes/actions";
import { FormMessage } from "@/components/form-ui";
import { inputClass } from "@/components/record-forms";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** Exclusão da conta (LGPD), com confirmação digitada dentro da própria tela. */
export function DeleteAccount() {
  const [aberto, setAberto] = useState(false);
  const [state, action, pending] = useActionState(deleteAccount, undefined);

  if (!aberto) {
    return (
      <Button type="button" variant="destructive" className="h-12 gap-2 px-5 text-base" onClick={() => setAberto(true)}>
        <Trash2 className="size-5" aria-hidden />
        Excluir minha conta
      </Button>
    );
  }

  return (
    <form action={action} className="rounded-xl border-2 border-destructive/50 bg-destructive/5 p-4">
      <p className="text-base font-semibold">Excluir a conta e todos os dados?</p>
      <p className="mt-1 text-base">
        Todas as suas medições, refeições, atividades, pesos e faixas serão apagados para sempre. Se quiser guardar
        uma cópia, baixe o CSV antes.
      </p>
      <label htmlFor="confirmacao" className="mt-4 block text-base font-medium">
        Para confirmar, digite <strong>EXCLUIR</strong>
      </label>
      <input
        id="confirmacao"
        name="confirmacao"
        autoComplete="off"
        autoCapitalize="characters"
        required
        className={cn(inputClass, "mt-2 h-12 w-full max-w-xs")}
      />
      <div className="mt-3">
        <FormMessage error={state?.error} />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending}
          className="h-12 bg-destructive px-5 text-base text-white hover:bg-destructive/90"
        >
          {pending ? "Excluindo…" : "Excluir para sempre"}
        </Button>
        <Button type="button" variant="outline" disabled={pending} className="h-12 px-5 text-base" onClick={() => setAberto(false)}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}
