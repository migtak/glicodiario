"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signup } from "../actions";
import { Field, FormMessage } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";

export default function CadastroPage() {
  const [state, action, pending] = useActionState(signup, undefined);

  if (state?.success) {
    return (
      <>
        <h1 className="mb-6 text-2xl font-semibold">Confirme seu e-mail</h1>
        <FormMessage success={state.success} />
        <Link href="/login" className="mt-6 block text-center text-base text-primary underline-offset-4 hover:underline">
          Voltar para o login
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Criar conta</h1>
      <form action={action} className="flex flex-col gap-5">
        <Field label="Seu nome" name="nome" autoComplete="given-name" maxLength={100} />
        <Field label="E-mail" name="email" type="email" autoComplete="email" required />
        <Field
          label="Senha"
          name="senha"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          hint="Mínimo de 8 caracteres."
        />
        <Field label="Repita a senha" name="confirmar" type="password" autoComplete="new-password" required />

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="text-sm leading-relaxed">{DISCLAIMER_TEXT}</p>
          <label className="mt-3 flex min-h-12 cursor-pointer items-center gap-3 text-base font-medium">
            <input type="checkbox" name="aviso" required className="size-5 accent-primary" />
            Li e entendi o aviso acima
          </label>
        </div>

        <FormMessage error={state?.error} />
        <SubmitButton pending={pending}>Criar conta</SubmitButton>
        <p className="text-center text-base">
          Já tem conta?{" "}
          <Link href="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Entrar
          </Link>
        </p>
      </form>
    </>
  );
}
