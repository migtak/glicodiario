import { describe, expect, it } from "vitest";
import { dayKey, formatTime, localInputToDate, toLocalInput } from "./format";

describe("datas no fuso de São Paulo (UTC-3)", () => {
  it("converte horário local digitado para UTC", () => {
    expect(localInputToDate("2026-09-29T07:30")?.toISOString()).toBe("2026-09-29T10:30:00.000Z");
  });

  it("aceita segundos vindos do navegador", () => {
    expect(localInputToDate("2026-09-29T07:30:00")?.toISOString()).toBe("2026-09-29T10:30:00.000Z");
  });

  it("vai e volta sem perder informação", () => {
    const d = new Date("2026-01-15T02:05:00Z");
    expect(toLocalInput(d)).toBe("2026-01-14T23:05");
    expect(localInputToDate(toLocalInput(d))?.getTime()).toBe(d.getTime());
  });

  it("agrupa pelo dia local, não pelo dia em UTC", () => {
    // 01:00 UTC do dia 30 ainda é 22:00 do dia 29 em São Paulo
    expect(dayKey(new Date("2026-09-30T01:00:00Z"))).toBe("2026-09-29");
  });

  it("formata hora em 24h", () => {
    expect(formatTime(new Date("2026-09-29T21:15:00Z"))).toBe("18:15");
  });

  it.each(["", "29/09/2026 07:30", "2026-13-01T10:00", "2026-02-31T10:00", "2026-09-29T25:00", "abc"])("recusa %j", (v) => {
    expect(localInputToDate(v)).toBeNull();
  });
});
