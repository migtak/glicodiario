"use client";

import { useActionState } from "react";
import { updatePassword } from "../actions";
import { Field, FormMessage } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";

/** Aberta pelo link de recuperação (o usuário já chega logado). */
export default function RedefinirSenhaPage() {
  const [state, action, pending] = useActionState(updatePassword, undefined);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Criar nova senha</h1>
      <form action={action} className="flex flex-col gap-5">
        <Field
          label="Nova senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint="Mínimo de 8 caracteres."
        />
        <Field label="Repita a nova senha" name="confirmar" type="password" autoComplete="new-password" required />
        <FormMessage error={state?.error} />
        <SubmitButton pending={pending}>Salvar nova senha</SubmitButton>
      </form>
    </>
  );
}
