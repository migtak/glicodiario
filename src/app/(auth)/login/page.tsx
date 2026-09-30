import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

const NOTICES: Record<string, { texto: string; tipo: "error" | "success" }> = {
  "conta-excluida": { texto: "Sua conta e todos os seus dados foram excluídos.", tipo: "success" },
  "conta-indisponivel": { tipo: "error", texto: "Esta conta não existe mais, por isso sua sessão foi encerrada. Entre com outra conta ou crie uma nova." },
  "sessao-encerrada": { tipo: "error", texto: "Sua sessão foi encerrada (por exemplo, a conta foi excluída ou você saiu em outro aparelho). Entre novamente para continuar." },
  link: { tipo: "error", texto: "Não foi possível abrir o link: ele pode ter expirado ou sido aberto em outro navegador. Se você acabou de confirmar seu e-mail, é só entrar com sua senha." },
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
