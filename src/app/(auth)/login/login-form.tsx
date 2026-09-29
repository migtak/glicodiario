"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";
import { Field, FormMessage } from "@/components/form-ui";
import { SubmitButton } from "@/components/submit-button";

export function LoginForm({ notice }: { notice?: string }) {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="flex flex-col gap-5">
      {notice && !state && <FormMessage error={notice} />}
      <Field label="E-mail" name="email" type="email" autoComplete="email" required />
      <Field label="Senha" name="senha" type="password" autoComplete="current-password" required />
      <FormMessage error={state?.error} />
      <SubmitButton pending={pending}>Entrar</SubmitButton>
      <div className="flex flex-col items-center gap-3 text-base">
        <Link href="/recuperar-senha" className="text-primary underline-offset-4 hover:underline">
          Esqueci minha senha
        </Link>
        <p>
          Não tem conta?{" "}
          <Link href="/cadastro" className="font-medium text-primary underline-offset-4 hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </form>
  );
}
