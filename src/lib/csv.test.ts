import { describe, expect, it } from "vitest";
import { resolverFaixas } from "@/lib/glucose/ranges";
import { campo, gerarCsv } from "./csv";

describe("campo", () => {
  it("texto simples fica igual", () => expect(campo("Jejum")).toBe("Jejum"));
  it("separador, aspas e quebra de linha vão entre aspas", () => {
    expect(campo("arroz; feijão")).toBe('"arroz; feijão"');
    expect(campo('pão "integral"')).toBe('"pão ""integral"""');
    expect(campo("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });
  it("neutraliza fórmulas", () => {
    expect(campo("=HYPERLINK(1)")).toBe("'=HYPERLINK(1)");
    expect(campo("-2")).toBe("'-2");
  });
});

describe("gerarCsv", () => {
  const csv = gerarCsv(
    {
      glicemias: [{ valor_mg_dl: 105, contexto: "jejum", medido_em: "2026-09-24T10:10:00Z", observacao: "Ao acordar" }],
      refeicoes: [{ descricao: "Arroz; feijão", ocorreu_em: "2026-09-24T15:00:00Z" }],
      atividades: [{ tipo: "Caminhada", duracao_min: 40, ocorreu_em: "2026-09-25T10:00:00Z" }],
      pesos: [{ peso_kg: 72.5, medido_em: "2026-09-23T10:00:00Z" }],
    },
    resolverFaixas(),
  );
  const linhas = csv.split("\r\n");

  it("começa com BOM e cabeçalho", () => {
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    expect(csv.startsWith("\uFEFFTipo;Data;Hora;Valor;Unidade;Momento;Classificação;Descrição")).toBe(true);
  });

  it("ordena do mais recente ao mais antigo, com data e hora de São Paulo", () => {
    expect(linhas.slice(1, 5)).toEqual([
      "Atividade física;25/09/2026;07:00;40;min;;;Caminhada",
      'Refeição;24/09/2026;12:00;;;;;"Arroz; feijão"',
      "Glicemia;24/09/2026;07:10;105;mg/dL;Jejum;Atenção;Ao acordar",
      "Peso;23/09/2026;07:00;72,5;kg;;;",
    ]);
  });
});
