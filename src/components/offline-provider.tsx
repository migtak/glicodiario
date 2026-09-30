"use client";

import { createContext, useCallback, useContext, useEffect, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { observarPendentes, sincronizar, type Pendente } from "@/lib/offline/queue";

type Offline = {
  userId: string;
  online: boolean;
  pendentes: Pendente[];
  enviando: boolean;
  enviarAgora: () => Promise<void>;
};

const Ctx = createContext<Offline | null>(null);

export function useFilaOffline(): Offline {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useFilaOffline fora do OfflineProvider");
  return ctx;
}

function assinarConexao(cb: () => void) {
  window.addEventListener("online", cb);
  window.addEventListener("offline", cb);
  return () => {
    window.removeEventListener("online", cb);
    window.removeEventListener("offline", cb);
  };
}

const TENTAR_A_CADA_MS = 30_000;

/**
 * Estado da conexão e da fila offline para as páginas logadas. Envia os pendentes
 * ao abrir o app, quando a internet volta e periodicamente enquanto houver fila.
 */
export function OfflineProvider({ userId, children }: { userId: string; children: React.ReactNode }) {
  const router = useRouter();
  const online = useSyncExternalStore(assinarConexao, () => navigator.onLine, () => true);
  const [pendentes, setPendentes] = useState<Pendente[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => observarPendentes(userId, setPendentes), [userId]);

  const enviarAgora = useCallback(async () => {
    setEnviando(true);
    try {
      const r = await sincronizar(userId);
      // atualiza as listas vindas do servidor (histórico, gráficos…)
      if (r.enviados > 0) router.refresh();
    } finally {
      setEnviando(false);
    }
  }, [userId, router]);

  const temPendentes = pendentes.length > 0;
  useEffect(() => {
    if (!online || !temPendentes) return;
    // `void` + setTimeout 0: envia fora da renderização
    const primeiro = setTimeout(() => void enviarAgora(), 0);
    const intervalo = setInterval(() => void enviarAgora(), TENTAR_A_CADA_MS);
    return () => {
      clearTimeout(primeiro);
      clearInterval(intervalo);
    };
  }, [online, temPendentes, enviarAgora]);

  return <Ctx.Provider value={{ userId, online, pendentes, enviando, enviarAgora }}>{children}</Ctx.Provider>;
}
