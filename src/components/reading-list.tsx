import Link from "next/link";
import { ChevronRight, MessageSquareText } from "lucide-react";
import { GlucoseBadge, TOM_CLASSES } from "@/components/glucose-badge";
import type { Reading } from "@/lib/data/glucose";
import { dayKey, formatDateLong, formatDateTime, formatTime } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import { CONTEXTO_LABEL, type Contexto, type Faixa } from "@/lib/glucose/ranges";
import { cn } from "@/lib/utils";

type Faixas = Record<Contexto, Faixa>;

function ReadingRow({
  reading,
  faixas,
  showDate,
}: {
  reading: Reading;
  faixas: Faixas;
  showDate?: boolean;
}) {
  const c = classificar(reading.valor_mg_dl, reading.contexto, faixas[reading.contexto]);
  const date = new Date(reading.medido_em);

  return (
    <li>
      <Link
        href={`/historico/${reading.id}`}
        className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-muted/60"
        aria-label={`${reading.valor_mg_dl} mg/dL, ${CONTEXTO_LABEL[reading.contexto]}, ${formatDateTime(date)}, ${c.rotulo}. Editar`}
      >
        <span className={cn("w-16 shrink-0 text-2xl font-semibold tabular-nums", TOM_CLASSES[c.tom].text)}>
          {reading.valor_mg_dl}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
            <span className="font-medium">{CONTEXTO_LABEL[reading.contexto]}</span>
            <GlucoseBadge classificacao={c} />
          </span>
          <span className="text-sm text-muted-foreground">
            {showDate ? formatDateTime(date) : formatTime(date)}
          </span>
          {reading.observacao && (
            <span className="flex items-start gap-1 text-sm text-muted-foreground">
              <MessageSquareText className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span className="line-clamp-2">{reading.observacao}</span>
            </span>
          )}
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

/** Lista simples (usada no Início), com data em cada linha. */
export function ReadingList({ readings, faixas }: { readings: Reading[]; faixas: Faixas }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border">
      {readings.map((r) => (
        <ReadingRow key={r.id} reading={r} faixas={faixas} showDate />
      ))}
    </ul>
  );
}

/** Lista agrupada por dia (no fuso do app), usada no Histórico. */
export function ReadingListByDay({ readings, faixas }: { readings: Reading[]; faixas: Faixas }) {
  const days = new Map<string, Reading[]>();
  for (const r of readings) {
    const key = dayKey(new Date(r.medido_em));
    days.set(key, [...(days.get(key) ?? []), r]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days.entries()].map(([key, items]) => (
        <section key={key} aria-labelledby={`dia-${key}`}>
          <h2 id={`dia-${key}`} className="mb-2 text-base font-semibold first-letter:uppercase">
            {formatDateLong(new Date(items[0].medido_em))}
          </h2>
          <ul className="divide-y overflow-hidden rounded-xl border">
            {items.map((r) => (
              <ReadingRow key={r.id} reading={r} faixas={faixas} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
