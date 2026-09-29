import {
  CONTEXTO_LABEL,
  FAIXAS_PADRAO,
  LIMITES_SEGURANCA,
  VALOR_MAX,
  VALOR_MIN,
  type Contexto,
  type Faixa,
} from "./ranges";

export type Nivel =
  | "hipo_grave"
  | "hipo"
  | "abaixo"
  | "normal"
  | "atencao"
  | "alto"
  | "muito_alto";

/** Token de cor (ver globals.css). A cor sempre acompanha o `rotulo` em texto. */
export type Tom = "glu-normal" | "glu-attention" | "glu-high" | "glu-low";

export type Classificacao = {
  nivel: Nivel;
  /** Texto curto para badges, ex.: "Normal" */
  rotulo: string;
  /** Explicação para o usuário, sem diagnóstico */
  mensagem: string;
  tom: Tom;
  /** true = valor de risco: mostrar em destaque, com orientação de buscar atendimento */
  alerta: boolean;
};

/**
 * Classifica uma medição. Ordem de prioridade:
 * 1. limites de segurança (hipoglicemia e muito alta), que valem sempre;
 * 2. faixa do contexto (padrão ou personalizada).
 */
export function classificar(
  valor: number,
  contexto: Contexto,
  faixa: Faixa = FAIXAS_PADRAO[contexto],
): Classificacao {
  const momento = CONTEXTO_LABEL[contexto].toLowerCase();

  if (valor < LIMITES_SEGURANCA.hipoGrave) {
    return {
      nivel: "hipo_grave",
      rotulo: "Muito baixa",
      mensagem:
        "Glicemia muito baixa (hipoglicemia importante). Consuma algo com açúcar de absorção rápida, como suco ou refrigerante comum, e procure atendimento médico.",
      tom: "glu-high",
      alerta: true,
    };
  }
  if (valor < LIMITES_SEGURANCA.hipo) {
    return {
      nivel: "hipo",
      rotulo: "Baixa",
      mensagem:
        "Glicemia baixa (hipoglicemia). Consuma algo com açúcar de absorção rápida e meça novamente em 15 minutos. Se não melhorar, procure atendimento.",
      tom: "glu-low",
      alerta: true,
    };
  }
  if (valor >= LIMITES_SEGURANCA.muitoAlta) {
    return {
      nivel: "muito_alto",
      rotulo: "Muito alta",
      mensagem:
        "Valor muito acima da faixa de referência. Procure atendimento médico, principalmente se tiver sintomas como muita sede, enjoo ou cansaço.",
      tom: "glu-high",
      alerta: true,
    };
  }
  if (valor < faixa.normalMin) {
    return {
      nivel: "abaixo",
      rotulo: "Abaixo da faixa",
      mensagem: `Abaixo da sua faixa de referência para ${momento}.`,
      tom: "glu-attention",
      alerta: false,
    };
  }
  if (valor <= faixa.normalMax) {
    return {
      nivel: "normal",
      rotulo: "Normal",
      mensagem: `Dentro da faixa de referência para ${momento}.`,
      tom: "glu-normal",
      alerta: false,
    };
  }
  if (valor <= faixa.atencaoMax) {
    return {
      nivel: "atencao",
      rotulo: "Atenção",
      mensagem: `Um pouco acima da faixa de referência para ${momento}. Vale acompanhar e comentar com um profissional de saúde se acontecer com frequência.`,
      tom: "glu-attention",
      alerta: false,
    };
  }
  return {
    nivel: "alto",
    rotulo: "Alta",
    mensagem: `Acima da faixa de referência para ${momento}. Converse com um profissional de saúde, principalmente se isso se repetir.`,
    tom: "glu-high",
    alerta: false,
  };
}

/** Valida um valor digitado (mg/dL inteiro dentro do intervalo aceito pelo banco). */
export function validarValor(valor: number): string | null {
  if (!Number.isFinite(valor) || !Number.isInteger(valor)) {
    return "Informe um número inteiro, sem vírgula.";
  }
  if (valor < VALOR_MIN || valor > VALOR_MAX) {
    return `O valor precisa estar entre ${VALOR_MIN} e ${VALOR_MAX} mg/dL.`;
  }
  return null;
}
