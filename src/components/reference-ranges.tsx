import { TOM_CLASSES } from "@/components/glucose-badge";
import {
  CONTEXTO_LABEL,
  CONTEXTOS_OFICIAIS,
  LIMITES_SEGURANCA,
  resolverFaixas,
  type Contexto,
  type Faixa,
} from "@/lib/glucose/ranges";
import { cn } from "@/lib/utils";

/** Agrupa contextos com a mesma faixa para a tabela ficar curta. */
function agrupar(faixas: Record<Contexto, Faixa>) {
  const grupos: { contextos: Contexto[]; faixa: Faixa }[] = [];
  for (const [contexto, faixa] of Object.entries(faixas) as [Contexto, Faixa][]) {
    const igual = grupos.find(
      (g) =>
        g.faixa.normalMin === faixa.normalMin &&
        g.faixa.normalMax === faixa.normalMax &&
        g.faixa.atencaoMax === faixa.atencaoMax,
    );
    if (igual) igual.contextos.push(contexto);
    else grupos.push({ contextos: [contexto], faixa });
  }
  return grupos;
}

/** Tabela educativa "Como ler seus valores" (PROJETO.md §5). */
export function ReferenceRanges({ faixas = resolverFaixas() }: { faixas?: Record<Contexto, Faixa> }) {
  const grupos = agrupar(faixas);
  const aproximado = (cs: Contexto[]) => cs.some((c) => !CONTEXTOS_OFICIAIS.includes(c));
  const th = "px-3 py-2 text-left text-sm font-semibold";

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full text-base">
          <caption className="sr-only">Faixas de referência de glicemia em mg/dL</caption>
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className={th}>Momento</th>
              <th scope="col" className={cn(th, TOM_CLASSES["glu-normal"].text)}>Normal</th>
              <th scope="col" className={cn(th, TOM_CLASSES["glu-attention"].text)}>Atenção</th>
              <th scope="col" className={cn(th, TOM_CLASSES["glu-high"].text)}>Alta</th>
            </tr>
          </thead>
          <tbody>
            {grupos.map(({ contextos, faixa }) => (
              <tr key={contextos.join()} className="border-t">
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  {contextos.map((c) => CONTEXTO_LABEL[c]).join(", ")}
                  {aproximado(contextos) && <span aria-label=" (valor aproximado)">*</span>}
                </th>
                <td className="px-3 py-2 tabular-nums">
                  {faixa.normalMin}–{faixa.normalMax}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {faixa.normalMax + 1}–{faixa.atencaoMax}
                </td>
                <td className="px-3 py-2 tabular-nums">≥ {faixa.atencaoMax + 1}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="mt-3 space-y-1 text-sm">
        <li className={TOM_CLASSES["glu-low"].text}>
          <strong>Abaixo de {LIMITES_SEGURANCA.hipo} mg/dL:</strong> glicemia baixa (hipoglicemia), em qualquer momento.
        </li>
        <li className={TOM_CLASSES["glu-high"].text}>
          <strong>A partir de {LIMITES_SEGURANCA.muitoAlta} mg/dL:</strong> muito alta. Procure atendimento médico.
        </li>
        <li className="text-muted-foreground">
          * Sem critério oficial: é uma aproximação informativa. Valores em mg/dL, segundo a SBD e a ADA.
        </li>
      </ul>
    </div>
  );
}
