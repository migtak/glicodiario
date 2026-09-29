import Link from "next/link";
import { Activity, ChevronRight, MessageSquareText, Scale, Utensils } from "lucide-react";
import { GlucoseBadge, TOM_CLASSES } from "@/components/glucose-badge";
import type { Reading } from "@/lib/data/glucose";
import type { ActivityItem, MealItem, WeightItem } from "@/lib/data/records";
import { dayKey, formatDateLong, formatDateTime, formatTime } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import { CONTEXTO_LABEL, type Contexto, type Faixa } from "@/lib/glucose/ranges";
import { formatDuracao, formatPeso } from "@/lib/records";
import { cn } from "@/lib/utils";

type Faixas = Record<Contexto, Faixa>;

/** Um registro de qualquer tipo, posicionado no tempo (`at` em ISO). */
export type TimelineItem =
  | { kind: "glicemia"; at: string; reading: Reading }
  | { kind: "refeicao"; at: string; meal: MealItem }
  | { kind: "atividade"; at: string; activity: ActivityItem }
  | { kind: "peso"; at: string; weight: WeightItem };

/** Linha clicável (abre a edição), com coluna da esquerda de largura fixa. */
function Row({
  href,
  label,
  left,
  children,
}: {
  href: string;
  label: string;
  left: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link href={href} aria-label={label} className="flex min-h-16 items-center gap-4 px-4 py-3 hover:bg-muted/60">
        <span className="flex w-16 shrink-0 items-center">{left}</span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">{children}</span>
        <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden />
      </Link>
    </li>
  );
}

function Note({ icon: Icon = MessageSquareText, children }: { icon?: typeof Utensils; children: React.ReactNode }) {
  return (
    <span className="flex items-start gap-1 text-sm text-muted-foreground">
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span className="line-clamp-2">{children}</span>
    </span>
  );
}

function KindIcon({ icon: Icon }: { icon: typeof Utensils }) {
  return (
    <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

function ReadingRow({
  reading,
  faixas,
  meal,
  showDate,
}: {
  reading: Reading;
  faixas: Faixas;
  meal?: MealItem;
  showDate?: boolean;
}) {
  const c = classificar(reading.valor_mg_dl, reading.contexto, faixas[reading.contexto]);
  const date = new Date(reading.medido_em);

  return (
    <Row
      href={`/historico/${reading.id}`}
      label={`${reading.valor_mg_dl} mg/dL, ${CONTEXTO_LABEL[reading.contexto]}, ${formatDateTime(date)}, ${c.rotulo}. Editar`}
      left={
        <span className={cn("text-2xl font-semibold tabular-nums", TOM_CLASSES[c.tom].text)}>
          {reading.valor_mg_dl}
        </span>
      }
    >
      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base">
        <span className="font-medium">{CONTEXTO_LABEL[reading.contexto]}</span>
        <GlucoseBadge classificacao={c} />
      </span>
      <span className="text-sm text-muted-foreground">{showDate ? formatDateTime(date) : formatTime(date)}</span>
      {meal && <Note icon={Utensils}>Após: {meal.descricao}</Note>}
      {reading.observacao && <Note>{reading.observacao}</Note>}
    </Row>
  );
}

function TimelineRow({
  item,
  faixas,
  mealsById,
}: {
  item: TimelineItem;
  faixas: Faixas;
  mealsById: Map<string, MealItem>;
}) {
  const hora = formatTime(new Date(item.at));
  switch (item.kind) {
    case "glicemia":
      return (
        <ReadingRow
          reading={item.reading}
          faixas={faixas}
          meal={item.reading.meal_id ? mealsById.get(item.reading.meal_id) : undefined}
        />
      );
    case "refeicao":
      return (
        <Row
          href={`/historico/refeicao/${item.meal.id}`}
          label={`Refeição às ${hora}: ${item.meal.descricao}. Editar`}
          left={<KindIcon icon={Utensils} />}
        >
          <span className="text-base font-medium">Refeição</span>
          <span className="text-sm text-muted-foreground">{hora}</span>
          <span className="line-clamp-2 text-sm">{item.meal.descricao}</span>
        </Row>
      );
    case "atividade":
      return (
        <Row
          href={`/historico/atividade/${item.activity.id}`}
          label={`${item.activity.tipo}, ${formatDuracao(item.activity.duracao_min)}, às ${hora}. Editar`}
          left={<KindIcon icon={Activity} />}
        >
          <span className="text-base font-medium">{item.activity.tipo}</span>
          <span className="text-sm text-muted-foreground">
            {hora} · {formatDuracao(item.activity.duracao_min)}
          </span>
        </Row>
      );
    case "peso":
      return (
        <Row
          href={`/historico/peso/${item.weight.id}`}
          label={`Peso ${formatPeso(item.weight.peso_kg)}, às ${hora}. Editar`}
          left={<KindIcon icon={Scale} />}
        >
          <span className="text-base font-medium">Peso: {formatPeso(item.weight.peso_kg)}</span>
          <span className="text-sm text-muted-foreground">{hora}</span>
        </Row>
      );
  }
}

/** Lista simples de glicemias (usada no Início), com data em cada linha. */
export function ReadingList({ readings, faixas }: { readings: Reading[]; faixas: Faixas }) {
  return (
    <ul className="divide-y overflow-hidden rounded-xl border">
      {readings.map((r) => (
        <ReadingRow key={r.id} reading={r} faixas={faixas} showDate />
      ))}
    </ul>
  );
}

/**
 * Todos os registros agrupados por dia (no fuso do app), do mais recente ao mais antigo.
 * `meals` serve para mostrar a refeição vinculada a cada glicemia.
 */
export function TimelineByDay({
  items,
  faixas,
  meals,
}: {
  items: TimelineItem[];
  faixas: Faixas;
  meals: MealItem[];
}) {
  const mealsById = new Map(meals.map((m) => [m.id, m]));
  const sorted = [...items].sort((a, b) => b.at.localeCompare(a.at));
  const days = new Map<string, TimelineItem[]>();
  for (const item of sorted) {
    const key = dayKey(new Date(item.at));
    days.set(key, [...(days.get(key) ?? []), item]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days.entries()].map(([key, dayItems]) => (
        <section key={key} aria-labelledby={`dia-${key}`}>
          <h2 id={`dia-${key}`} className="mb-2 text-base font-semibold first-letter:uppercase">
            {formatDateLong(new Date(dayItems[0].at))}
          </h2>
          <ul className="divide-y overflow-hidden rounded-xl border">
            {dayItems.map((item) => (
              <TimelineRow key={`${item.kind}-${item.at}-${idOf(item)}`} item={item} faixas={faixas} mealsById={mealsById} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function idOf(item: TimelineItem): string {
  switch (item.kind) {
    case "glicemia":
      return item.reading.id;
    case "refeicao":
      return item.meal.id;
    case "atividade":
      return item.activity.id;
    case "peso":
      return item.weight.id;
  }
}
