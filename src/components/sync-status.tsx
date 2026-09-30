"use client";

import { CloudOff, CloudUpload, TriangleAlert, X } from "lucide-react";
import { useFilaOffline } from "@/components/offline-provider";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import { CONTEXTO_LABEL, isContexto } from "@/lib/glucose/ranges";
import { descartar, type Pendente } from "@/lib/offline/queue";
import { formatDuracao, formatPeso, TIPO_REGISTRO_LABEL } from "@/lib/records";

function resumo(p: Pendente): string {
  const r = p.row;
  switch (p.tipo) {
    case "glicemia":
      return `${r.valor_mg_dl} mg/dL · ${isContexto(r.contexto) ? CONTEXTO_LABEL[r.contexto] : ""}`;
    case "refeicao":
      return String(r.descricao);
    case "atividade":
      return `${r.tipo} · ${formatDuracao(Number(r.duracao_min))}`;
    case "peso":
      return formatPeso(Number(r.peso_kg));
  }
}

const quando = (p: Pendente) => formatDateTime(new Date(String(p.row.medido_em ?? p.row.ocorreu_em)));

/** Faixa no topo das páginas logadas: sem internet e/ou registros aguardando envio. */
export function SyncStatus() {
  const { online, pendentes, enviando, enviarAgora } = useFilaOffline();
  if (online && pendentes.length === 0) return null;

  return (
    <div className="mb-6 flex flex-col gap-3 print:hidden">
      {!online && (
        <p role="status" className="flex items-start gap-2 rounded-lg border bg-muted p-3 text-base">
          <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden />
          <span>
            <strong>Você está sem internet.</strong> Os registros novos ficam guardados neste aparelho e são
            enviados sozinhos quando a conexão voltar.
          </span>
        </p>
      )}

      {pendentes.length > 0 && (
        <details className="rounded-lg border border-primary/40 bg-primary/5 p-3">
          <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 text-base">
            <CloudUpload className="size-5 shrink-0 text-primary" aria-hidden />
            <span className="flex-1">
              <strong>
                {pendentes.length} {pendentes.length === 1 ? "registro aguardando envio" : "registros aguardando envio"}
              </strong>
              <span className="text-muted-foreground"> · toque para ver</span>
            </span>
          </summary>
          <ul className="mt-2 divide-y rounded-md border bg-background">
            {pendentes.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-base">
                    <span className="font-medium">{TIPO_REGISTRO_LABEL[p.tipo]}:</span> {resumo(p)}
                  </span>
                  <span className="text-sm text-muted-foreground">{quando(p)}</span>
                  {p.erro && (
                    <span className="flex items-start gap-1 text-sm text-destructive">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                      Não foi aceito pelo servidor: {p.erro}
                    </span>
                  )}
                </span>
                {p.erro && (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-11 gap-1 px-3 text-sm"
                    onClick={() => void descartar(p.id)}
                    aria-label={`Descartar ${TIPO_REGISTRO_LABEL[p.tipo].toLowerCase()} de ${quando(p)}`}
                  >
                    <X className="size-4" aria-hidden />
                    Descartar
                  </Button>
                )}
              </li>
            ))}
          </ul>
          <Button
            type="button"
            className="mt-3 h-11 px-5 text-base"
            disabled={!online || enviando}
            onClick={() => void enviarAgora()}
          >
            {enviando ? "Enviando…" : online ? "Enviar agora" : "Aguardando internet"}
          </Button>
        </details>
      )}
    </div>
  );
}
