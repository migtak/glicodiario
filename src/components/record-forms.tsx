"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  saveActivity,
  saveMeal,
  saveWeight,
  type SaveRecordState,
} from "@/app/(app)/registros-actions";
import { FormMessage } from "@/components/form-ui";
import { useFilaOffline } from "@/components/offline-provider";
import { criarOuEnfileirar, editarComRede } from "@/lib/offline/salvar";
import { SubmitButton } from "@/components/submit-button";
import { Button, buttonVariants } from "@/components/ui/button";
import { toLocalInput } from "@/lib/format";
import {
  ATIVIDADES_COMUNS,
  DESCRICAO_MAX,
  DURACAO_MAX,
  DURACAO_MIN,
  TIPO_ATIVIDADE_MAX,
  formatDuracao,
  formatPeso,
  type TipoRegistro,
} from "@/lib/records";
import { cn } from "@/lib/utils";

export const inputClass =
  "rounded-lg border border-input bg-transparent px-3 text-base outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export const choiceClass =
  "flex min-h-14 cursor-pointer items-center justify-center rounded-lg border-2 px-3 text-center text-base font-medium transition-colors hover:bg-muted has-[:checked]:border-primary has-[:checked]:hover:bg-primary/90 has-[:checked]:bg-primary has-[:checked]:text-primary-foreground has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-ring/50";

type Action = (state: SaveRecordState, formData: FormData) => Promise<SaveRecordState>;
type TipoComplementar = Exclude<TipoRegistro, "glicemia">;

/** Resumo mostrado quando o registro fica guardado no aparelho (sem internet). */
function resumoOffline(tipo: TipoComplementar, row: Record<string, unknown>): string {
  const inicio = {
    refeicao: `Refeição: ${row.descricao}`,
    atividade: `Atividade: ${row.tipo}, ${formatDuracao(Number(row.duracao_min))}`,
    peso: `Peso: ${formatPeso(Number(row.peso_kg))}`,
  }[tipo];
  return `${inicio}. Guardado neste aparelho: será enviado sozinho quando a internet voltar.`;
}

/**
 * Estrutura comum: envia o formulário, mostra erro, e depois de uma criação
 * mostra o resumo com "Registrar outro" (a `key` remonta tudo do zero).
 */
function RecordForm({
  action,
  tipo,
  id,
  quando,
  quandoLabel,
  children,
}: {
  action: Action;
  tipo: TipoComplementar;
  id?: string;
  quando?: string;
  quandoLabel: string;
  children: React.ReactNode;
}) {
  const [round, setRound] = useState(0);
  return (
    <RecordFormInner
      key={round}
      action={action}
      tipo={tipo}
      id={id}
      // a partir do 2º registro, a hora padrão é a do momento em que o formulário reabre
      quando={round === 0 && quando ? quando : toLocalInput(new Date())}
      quandoLabel={quandoLabel}
      onNew={() => setRound((r) => r + 1)}
    >
      {children}
    </RecordFormInner>
  );
}

function RecordFormInner({
  action,
  tipo,
  id,
  quando,
  quandoLabel,
  onNew,
  children,
}: {
  action: Action;
  tipo: TipoComplementar;
  id?: string;
  quando: string;
  quandoLabel: string;
  onNew: () => void;
  children: React.ReactNode;
}) {
  const { userId } = useFilaOffline();
  const [state, formAction, pending] = useActionState(
    (prev: SaveRecordState, formData: FormData): Promise<SaveRecordState> =>
      id
        ? editarComRede(action, prev, formData, (error) => ({ error }))
        : criarOuEnfileirar(action, prev, formData, {
            userId,
            tipo,
            erro: (error) => ({ error }),
            aoEnfileirar: (row) => ({ saved: resumoOffline(tipo, row), offline: true }),
          }),
    undefined,
  );

  if (state?.saved) {
    return (
      <div className="flex flex-col gap-6">
        <FormMessage success={state.saved} />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onNew} className="h-12 px-6 text-base">
            Registrar outro
          </Button>
          <Link href="/historico" className={cn(buttonVariants({ variant: "outline" }), "h-12 px-6 text-base")}>
            Ver histórico
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {id && <input type="hidden" name="id" value={id} />}
      {children}
      <div className="flex flex-col gap-2">
        <label htmlFor="quando" className="text-base font-medium">
          {quandoLabel}
        </label>
        <input
          id="quando"
          name="quando"
          type="datetime-local"
          required
          defaultValue={quando}
          className={cn(inputClass, "h-12 w-full max-w-xs")}
        />
      </div>
      <FormMessage error={state?.error} />
      <SubmitButton pending={pending} className="sm:w-auto sm:px-10">
        {id ? "Salvar alterações" : "Salvar"}
      </SubmitButton>
    </form>
  );
}

