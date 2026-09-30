import { TOM_CLASSES } from "@/components/glucose-badge";
import { formatDateTime } from "@/lib/format";
import { CONTEXTO_LABEL } from "@/lib/glucose/ranges";
import type { Tom } from "@/lib/glucose/classify";
import type { Grupo, ResumoGlicemia } from "@/lib/stats";
import { cn } from "@/lib/utils";

export function StatTile({
  label,
  value,
  unit,
  detail,
}: {
  label: string;
  value: string;
  unit?: string;
  detail?: string;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border p-4">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-3xl font-semibold">
        {value}
        {unit && <span className="ml-1 text-base font-normal text-muted-foreground">{unit}</span>}
      </span>
      {detail && <span className="text-sm text-muted-foreground">{detail}</span>}
    </div>
  );
}

const GRUPOS: { grupo: Grupo; label: string; tom: Tom }[] = [
  { grupo: "baixa", label: "Baixa", tom: "glu-low" },
  { grupo: "normal", label: "Normal", tom: "glu-normal" },
  { grupo: "atencao", label: "Atenção", tom: "glu-attention" },
  { grupo: "alta", label: "Alta", tom: "glu-high" },
];

/** Barra empilhada com a proporção de medições por classificação, com legenda em texto. */
export function DistributionBar({ resumo }: { resumo: ResumoGlicemia }) {
  const presentes = GRUPOS.filter((g) => resumo.distribuicao[g.grupo] > 0);
  const pct = (n: number) => Math.round((n / resumo.total) * 100);

  return (
    <div>
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
        {presentes.map((g) => (
          <div
            key={g.grupo}
            className={cn("h-full first:rounded-l-full last:rounded-r-full", TOM_CLASSES[g.tom].solid)}
            style={{ flexGrow: resumo.distribuicao[g.grupo] }}
          />
        ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-base sm:grid-cols-4">
        {GRUPOS.map((g) => {
          const n = resumo.distribuicao[g.grupo];
          return (
            <li key={g.grupo} className="flex items-center gap-2">
              <span className={cn("size-3 shrink-0 rounded-full", TOM_CLASSES[g.tom].solid)} aria-hidden />
              <span>
                {g.label}: <strong className="tabular-nums">{n}</strong>
                <span className="text-muted-foreground"> ({pct(n)}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ContextAverages({ resumo }: { resumo: ResumoGlicemia }) {
  return (
    <div className="overflow-x-auto rounded-xl border">
      <table className="w-full text-base">
        <caption className="sr-only">Média de glicemia por momento da medição</caption>
        <thead className="bg-muted/60 text-sm">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-semibold">Momento</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Medições</th>
            <th scope="col" className="px-3 py-2 text-right font-semibold">Média</th>
          </tr>
        </thead>
        <tbody>
          {resumo.porContexto.map((p) => (
            <tr key={p.contexto} className="border-t">
              <th scope="row" className="px-3 py-2 text-left font-medium">{CONTEXTO_LABEL[p.contexto]}</th>
              <td className="px-3 py-2 text-right tabular-nums">{p.n}</td>
              <td className="px-3 py-2 text-right whitespace-nowrap tabular-nums">{p.media} mg/dL</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function extremoDetalhe(e: ResumoGlicemia["minimo"]) {
  return e ? `${CONTEXTO_LABEL[e.contexto]} · ${formatDateTime(new Date(e.em))}` : undefined;
}
