import { describe, expect, it } from "vitest";
import { parseActivity, parseMeal, parseReading, parseWeight, type Campo } from "./parse-records";

const campos = (valores: Record<string, string>): Campo => (n) => valores[n] ?? "";
// 30/09/2026 12:00 em São Paulo
const AGORA = new Date("2026-09-30T15:00:00Z").getTime();
const MEAL = "11111111-2222-4333-8444-555555555555";

describe("parseReading", () => {
  const base = { valor: "105", contexto: "jejum", medido_em: "2026-09-30T07:10" };

  it("monta a linha com data em UTC", () => {
    expect(parseReading(campos(base), AGORA)).toEqual({
      ok: true,
      row: { valor_mg_dl: 105, contexto: "jejum", medido_em: "2026-09-30T10:10:00.000Z", observacao: null, meal_id: null },
    });
  });

  it("só vincula refeição em medição pós-refeição", () => {
    const pos = parseReading(campos({ ...base, contexto: "pos_2h", meal_id: MEAL }), AGORA);
    expect(pos.ok && pos.row.meal_id).toBe(MEAL);
    const jejum = parseReading(campos({ ...base, meal_id: MEAL }), AGORA);
    expect(jejum.ok && jejum.row.meal_id).toBeNull();
  });

  it.each([
    [{ valor: "" }, "Informe o valor medido."],
    [{ valor: "700" }, "entre 20 e 600"],
    [{ contexto: "almoço" }, "Escolha o momento"],
    [{ medido_em: "2026-10-01T12:00" }, "futuro"],
    [{ contexto: "pos_1h", meal_id: "abc" }, "Refeição inválida"],
    [{ observacao: "x".repeat(501) }, "no máximo 500"],
  ])("recusa %j", (mudanca, erro) => {
    const r = parseReading(campos({ ...base, ...mudanca }), AGORA);
    expect(r.ok).toBe(false);
    expect(!r.ok && r.error).toContain(erro);
  });
});

describe("parseMeal / parseActivity / parseWeight", () => {
  it("refeição", () => {
    expect(parseMeal(campos({ descricao: "Pão", quando: "2026-09-30T08:00" }), AGORA)).toEqual({
      ok: true,
      row: { descricao: "Pão", ocorreu_em: "2026-09-30T11:00:00.000Z" },
    });
    expect(parseMeal(campos({ quando: "2026-09-30T08:00" }), AGORA)).toEqual({ ok: false, error: "Descreva o que você comeu." });
  });

  it("atividade: comum e 'outra'", () => {
    const comum = parseActivity(campos({ tipo: "Corrida", duracao_min: "30", quando: "2026-09-30T06:00" }), AGORA);
    expect(comum.ok && comum.row).toMatchObject({ tipo: "Corrida", duracao_min: 30 });
    const outra = parseActivity(campos({ tipo: "outra", tipo_outra: "Ioga", duracao_min: "45", quando: "2026-09-30T06:00" }), AGORA);
    expect(outra.ok && outra.row.tipo).toBe("Ioga");
    const semNome = parseActivity(campos({ tipo: "outra", duracao_min: "45", quando: "2026-09-30T06:00" }), AGORA);
    expect(semNome).toEqual({ ok: false, error: "Escreva qual foi a atividade." });
  });

  it("peso com vírgula", () => {
    expect(parseWeight(campos({ peso_kg: "72,5", quando: "2026-09-30T07:00" }), AGORA)).toEqual({
      ok: true,
      row: { peso_kg: 72.5, medido_em: "2026-09-30T10:00:00.000Z" },
    });
  });
});
