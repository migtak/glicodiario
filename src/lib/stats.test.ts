import { describe, expect, it } from "vitest";
import { resolverFaixas } from "@/lib/glucose/ranges";
import { resumirAtividade, resumirGlicemia, resumirPeso } from "./stats";

const faixas = resolverFaixas();
const r = (valor_mg_dl: number, contexto: "jejum" | "pos_2h" | "aleatorio", medido_em = "2026-09-24T10:00:00Z") => ({
  valor_mg_dl,
  contexto,
  medido_em,
});

describe("resumirGlicemia", () => {
  it("sem medições", () => {
    const s = resumirGlicemia([], faixas);
    expect(s).toMatchObject({ total: 0, media: null, pctNaFaixa: null, minimo: null, maximo: null, alertas: 0 });
    expect(s.porContexto).toEqual([]);
  });

  it("calcula média, extremos e % na faixa usando a faixa de cada momento", () => {
    const s = resumirGlicemia(
      [
        r(94, "jejum", "2026-09-24T10:00:00Z"), // normal
        r(110, "jejum", "2026-09-25T10:00:00Z"), // atenção (jejum)
        r(130, "pos_2h", "2026-09-24T17:00:00Z"), // normal (pós)
        r(205, "pos_2h", "2026-09-25T17:00:00Z"), // alta
      ],
      faixas,
    );
    expect(s.total).toBe(4);
    expect(s.media).toBe(135); // (94+110+130+205)/4 = 134,75
    expect(s.pctNaFaixa).toBe(50);
    expect(s.distribuicao).toEqual({ baixa: 0, normal: 2, atencao: 1, alta: 1 });
    expect(s.minimo).toEqual({ valor: 94, contexto: "jejum", em: "2026-09-24T10:00:00Z" });
    expect(s.maximo?.valor).toBe(205);
    expect(s.porContexto).toEqual([
      { contexto: "jejum", n: 2, media: 102 },
      { contexto: "pos_2h", n: 2, media: 168 },
    ]);
  });

  it("conta alertas de risco e agrupa hipoglicemia como 'baixa'", () => {
    const s = resumirGlicemia([r(50, "aleatorio"), r(65, "aleatorio"), r(300, "aleatorio"), r(100, "aleatorio")], faixas);
    expect(s.alertas).toBe(3);
    expect(s.distribuicao).toEqual({ baixa: 2, normal: 1, atencao: 0, alta: 1 });
  });

  it("média por momento segue a ordem dos contextos, não a dos registros", () => {
    const s = resumirGlicemia([r(150, "aleatorio"), r(140, "pos_2h"), r(90, "jejum")], faixas);
    expect(s.porContexto.map((p) => p.contexto)).toEqual(["jejum", "pos_2h", "aleatorio"]);
  });
});

describe("resumirPeso", () => {
  it("sem registros", () => expect(resumirPeso([])).toBeNull());

  it("um registro: sem variação", () => {
    expect(resumirPeso([{ peso_kg: 72.5, medido_em: "2026-09-20T10:00:00Z" }])).toEqual({ atual: 72.5, variacao: null, n: 1 });
  });

  it("variação = mais recente − mais antigo, independente da ordem", () => {
    expect(
      resumirPeso([
        { peso_kg: 71.8, medido_em: "2026-09-28T10:00:00Z" },
        { peso_kg: 73.1, medido_em: "2026-09-01T10:00:00Z" },
        { peso_kg: 72.4, medido_em: "2026-09-15T10:00:00Z" },
      ]),
    ).toEqual({ atual: 71.8, variacao: -1.3, n: 3 });
  });
});

describe("resumirAtividade", () => {
  it("soma minutos e conta dias distintos no fuso local", () => {
    expect(
      resumirAtividade([
        { duracao_min: 30, ocorreu_em: "2026-09-24T12:00:00Z" },
        { duracao_min: 45, ocorreu_em: "2026-09-25T01:00:00Z" }, // 22h do dia 24 em SP
        { duracao_min: 20, ocorreu_em: "2026-09-26T12:00:00Z" },
      ]),
    ).toEqual({ totalMin: 95, sessoes: 3, dias: 2 });
  });
});