export function MealForm({ meal }: { meal?: { id: string; descricao: string; quando: string } }) {
  return (
    <RecordForm action={saveMeal} tipo="refeicao" id={meal?.id} quando={meal?.quando} quandoLabel="Quando comeu">
      <div className="flex flex-col gap-2">
        <label htmlFor="descricao" className="text-base font-medium">
          O que você comeu?
        </label>
        <textarea
          id="descricao"
          name="descricao"
          required
          maxLength={DESCRICAO_MAX}
          rows={3}
          autoFocus={!meal}
          defaultValue={meal?.descricao}
          placeholder="Ex.: arroz, feijão, frango grelhado e salada"
          className={cn(inputClass, "py-2")}
        />
      </div>
    </RecordForm>
  );
}

export function ActivityForm({
  activity,
}: {
  activity?: { id: string; tipo: string; duracaoMin: number; quando: string };
}) {
  const comum = (ATIVIDADES_COMUNS as readonly string[]).includes(activity?.tipo ?? "");
  const [escolha, setEscolha] = useState(activity ? (comum ? activity.tipo : "outra") : "");

  return (
    <RecordForm action={saveActivity} tipo="atividade" id={activity?.id} quando={activity?.quando} quandoLabel="Quando começou">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-base font-medium">Atividade</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[...ATIVIDADES_COMUNS, "outra"].map((t) => (
            <label key={t} className={choiceClass}>
              <input
                type="radio"
                name="tipo"
                value={t}
                required
                checked={escolha === t}
                onChange={() => setEscolha(t)}
                className="sr-only"
              />
              {t === "outra" ? "Outra" : t}
            </label>
          ))}
        </div>
        {escolha === "outra" && (
          <div className="mt-2 flex flex-col gap-2">
            <label htmlFor="tipo_outra" className="text-base font-medium">
              Qual atividade?
            </label>
            <input
              id="tipo_outra"
              name="tipo_outra"
              required
              maxLength={TIPO_ATIVIDADE_MAX}
              autoFocus
              defaultValue={comum ? "" : activity?.tipo}
              placeholder="Ex.: futebol, ioga, jardinagem"
              className={cn(inputClass, "h-12")}
            />
          </div>
        )}
      </fieldset>

      <div className="flex flex-col gap-2">
        <label htmlFor="duracao_min" className="text-base font-medium">
          Duração
        </label>
        <div className="flex items-center gap-3">
          <input
            id="duracao_min"
            name="duracao_min"
            type="number"
            inputMode="numeric"
            min={DURACAO_MIN}
            max={DURACAO_MAX}
            step={1}
            required
            defaultValue={activity?.duracaoMin}
            placeholder="30"
            className={cn(inputClass, "h-12 w-28 text-lg tabular-nums")}
          />
          <span className="text-base text-muted-foreground">minutos</span>
        </div>
      </div>
    </RecordForm>
  );
}

export function WeightForm({ weight }: { weight?: { id: string; pesoKg: string; quando: string } }) {
  return (
    <RecordForm action={saveWeight} tipo="peso" id={weight?.id} quando={weight?.quando} quandoLabel="Data e hora">
      <div className="flex flex-col gap-2">
        <label htmlFor="peso_kg" className="text-base font-medium">
          Peso
        </label>
        <div className="flex items-baseline gap-3">
          <input
            id="peso_kg"
            name="peso_kg"
            inputMode="decimal"
            required
            autoFocus={!weight}
            defaultValue={weight?.pesoKg}
            placeholder="72,5"
            pattern="\d{1,3}([,.]\d{1,2})?"
            title="Peso em kg, ex.: 72,5"
            className={cn(inputClass, "h-16 w-36 text-4xl font-semibold tabular-nums")}
          />
          <span className="text-lg text-muted-foreground">kg</span>
        </div>
      </div>
    </RecordForm>
  );
}
