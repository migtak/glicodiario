"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { CloudOff, TriangleAlert } from "lucide-react";
import { saveReading, type SaveReadingState } from "@/app/(app)/glicemia-actions";
import { useFilaOffline } from "@/components/offline-provider";
import { criarOuEnfileirar, editarComRede } from "@/lib/offline/salvar";
import { FormMessage } from "@/components/form-ui";
import { choiceClass } from "@/components/record-forms";
import { GlucoseBadge, TOM_CLASSES } from "@/components/glucose-badge";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatDateTime, toLocalInput } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import {
  CONTEXTOS,
  CONTEXTO_LABEL,
  VALOR_MAX,
  VALOR_MIN,
  isContexto,
  type Contexto,
  type Faixa,
} from "@/lib/glucose/ranges";
import { cn } from "@/lib/utils";

type Defaults = {
  id?: string;
  valor?: number;
  contexto?: Contexto;
  /** formato datetime-local, no fuso do app */
  medidoEm: string;
  observacao?: string | null;
  mealId?: string | null;
};

/** Refeição que pode ser vinculada a uma medição pós-refeição. */
export type MealOption = { id: string; descricao: string; ocorreuEm: string };

type Props = { faixas: Record<Contexto, Faixa>; defaults: Defaults; meals: MealOption[] };

/**
 * Formulário de nova medição. Depois de salvar mostra o resultado e permite
 * registrar outra (a `key` remonta o formulário do zero).
 */
export function NewReadingForm(props: Props) {
  const [round, setRound] = useState(0);
  // a partir da 2ª medição, a hora padrão é a do momento em que o formulário reabre
  const defaults = round === 0 ? props.defaults : { medidoEm: toLocalInput(new Date()) };
  return (
    <ReadingForm
      key={round}
      faixas={props.faixas}
      meals={props.meals}
      defaults={defaults}
      onNew={() => setRound((r) => r + 1)}
    />
  );
}

/** Usado também na edição (com `defaults.id`). */
export function ReadingForm({ faixas, defaults, meals, onNew }: Props & { onNew?: () => void }) {
  const { userId } = useFilaOffline();
  const [state, action, pending] = useActionState(
    (prev: SaveReadingState, formData: FormData): Promise<SaveReadingState> =>
      defaults.id
        ? editarComRede(saveReading, prev, formData, (error) => ({ error }))
        : criarOuEnfileirar(saveReading, prev, formData, {
            userId,
            tipo: "glicemia",
            erro: (error) => ({ error }),
            aoEnfileirar: (row) => ({
              saved: { valor: Number(row.valor_mg_dl), contexto: row.contexto as Contexto },
              offline: true,
            }),
          }),
    undefined,
  );
  const [valor, setValor] = useState(defaults.valor?.toString() ?? "");
  const [contexto, setContexto] = useState<Contexto | undefined>(defaults.contexto);
  const [confirmando, setConfirmando] = useState(false);
  const confirmado = useRef<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  if (state?.saved) {
    return <Resultado {...state.saved} offline={state.offline} faixa={faixas[state.saved.contexto]} onNew={onNew} />;
  }

  const numero = Number(valor);
  const classificacao =
    contexto && Number.isInteger(numero) && numero >= VALOR_MIN && numero <= VALOR_MAX
      ? classificar(numero, contexto, faixas[contexto])
      : null;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    // valores de risco pedem confirmação, para evitar erro de digitação
    if (classificacao?.alerta && confirmado.current !== valor) {
      e.preventDefault();
      setConfirmando(true);
    }
  }

  function confirmar() {
    confirmado.current = valor;
    setConfirmando(false);
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} action={action} onSubmit={onSubmit} className="flex flex-col gap-6">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}

      <div className="flex flex-col gap-2">
        <label htmlFor="valor" className="text-base font-medium">
          Valor do glicosímetro
        </label>
        <div className="flex items-baseline gap-3">
          <input
            id="valor"
            name="valor"
            type="number"
            inputMode="numeric"
            min={VALOR_MIN}
            max={VALOR_MAX}
            step={1}
            required
            autoFocus={!defaults.id}
            value={valor}
            onChange={(e) => {
              setValor(e.target.value);
              setConfirmando(false);
            }}
            placeholder="000"
            className="h-16 w-40 rounded-lg border border-input bg-transparent px-3 text-4xl font-semibold tabular-nums outline-none placeholder:text-muted-foreground/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="text-lg text-muted-foreground">mg/dL</span>
        </div>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Momento da medição</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CONTEXTOS.map((c) => (
            <label key={c} className={choiceClass}>
              <input
                type="radio"
                name="contexto"
                value={c}
                required
                checked={contexto === c}
                onChange={(e) => {
                  if (isContexto(e.target.value)) setContexto(e.target.value);
                  setConfirmando(false);
                }}
                className="sr-only"
              />
              {CONTEXTO_LABEL[c]}
            </label>
          ))}
        </div>
      </fieldset>

      {(contexto === "pos_1h" || contexto === "pos_2h") && (
        <MealSelect meals={meals} defaultValue={defaults.mealId ?? ""} />
      )}

      <div className="flex flex-col gap-2">
        <label htmlFor="medido_em" className="text-base font-medium">
          Data e hora
        </label>
        <input
          id="medido_em"
          name="medido_em"
          type="datetime-local"
          required
          defaultValue={defaults.medidoEm}
          className="h-12 w-full max-w-xs rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="observacao" className="text-base font-medium">
          Observação <span className="font-normal text-muted-foreground">(opcional)</span>
        </label>
        <textarea
          id="observacao"
          name="observacao"
          maxLength={500}
          rows={2}
          defaultValue={defaults.observacao ?? ""}
          placeholder="Ex.: depois do almoço de domingo"
          className="rounded-lg border border-input bg-transparent px-3 py-2 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {confirmando && classificacao && (
        <div role="alert" className="rounded-lg border-2 border-glu-high bg-glu-high/10 p-4">
          <p className="flex items-center gap-2 text-base font-semibold text-glu-high">
            <TriangleAlert className="size-5" aria-hidden />
            Confirme o valor: {valor} mg/dL
          </p>
          <p className="mt-1 text-base">
            Esse valor está numa faixa de risco ({classificacao.rotulo.toLowerCase()}). Está correto?
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={confirmar} className="h-12 px-5 text-base">
              Sim, salvar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 px-5 text-base"
              onClick={() => {
                setConfirmando(false);
                document.getElementById("valor")?.focus();
              }}
            >
              Corrigir
            </Button>
          </div>
        </div>
      )}

      <FormMessage error={state?.error} />
      {!confirmando && (
        <SubmitButton pending={pending} className="sm:w-auto sm:px-10">
          {defaults.id ? "Salvar alterações" : "Salvar"}
        </SubmitButton>
      )}
    </form>
  );
}

