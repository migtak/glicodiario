import { describe, expect, it } from "vitest";
import { classificar, validarValor, type Nivel } from "./classify";
import { CONTEXTOS, resolverFaixas, type Contexto } from "./ranges";

function nivel(valor: number, contexto: Contexto) {
  return classificar(valor, contexto).nivel;
}

describe("classificar — jejum (critério oficial)", () => {
  it.each<[number, Nivel]>([
    [70, "normal"],
    [99, "normal"],
    [100, "atencao"],
    [125, "atencao"],
    [126, "alto"],
    [249, "alto"],
  ])("%i mg/dL → %s", (valor, esperado) => {
    expect(nivel(valor, "jejum")).toBe(esperado);
  });
});

describe("classificar — 2h após refeição (critério oficial)", () => {
  it.each<[number, Nivel]>([
    [139, "normal"],
    [140, "atencao"],
    [199, "atencao"],
    [200, "alto"],
  ])("%i mg/dL → %s", (valor, esperado) => {
    expect(nivel(valor, "pos_2h")).toBe(esperado);
  });
});

describe("classificar — limites de segurança valem para todos os contextos", () => {
  it.each(CONTEXTOS)("%s", (contexto) => {
    expect(nivel(20, contexto)).toBe("hipo_grave");
    expect(nivel(53, contexto)).toBe("hipo_grave");
    expect(nivel(54, contexto)).toBe("hipo");
    expect(nivel(69, contexto)).toBe("hipo");
    expect(nivel(70, contexto)).toBe("normal");
    expect(nivel(250, contexto)).toBe("muito_alto");
    expect(nivel(600, contexto)).toBe("muito_alto");
  });

  it("valores de risco vêm com alerta e orientação de atendimento", () => {
    for (const valor of [40, 60, 300]) {
      const c = classificar(valor, "aleatorio");
      expect(c.alerta).toBe(true);
      expect(c.mensagem).toMatch(/atendimento/);
    }
  });

  it("valores fora do risco não têm alerta", () => {
    for (const valor of [85, 110, 130, 200]) {
      expect(classificar(valor, "jejum").alerta).toBe(false);
    }
  });
});

describe("classificar — faixas personalizadas", () => {
  const faixa = { normalMin: 80, normalMax: 110, atencaoMax: 150 };

  it("usa a faixa informada", () => {
    expect(classificar(75, "jejum", faixa).nivel).toBe("abaixo");
    expect(classificar(110, "jejum", faixa).nivel).toBe("normal");
    expect(classificar(111, "jejum", faixa).nivel).toBe("atencao");
    expect(classificar(151, "jejum", faixa).nivel).toBe("alto");
  });

  it("não deixa a faixa personalizada esconder valores de risco", () => {
    const larga = { normalMin: 40, normalMax: 300, atencaoMax: 400 };
    expect(classificar(50, "jejum", larga).nivel).toBe("hipo_grave");
    expect(classificar(65, "jejum", larga).nivel).toBe("hipo");
    expect(classificar(260, "jejum", larga).nivel).toBe("muito_alto");
  });
});

describe("mensagens", () => {
  it("nunca fazem diagnóstico", () => {
    for (const contexto of CONTEXTOS) {
      for (let valor = 20; valor <= 600; valor += 5) {
        expect(classificar(valor, contexto).mensagem).not.toMatch(/você tem|diabétic|diagnóstico/i);
      }
    }
  });

  it("citam o momento da medição", () => {
    expect(classificar(90, "jejum").mensagem).toContain("jejum");
    expect(classificar(150, "pos_2h").mensagem).toContain("2h após refeição");
  });
});

describe("resolverFaixas", () => {
  it("sem personalização, usa os padrões", () => {
    expect(resolverFaixas().jejum).toEqual({ normalMin: 70, normalMax: 99, atencaoMax: 125 });
  });

  it("aplica só as faixas personalizadas válidas", () => {
    const faixas = resolverFaixas({
      jejum: { normalMin: 80, normalMax: 110, atencaoMax: 130 },
      pos_2h: { normalMin: 150, normalMax: 100, atencaoMax: 200 }, // inválida: min > max
    });
    expect(faixas.jejum.normalMax).toBe(110);
    expect(faixas.pos_2h.normalMax).toBe(139);
  });
});

describe("validarValor", () => {
  it.each([20, 95, 600])("aceita %i", (v) => expect(validarValor(v)).toBeNull());
  it.each([19, 601, 0, -5])("recusa %i (fora do intervalo)", (v) =>
    expect(validarValor(v)).toMatch(/entre 20 e 600/),
  );
  it.each([95.5, NaN])("recusa %s (não inteiro)", (v) =>
    expect(validarValor(v)).toMatch(/inteiro/),
  );
});
