/** Exportação dos dados em CSV (LGPD: portabilidade). Formato pensado para o Excel em português. */
import { formatDateTime } from "@/lib/format";
import { classificar } from "@/lib/glucose/classify";
import { CONTEXTO_LABEL, type Contexto, type Faixa } from "@/lib/glucose/ranges";

type Glicemia = { valor_mg_dl: number; contexto: Contexto; medido_em: string; observacao: string | null };
type Refeicao = { descricao: string; ocorreu_em: string };
type Atividade = { tipo: string; duracao_min: number; ocorreu_em: string };
type Peso = { peso_kg: number; medido_em: string };

const SEP = ";";
const CABECALHO = ["Tipo", "Data", "Hora", "Valor", "Unidade", "Momento", "Classificação", "Descrição"];

/** Escapa um campo; também neutraliza fórmulas (=, +, -, @) que o Excel executaria. */
export function campo(valor: string): string {
  let v = valor;
  if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
  return /[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function dataHora(iso: string): [string, string] {
  const [data, hora] = formatDateTime(new Date(iso)).split(", ");
  return [data, hora];
}

const decimal = (n: number) => String(n).replace(".", ",");

export function gerarCsv(
  dados: { glicemias: Glicemia[]; refeicoes: Refeicao[]; atividades: Atividade[]; pesos: Peso[] },
  faixas: Record<Contexto, Faixa>,
): string {
  const linhas: { iso: string; campos: string[] }[] = [
    ...dados.glicemias.map((g) => ({
      iso: g.medido_em,
      campos: [
        "Glicemia",
        ...dataHora(g.medido_em),
        String(g.valor_mg_dl),
        "mg/dL",
        CONTEXTO_LABEL[g.contexto],
        classificar(g.valor_mg_dl, g.contexto, faixas[g.contexto]).rotulo,
        g.observacao ?? "",
      ],
    })),
    ...dados.refeicoes.map((r) => ({
      iso: r.ocorreu_em,
      campos: ["Refeição", ...dataHora(r.ocorreu_em), "", "", "", "", r.descricao],
    })),
    ...dados.atividades.map((a) => ({
      iso: a.ocorreu_em,
      campos: ["Atividade física", ...dataHora(a.ocorreu_em), String(a.duracao_min), "min", "", "", a.tipo],
    })),
    ...dados.pesos.map((p) => ({
      iso: p.medido_em,
      campos: ["Peso", ...dataHora(p.medido_em), decimal(p.peso_kg), "kg", "", "", ""],
    })),
  ].sort((a, b) => b.iso.localeCompare(a.iso));

  // BOM: faz o Excel reconhecer os acentos (UTF-8)
  return "\uFEFF" + [CABECALHO, ...linhas.map((l) => l.campos)].map((l) => l.map(campo).join(SEP)).join("\r\n") + "\r\n";
}
