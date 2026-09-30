import type { Metadata } from "next";
import { CloudOff, Droplet } from "lucide-react";

export const metadata: Metadata = { title: "Sem internet" };

/**
 * Mostrada pelo service worker quando não há internet e a página pedida
 * ainda não foi aberta neste aparelho. É pública e estática (fica guardada no aparelho).
 */
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10 text-center">
      <div className="mb-6 flex items-center gap-2 text-2xl font-semibold text-primary">
        <Droplet className="size-8" aria-hidden />
        GlicoDiário
      </div>
      <div className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm">
        <CloudOff className="mx-auto size-10 text-muted-foreground" aria-hidden />
        <h1 className="mt-3 text-2xl font-semibold">Sem internet</h1>
        <p className="mt-2 text-base leading-relaxed">
          Esta tela ainda não foi aberta neste aparelho, então não dá para mostrá-la sem conexão.
        </p>
        <p className="mt-2 text-base leading-relaxed">
          As telas que você já abriu antes, como <strong>Registrar</strong>, continuam funcionando. Os registros
          feitos sem internet ficam guardados e são enviados quando a conexão voltar.
        </p>
        {/* <a> comum: força o navegador a pedir a página de novo */}
        <a
          href="/registrar"
          className="mt-6 inline-flex h-12 items-center justify-center rounded-lg bg-primary px-6 text-base font-medium text-primary-foreground"
        >
          Ir para Registrar
        </a>
      </div>
    </main>
  );
}
