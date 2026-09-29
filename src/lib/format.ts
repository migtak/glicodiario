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

/** Ex.: "segunda-feira, 29 de setembro" */
export function formatDateLong(date: Date): string {
  return dateLong.format(date);
}

/** Ex.: "29/09/2026, 07:30" */
export function formatDateTime(date: Date): string {
  return dateTime.format(date);
}
