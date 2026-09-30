"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/** Um ponto medido. Todos os textos já vêm formatados do servidor. */
export type ChartPoint = {
  t: number;
  v: number;
  /** classe Tailwind de preenchimento do ponto (ex.: "fill-glu-normal") */
  fillClass: string;
  titulo: string;
  linhas: string[];
};

/** Evento mostrado na faixa abaixo do gráfico (refeição, atividade). */
export type ChartMarker = { t: number; tipo: "refeicao" | "atividade"; titulo: string; linhas: string[] };

type Props = {
  pontos: ChartPoint[];
  marcadores?: ChartMarker[];
  inicio: number;
  fim: number;
  yMin: number;
  yMax: number;
  yTicks: number[];
  xTicks: { t: number; label: string }[];
  /** faixa sombreada (ex.: faixa normal de glicemia) */
  faixa?: { min: number; max: number; label: string };
  ariaLabel: string;
  altura?: number;
  /** conecta os pontos com uma linha */
  linha?: boolean;
};

const M = { top: 12, right: 12, left: 40 };
const FAIXA_MARCADORES = 44;
const EIXO_X = 22;
const HIT_PX = 36;

type Hover = { x: number; y: number; titulo: string; linhas: string[] };

/**
 * Gráfico de pontos no tempo, em SVG, com hover/toque mostrando os detalhes.
 * Uma única escala vertical (nada de eixo duplo).
 */
