"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

type InstallPromptEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

const noop = () => () => {};
const jaInstalado = () =>
  window.matchMedia("(display-mode: standalone)").matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/**
 * Instruções de instalação. No Android/Chrome e no computador, mostra também um
 * botão de instalar (o evento `beforeinstallprompt` não existe no iPhone).
 */
export function InstallApp() {
  const instalado = useSyncExternalStore(noop, jaInstalado, () => false);
  const [evento, setEvento] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const guardar = (e: Event) => {
      e.preventDefault();
      setEvento(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", guardar);
    return () => window.removeEventListener("beforeinstallprompt", guardar);
  }, []);

  if (instalado) {
    return <p className="text-base text-muted-foreground">O GlicoDiário já está instalado neste aparelho.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {evento && (
        <Button
          type="button"
          className="h-12 gap-2 self-start px-5 text-base"
          onClick={async () => {
            await evento.prompt();
            await evento.userChoice;
            setEvento(null);
          }}
        >
          <Download className="size-5" aria-hidden />
          Instalar o app
        </Button>
      )}
      <ul className="flex flex-col gap-3 text-base">
        <li>
          <strong>Android (Chrome):</strong> toque no menu <span aria-label="três pontinhos">⋮</span> e escolha
          “Instalar app” ou “Adicionar à tela inicial”.
        </li>
        <li>
          <strong>iPhone (Safari):</strong> toque no botão Compartilhar (quadrado com seta para cima) e escolha
          “Adicionar à Tela de Início”.
        </li>
        <li>
          <strong>Computador (Chrome ou Edge):</strong> clique no ícone de instalar na barra de endereço.
        </li>
      </ul>
      <p className="text-sm text-muted-foreground">
        Instalado, o app abre como um aplicativo comum e funciona mesmo sem internet nas telas que você já abriu.
      </p>
    </div>
  );
}
