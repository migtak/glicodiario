import { describe, expect, it } from "vitest";
import { formatDuracao, formatPeso, parsePeso, pesoParaCampo, validarDuracao } from "./records";

describe("parsePeso", () => {
  it.each([
    ["72,5", 72.5],
    ["72.5", 72.5],
    [" 80 ", 80],
    ["68,25", 68.25],
    ["20", 20],
    ["400", 400],
  ])("%j → %d", (texto, esperado) => {
    expect(parsePeso(texto)).toEqual({ valor: esperado });
  });

  it.each(["", "abc", "72,555", "-70", "1.000", "72kg"])("recusa formato %j", (texto) => {
    expect(parsePeso(texto)).toHaveProperty("erro");
  });

  it.each(["19,9", "401"])("recusa fora do intervalo %j", (texto) => {
    expect(parsePeso(texto)).toEqual({ erro: "O peso precisa estar entre 20 e 400 kg." });
  });
});

describe("validarDuracao", () => {
  it.each([1, 30, 1440])("aceita %i", (m) => expect(validarDuracao(m)).toBeNull());
  it.each([0, 1441, -10])("recusa %i", (m) => expect(validarDuracao(m)).toMatch(/entre 1 e 1440/));
  it.each([30.5, NaN])("recusa %s (não inteiro)", (m) => expect(validarDuracao(m)).toMatch(/sem vírgula/));
});

describe("formatação", () => {
  it.each([
    [45, "45 min"],
    [60, "1h"],
    [90, "1h30"],
    [125, "2h05"],
  ])("duração %i → %s", (m, texto) => expect(formatDuracao(m)).toBe(texto));

  it("peso em pt-BR", () => {
    expect(formatPeso(72.5)).toBe("72,5 kg");
    expect(formatPeso(80)).toBe("80 kg");
    expect(pesoParaCampo(72.5)).toBe("72,5");
  });
});
