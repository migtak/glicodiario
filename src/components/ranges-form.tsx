"use client";

import { useActionState, useState } from "react";
import { RotateCcw } from "lucide-react";
import { saveRanges } from "@/app/(app)/configuracoes/actions";
import { FormMessage } from "@/components/form-ui";
import { inputClass } from "@/components/record-forms";
import { SubmitButton } from "@/components/submit-button";
import { Button } from "@/components/ui/button";
import {
  CONTEXTOS,
  CONTEXTOS_OFICIAIS,
  CONTEXTO_LABEL,
  FAIXAS_PADRAO,
  LIMITES_SEGURANCA,
  VALOR_MAX,
  VALOR_MIN,
  type Contexto,
  type Faixa,
} from "@/lib/glucose/ranges";
import { cn } from "@/lib/utils";

type Campo = keyof Faixa;
type Valores = Record<Contexto, Record<Campo, string>>;

const paraTexto = (f: Faixa) => ({
  normalMin: String(f.normalMin),
  normalMax: String(f.normalMax),
  atencaoMax: String(f.atencaoMax),
});

const ehPadrao = (c: Contexto, v: Record<Campo, string>) => {
  const p = paraTexto(FAIXAS_PADRAO[c]);
  return v.normalMin === p.normalMin && v.normalMax === p.normalMax && v.atencaoMax === p.atencaoMax;
};

/** Editor das faixas de referência por momento (PROJETO.md §6.5). */
export function RangesForm({ faixas }: { faixas: Record<Contexto, Faixa> }) {
  const [state, action, pending] = useActionState(saveRanges, undefined);
  const [valores, setValores] = useState<Valores>(
    () => Object.fromEntries(CONTEXTOS.map((c) => [c, paraTexto(faixas[c])])) as Valores,
  );

  const set = (c: Contexto, campo: Campo, v: string) =>
    setValores((atual) => ({ ...atual, [c]: { ...atual[c], [campo]: v } }));
  const restaurar = (c: Contexto) => setValores((atual) => ({ ...atual, [c]: paraTexto(FAIXAS_PADRAO[c]) }));
  const todasPadrao = CONTEXTOS.every((c) => ehPadrao(c, valores[c]));

  return (
    <form action={action} className="flex flex-col gap-4">
      <p className="rounded-lg bg-muted/60 p-3 text-base">
        Altere só com orientação de um profissional de saúde. Independentemente das faixas, valores abaixo de{" "}
        {LIMITES_SEGURANCA.hipo} ou a partir de {LIMITES_SEGURANCA.muitoAlta} mg/dL sempre aparecem como alerta.
      </p>

      {CONTEXTOS.map((c) => {
        const v = valores[c];
        const padrao = ehPadrao(c, v);
        const n = (campo: Campo) => `${c}.${campo}`;
        const atencaoDe = Number(v.normalMax) + 1;
        const altaDe = Number(v.atencaoMax) + 1;
        return (
          <fieldset key={c} className="rounded-xl border p-4">
            <legend className="px-1 text-base font-semibold">
              {CONTEXTO_LABEL[c]}
              {!CONTEXTOS_OFICIAIS.includes(c) && (
                <span className="font-normal text-muted-foreground"> · padrão aproximado</span>
              )}
              <span className="font-normal text-muted-foreground"> (mg/dL)</span>
            </legend>
            <div className="grid max-w-md grid-cols-3 gap-3">
              <NumeroCampo id={n("normalMin")} label="Normal de" value={v.normalMin} onChange={(x) => set(c, "normalMin", x)} />
              <NumeroCampo id={n("normalMax")} label="até" value={v.normalMax} onChange={(x) => set(c, "normalMax", x)} />
              <NumeroCampo id={n("atencaoMax")} label="Atenção até" value={v.atencaoMax} onChange={(x) => set(c, "atencaoMax", x)} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {Number.isFinite(atencaoDe) && Number.isFinite(altaDe)
                ? `Atenção: ${atencaoDe} a ${v.atencaoMax} · Alta: a partir de ${altaDe} mg/dL`
                : " "}
            </p>
            <div className="mt-2 flex min-h-11 items-center justify-between gap-2">
              <span className={cn("text-sm", padrao ? "text-muted-foreground" : "font-medium text-primary")}>
                {padrao ? "Padrão" : "Personalizado"}
              </span>
              {!padrao && (
                <Button type="button" variant="ghost" className="h-11 gap-2 px-3 text-base" onClick={() => restaurar(c)}>
                  <RotateCcw className="size-4" aria-hidden />
                  Restaurar padrão
                </Button>
              )}
            </div>
          </fieldset>
        );
      })}

      <FormMessage error={state?.error} success={state?.success} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <SubmitButton pending={pending} className="sm:w-auto sm:px-10">
          Salvar faixas
        </SubmitButton>
        {!todasPadrao && (
          <Button
            type="button"
            variant="outline"
            className="h-12 px-6 text-base"
            onClick={() => CONTEXTOS.forEach(restaurar)}
          >
            Restaurar todas
          </Button>
        )}
      </div>
    </form>
  );
}

function NumeroCampo({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="number"
        inputMode="numeric"
        min={VALOR_MIN}
        max={VALOR_MAX}
        step={1}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputClass, "h-12 w-full min-w-0 text-lg tabular-nums")}
      />
    </div>
  );
}
