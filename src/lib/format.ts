export const TIME_ZONE = "America/Sao_Paulo";

const dateLong = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  weekday: "long",
  day: "numeric",
  month: "long",
});

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const time = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
});

/** Ex.: "segunda-feira, 29 de setembro" */
export function formatDateLong(date: Date): string {
  return dateLong.format(date);
}

/** Ex.: "29/09/2026, 07:30" */
export function formatDateTime(date: Date): string {
  return dateTime.format(date);
}

/** Ex.: "07:30" */
export function formatTime(date: Date): string {
  return time.format(date);
}

const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** Data/hora no fuso do app no formato do `<input type="datetime-local">`: "2026-09-29T07:30". */
export function toLocalInput(date: Date): string {
  const p = Object.fromEntries(localParts.formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

/** Dia no fuso do app, para agrupar registros: "2026-09-29". */
export function dayKey(date: Date): string {
  return toLocalInput(date).slice(0, 10);
}

const offsetFormat = new Intl.DateTimeFormat("en-US", {
  timeZone: TIME_ZONE,
  timeZoneName: "longOffset",
});

/** Diferença do fuso do app para UTC, em minutos (ex.: -180 para GMT-03:00). */
function offsetMinutes(date: Date): number {
  const name = offsetFormat.formatToParts(date).find((p) => p.type === "timeZoneName")?.value ?? "";
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(name);
  if (!m) return 0;
  return (m[1] === "-" ? -1 : 1) * (Number(m[2]) * 60 + Number(m[3]));
}

/**
 * Converte o valor de um `<input type="datetime-local">` (horário do fuso do app)
 * para um Date (UTC). Retorna null se o texto for inválido.
 */
export function localInputToDate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::\d{2}(?:\.\d+)?)?$/.exec(value);
  if (!m) return null;
  const asUtc = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  const date = new Date(asUtc - offsetMinutes(new Date(asUtc)) * 60_000);
  if (Number.isNaN(date.getTime())) return null;
  // recusa datas impossíveis (ex.: mês 13 ou 31/02), que o Date.UTC "empurraria" para frente
  return toLocalInput(date) === value.slice(0, 16) ? date : null;
}

/** Momento de `dias` dias atrás, a partir de agora. */
export function diasAtras(dias: number): Date {
  return new Date(Date.now() - dias * 86_400_000);
}
