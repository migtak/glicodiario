"use client";

import { useSyncExternalStore } from "react";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";

// Por enquanto o aceite fica no navegador; na Fase 2 passa a ser salvo no perfil do usuário.
const STORAGE_KEY = "glicodiario:aviso-aceito";
const listeners = new Set<() => void>();

function readAccepted(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function accept() {
  try {
    localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    // navegador sem armazenamento: o aviso volta a aparecer na próxima visita
  }
  listeners.forEach((l) => l());
}

/** Aviso médico obrigatório no primeiro acesso (PROJETO.md §2). */
export function MedicalDisclaimer() {
  // No servidor assume "aceito" para não piscar o aviso; o cliente corrige na hidratação.
  const accepted = useSyncExternalStore(subscribe, readAccepted, () => true);
  if (accepted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aviso-titulo"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
    >
      <div className="w-full max-w-md rounded-xl bg-background p-6 shadow-xl">
        <div className="mb-3 flex items-center gap-2 text-primary">
          <ShieldAlert className="size-7" aria-hidden />
          <h2 id="aviso-titulo" className="text-xl font-semibold">
            Antes de começar
          </h2>
        </div>
        <p className="text-base leading-relaxed">{DISCLAIMER_TEXT}</p>
        <p className="mt-3 text-sm text-muted-foreground">
          O GlicoDiário não faz diagnóstico nem recomenda tratamento.
        </p>
        <Button className="mt-6 h-12 w-full text-base" onClick={accept} autoFocus>
          Entendi
        </Button>
      </div>
    </div>
  );
}
