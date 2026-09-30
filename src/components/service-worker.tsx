"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (só na versão publicada: no modo de desenvolvimento
 * os arquivos mudam o tempo todo e o cache atrapalharia).
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // sem service worker o app continua funcionando online
    });
  }, []);
  return null;
}

/** Pede ao service worker para apagar as páginas guardadas (dados de saúde) deste aparelho. */
export function limparPaginasGuardadas() {
  navigator.serviceWorker?.controller?.postMessage({ type: "limpar-dados" });
}

/** Colocado nas telas de quem não está logado: garante que nada da conta anterior fique guardado. */
export function LimparAoSair() {
  useEffect(() => limparPaginasGuardadas(), []);
  return null;
}
