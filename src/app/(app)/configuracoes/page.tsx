import type { Metadata } from "next";
import { Download, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { DeleteAccount } from "@/components/delete-account";
import { InstallApp } from "@/components/install-app";
import { PageHeader } from "@/components/page-header";
import { RangesForm } from "@/components/ranges-form";
import { Button, buttonVariants } from "@/components/ui/button";
import { getFaixasUsuario } from "@/lib/data/glucose";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Ajustes" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const [{ data }, faixas] = await Promise.all([supabase.auth.getClaims(), getFaixasUsuario(supabase)]);
  const email = data?.claims.email;

  return (
    <>
      <PageHeader title="Ajustes" />

      <section aria-labelledby="conta-titulo" className="mb-10 rounded-xl border p-5">
        <h2 id="conta-titulo" className="mb-1 text-lg font-semibold">
          Sua conta
        </h2>
        {email && <p className="text-base text-muted-foreground">{email}</p>}
        <form action={logout} className="mt-4">
          <Button type="submit" variant="outline" className="h-12 gap-2 px-5 text-base">
            <LogOut className="size-5" aria-hidden />
            Sair
          </Button>
        </form>
      </section>

      <section aria-labelledby="instalar-titulo" className="mb-10">
        <h2 id="instalar-titulo" className="mb-3 text-lg font-semibold">
          Instalar no celular
        </h2>
        <InstallApp />
      </section>

      <section aria-labelledby="faixas-titulo" className="mb-10">
        <h2 id="faixas-titulo" className="mb-3 text-lg font-semibold">
          Faixas de referência
        </h2>
        <RangesForm faixas={faixas} />
      </section>

      <section aria-labelledby="dados-titulo" className="mb-10">
        <h2 id="dados-titulo" className="mb-1 text-lg font-semibold">
          Seus dados
        </h2>
        <p className="mb-3 text-base text-muted-foreground">
          Baixe todos os seus registros em uma planilha (CSV), que abre no Excel ou no Google Planilhas.
        </p>
        {/* link comum (não <Link>): é um download, não uma navegação */}
        <a
          href="/configuracoes/exportar"
          download
          className={cn(buttonVariants({ variant: "outline" }), "h-12 gap-2 px-5 text-base")}
        >
          <Download className="size-5" aria-hidden />
          Baixar meus dados (CSV)
        </a>

        <div className="mt-8 border-t pt-6">
          <h3 className="mb-1 text-base font-semibold">Excluir conta</h3>
          <p className="mb-3 text-base text-muted-foreground">
            Apaga sua conta e todos os seus registros de forma definitiva.
          </p>
          <DeleteAccount />
        </div>
      </section>

      <section aria-labelledby="sobre-titulo">
        <h2 id="sobre-titulo" className="mb-2 text-lg font-semibold">
          Sobre o GlicoDiário
        </h2>
        <p className="text-base leading-relaxed">{DISCLAIMER_TEXT}</p>
      </section>
    </>
  );
}
