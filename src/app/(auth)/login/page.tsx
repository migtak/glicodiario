import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, string> = {
  link: "Não foi possível abrir o link: ele pode ter expirado ou sido aberto em outro navegador. Se você acabou de confirmar seu e-mail, é só entrar com sua senha.",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { aviso } = await searchParams;
  const notice = typeof aviso === "string" ? NOTICES[aviso] : undefined;

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Entrar</h1>
      <LoginForm notice={notice} />
    </>
  );
}