export function TimeChart({
  pontos,
  marcadores = [],
  inicio,
  fim,
  yMin,
  yMax,
  yTicks,
  xTicks,
  faixa,
  ariaLabel,
  altura = 240,
  linha = true,
}: Props) {
  const [largura, setLargura] = useState(0);
  const [hover, setHover] = useState<Hover | null>(null);
  const observer = useRef<ResizeObserver | null>(null);

  // mede a largura disponível (o SVG é desenhado em pixels reais, sem distorcer o texto)
  const medir = useCallback((el: HTMLDivElement | null) => {
    observer.current?.disconnect();
    if (!el) return;
    observer.current = new ResizeObserver(([entry]) => setLargura(Math.floor(entry.contentRect.width)));
    observer.current.observe(el);
  }, []);

  const plotH = altura;
  const temMarcadores = marcadores.length > 0;
  const totalH = M.top + plotH + (temMarcadores ? FAIXA_MARCADORES : 0) + EIXO_X;
  const plotW = Math.max(0, largura - M.left - M.right);
  const x = (t: number) => M.left + ((t - inicio) / (fim - inicio)) * plotW;
  const y = (v: number) => M.top + (1 - (v - yMin) / (yMax - yMin)) * plotH;
  // fileira de eventos separada do gráfico, para não parecer um valor do eixo
  const faixaY = M.top + plotH + FAIXA_MARCADORES - 12;

  const ordenados = [...pontos].sort((a, b) => a.t - b.t);

  function onPointer(e: React.PointerEvent<SVGSVGElement>) {
    const box = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - box.left;
    const py = e.clientY - box.top;
    // na faixa de marcadores: o marcador mais próximo na horizontal
    if (temMarcadores && py > M.top + plotH) {
      const alvo = maisProximo(marcadores, (m) => Math.abs(x(m.t) - px));
      if (alvo && Math.abs(x(alvo.t) - px) <= HIT_PX) {
        return setHover({ x: x(alvo.t), y: faixaY, titulo: alvo.titulo, linhas: alvo.linhas });
      }
      return setHover(null);
    }
    const alvo = maisProximo(pontos, (p) => Math.hypot(x(p.t) - px, (y(p.v) - py) / 3));
    if (alvo && Math.abs(x(alvo.t) - px) <= HIT_PX) {
      return setHover({ x: x(alvo.t), y: y(alvo.v), titulo: alvo.titulo, linhas: alvo.linhas });
    }
    setHover(null);
  }

  return (
    <div ref={medir} className="relative w-full select-none break-inside-avoid print:!min-h-0" style={{ minHeight: totalH }}>
      {largura > 0 && (
        <svg
          viewBox={`0 0 ${largura} ${totalH}`}
          width="100%"
          role="img"
          aria-label={ariaLabel}
          className="touch-pan-y overflow-visible"
          onPointerMove={onPointer}
          onPointerDown={onPointer}
          onPointerLeave={(e) => e.pointerType === "mouse" && setHover(null)}
        >
          {/* faixa de referência */}
          {faixa && (
            <g>
              <rect
                x={M.left}
                width={plotW}
                y={y(Math.min(faixa.max, yMax))}
                height={Math.max(0, y(Math.max(faixa.min, yMin)) - y(Math.min(faixa.max, yMax)))}
                className="fill-glu-normal/10"
              />
              <text
                x={M.left + plotW - 6}
                y={y(Math.min(faixa.max, yMax)) + 14}
                textAnchor="end"
                className="fill-muted-foreground text-[11px]"
              >
                {faixa.label}
              </text>
            </g>
          )}

          {/* grade e eixo Y */}
          {yTicks.map((v) => (
            <g key={v}>
              <line x1={M.left} x2={M.left + plotW} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth={1} />
              <text x={M.left - 6} y={y(v)} dy="0.32em" textAnchor="end" className="fill-muted-foreground text-[11px] tabular-nums">
                {v.toLocaleString("pt-BR")}
              </text>
            </g>
          ))}

          {/* eixo X (dias) */}
          {xTicks.map((tick) => (
            <text
              key={tick.t}
              x={x(tick.t)}
              y={totalH - 6}
              textAnchor="middle"
              className="fill-muted-foreground text-[11px] tabular-nums"
            >
              {tick.label}
            </text>
          ))}

          {/* marcadores de refeição e atividade */}
          {temMarcadores && (
            <g aria-hidden>
              <text x={M.left} y={faixaY - 12} className="fill-muted-foreground text-[11px]">
                Refeições e atividades
              </text>
              <line x1={M.left} x2={M.left + plotW} y1={faixaY} y2={faixaY} className="stroke-border" strokeWidth={1} strokeDasharray="2 3" />
              {marcadores.map((m, i) => (
                <g key={i} transform={`translate(${x(m.t)} ${faixaY})`}>
                  {m.tipo === "refeicao" ? (
                    <circle r={5} className="fill-foreground/70 stroke-background" strokeWidth={2} />
                  ) : (
                    <rect x={-5} y={-5} width={10} height={10} transform="rotate(45)" className="fill-primary stroke-background" strokeWidth={2} />
                  )}
                </g>
              ))}
            </g>
          )}

          {/* linha e pontos */}
          {linha && ordenados.length > 1 && (
            <polyline
              points={ordenados.map((p) => `${x(p.t)},${y(p.v)}`).join(" ")}
              fill="none"
              className="stroke-muted-foreground/50"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}
          {ordenados.map((p, i) => (
            <circle
              key={i}
              cx={x(p.t)}
              cy={y(p.v)}
              r={5}
              className={cn(p.fillClass, "stroke-background")}
              strokeWidth={2}
            />
          ))}

          {/* destaque do item em foco */}
          {hover && (
            <g pointerEvents="none">
              <line x1={hover.x} x2={hover.x} y1={M.top} y2={M.top + plotH} className="stroke-foreground/30" strokeWidth={1} />
              <circle cx={hover.x} cy={hover.y} r={8} fill="none" className="stroke-foreground" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}

      {hover && (
        <div
          role="status"
          className="pointer-events-none absolute z-10 w-max max-w-[16rem] rounded-lg border bg-popover px-3 py-2 text-sm shadow-md"
          style={{
            left: Math.min(Math.max(hover.x - 80, 0), Math.max(0, largura - 256)),
            top: hover.y > totalH / 2 ? Math.max(0, hover.y - 90) : hover.y + 14,
          }}
        >
          <p className="font-semibold text-foreground">{hover.titulo}</p>
          {hover.linhas.map((l, i) => (
            <p key={i} className="text-muted-foreground">
              {l}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function maisProximo<T>(itens: T[], distancia: (item: T) => number): T | undefined {
  let melhor: T | undefined;
  let menor = Infinity;
  for (const item of itens) {
    const d = distancia(item);
    if (d < menor) {
      menor = d;
      melhor = item;
    }
  }
  return melhor;
}
