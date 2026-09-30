import { describe, expect, it } from "vitest";
import { dayTicks, niceTicks } from "./chart";

describe("niceTicks", () => {
  it("glicemia típica", () => {
    expect(niceTicks(60, 225)).toEqual({ min: 50, max: 250, ticks: [50, 100, 150, 200, 250] });
  });

  it("peso com decimais", () => {
    const { ticks, min, max } = niceTicks(71, 74);
    expect(min).toBeLessThanOrEqual(71);
    expect(max).toBeGreaterThanOrEqual(74);
    expect(ticks).toEqual([71, 72, 73, 74]);
  });

  it("intervalo vazio não quebra", () => {
    expect(niceTicks(80, 80).ticks.length).toBeGreaterThan(1);
  });
});

describe("dayTicks", () => {
  const fim = new Date("2026-09-30T15:00:00Z").getTime(); // 12:00 em SP

  it("7 dias: um rótulo por dia, à meia-noite de São Paulo", () => {
    const ticks = dayTicks(fim - 7 * 86_400_000, fim);
    expect(ticks.map((t) => t.label)).toEqual(["24/09", "25/09", "26/09", "27/09", "28/09", "29/09", "30/09"]);
    expect(new Date(ticks[0].t).toISOString()).toBe("2026-09-24T03:00:00.000Z");
  });

  it("30 dias: um rótulo a cada 5 dias", () => {
    const ticks = dayTicks(fim - 30 * 86_400_000, fim);
    expect(ticks.length).toBe(6);
    expect(ticks[0].label).toBe("01/09");
    expect(ticks[1].label).toBe("06/09");
  });
});
