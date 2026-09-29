"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "../actions";
import { Field, FormMessage } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";

export default function RecuperarSenhaPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <>
      <h1 className="mb-2 text-2xl font-semibold">Recuperar senha</h1>
      <p className="mb-6 text-base text-muted-foreground">
        Informe seu e-mail e enviaremos um link para você criar uma nova senha.
      </p>
      <form action={action} className="flex flex-col gap-5">
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <FormMessage error={state?.error} success={state?.success} />
        <SubmitButton pending={pending}>Enviar link</SubmitButton>
        <Link href="/login" className="text-center text-base text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </form>
    </>
  );
}
