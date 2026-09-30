"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { authErrorMessage } from "@/lib/auth-errors";

export type FormState = { error?: string; success?: string } | undefined;

const MIN_PASSWORD = 8;

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

async function siteOrigin() {
  const h = await headers();
  return h.get("origin") ?? `https://${h.get("host")}`;
}

export async function login(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email");
  const password = formData.get("senha");
  if (!email || typeof password !== "string" || !password) {
    return { error: "Preencha e-mail e senha." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: authErrorMessage(error) };

  redirect("/inicio");
}

export async function signup(_: FormState, formData: FormData): Promise<FormState> {
  const nome = field(formData, "nome");
  const email = field(formData, "email");
  const password = formData.get("senha");
  const confirm = formData.get("confirmar");

  if (!email || typeof password !== "string") return { error: "Preencha e-mail e senha." };
  if (password.length < MIN_PASSWORD) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
  }
  if (password !== confirm) return { error: "As senhas não conferem." };
  if (formData.get("aviso") !== "on") {
    return { error: "Para continuar, confirme que leu o aviso sobre uso médico." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nome, aviso_aceito: true },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=/inicio`,
    },
  });
  if (error) return { error: authErrorMessage(error) };

  // Se a confirmação de e-mail estiver desligada no Supabase, a sessão já vem pronta.
  if (data.session) redirect("/inicio");

  return {
    success: `Quase lá! Enviamos um link de confirmação para ${email}. Abra o e-mail (confira também o spam) e clique no link para ativar sua conta.`,
  };
}

export async function requestPasswordReset(_: FormState, formData: FormData): Promise<FormState> {
  const email = field(formData, "email");
  if (!email) return { error: "Informe seu e-mail." };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/redefinir-senha`,
  });
  if (error?.code === "over_email_send_rate_limit") return { error: authErrorMessage(error) };

  // Mesma mensagem exista ou não a conta, para não revelar quais e-mails estão cadastrados.
  return {
    success: "Se houver uma conta com esse e-mail, você vai receber um link para criar uma nova senha.",
  };
}

export async function updatePassword(_: FormState, formData: FormData): Promise<FormState> {
  const password = formData.get("senha");
  const confirm = formData.get("confirmar");
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    return { error: `A senha precisa ter pelo menos ${MIN_PASSWORD} caracteres.` };
  }
  if (password !== confirm) return { error: "As senhas não conferem." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: authErrorMessage(error) };

  redirect("/inicio");
}

export async function logout() {
  const supabase = await createClient();
  // "local": sai só deste aparelho (o padrão da biblioteca derrubaria todos os aparelhos da conta)
  await supabase.auth.signOut({ scope: "local" });
  redirect("/login");
}