function Resultado({
  valor,
  contexto,
  faixa,
  offline,
  onNew,
}: {
  valor: number;
  contexto: Contexto;
  faixa: Faixa;
  offline?: boolean;
  onNew?: () => void;
}) {
  const c = classificar(valor, contexto, faixa);
  const tom = TOM_CLASSES[c.tom];

  return (
    <div className="flex flex-col gap-6">
      <div
        role={c.alerta ? "alert" : "status"}
        className={cn("rounded-xl border-2 p-5", tom.border, tom.bg)}
      >
        <p className="text-base text-muted-foreground">
          {offline ? "Medição guardada neste aparelho" : "Medição salva"} · {CONTEXTO_LABEL[contexto]}
        </p>
        <p className="mt-1 flex flex-wrap items-center gap-3">
          <span className={cn("text-5xl font-semibold tabular-nums", tom.text)}>{valor}</span>
          <span className="text-lg text-muted-foreground">mg/dL</span>
          <GlucoseBadge classificacao={c} className="text-base" />
        </p>
        <p className={cn("mt-3 text-base leading-relaxed", c.alerta && "font-medium")}>{c.mensagem}</p>
        {offline && (
          <p className="mt-3 flex items-start gap-2 border-t pt-3 text-base">
            <CloudOff className="mt-0.5 size-5 shrink-0" aria-hidden />
            Sem internet agora: ela será enviada sozinha quando a conexão voltar.
          </p>
        )}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onNew} className="h-12 px-6 text-base">
          Registrar outra
        </Button>
        <Link href="/historico" className={cn(buttonVariants({ variant: "outline" }), "h-12 px-6 text-base")}>
          Ver histórico
        </Link>
      </div>
    </div>
  );
}

function MealSelect({ meals, defaultValue }: { meals: MealOption[]; defaultValue: string }) {
  if (meals.length === 0) {
    return (
      <p className="rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">
        Dica: registre a refeição na aba “Refeição” para poder ligá-la a esta medição.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor="meal_id" className="text-base font-medium">
        Após qual refeição? <span className="font-normal text-muted-foreground">(opcional)</span>
      </label>
      <select
        id="meal_id"
        name="meal_id"
        defaultValue={defaultValue}
        className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <option value="">Nenhuma</option>
        {meals.map((m) => (
          <option key={m.id} value={m.id}>
            {formatDateTime(new Date(m.ocorreuEm))} · {m.descricao.length > 40 ? m.descricao.slice(0, 40) + "…" : m.descricao}
          </option>
        ))}
      </select>
    </div>
  );
}
