import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { ComingSoon, PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Ajustes" };

export default async function ConfiguracoesPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims.email;

  return (
    <>
      <PageHeader title="Ajustes" />

      <section className="mb-8 rounded-xl border p-5">
        <h2 className="mb-1 text-lg font-semibold">Sua conta</h2>
        {email && <p className="text-base text-muted-foreground">{email}</p>}
        <form action={logout} className="mt-4">
          <Button type="submit" variant="outline" className="h-12 gap-2 px-5 text-base">
            <LogOut className="size-5" aria-hidden />
            Sair
          </Button>
        </form>
      </section>

      <ComingSoon phase={7}>
        Faixas de referência, exportação dos dados em CSV e exclusão da conta.
      </ComingSoon>

      <section className="mt-8">
        <h2 className="mb-2 text-lg font-semibold">Sobre o GlicoDiário</h2>
        <p className="text-base leading-relaxed">{DISCLAIMER_TEXT}</p>
      </section>
    </>
  );
}
