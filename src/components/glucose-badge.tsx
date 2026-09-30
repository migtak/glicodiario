import type { Classificacao, Tom } from "@/lib/glucose/classify";
import { cn } from "@/lib/utils";

/** Classes completas (o Tailwind só gera classes escritas por extenso). */
export const TOM_CLASSES: Record<Tom, { text: string; bg: string; border: string; fill: string; solid: string }> = {
  "glu-normal": { text: "text-glu-normal", bg: "bg-glu-normal/10", border: "border-glu-normal", fill: "fill-glu-normal", solid: "bg-glu-normal" },
  "glu-attention": { text: "text-glu-attention", bg: "bg-glu-attention/10", border: "border-glu-attention", fill: "fill-glu-attention", solid: "bg-glu-attention" },
  "glu-high": { text: "text-glu-high", bg: "bg-glu-high/10", border: "border-glu-high", fill: "fill-glu-high", solid: "bg-glu-high" },
  "glu-low": { text: "text-glu-low", bg: "bg-glu-low/10", border: "border-glu-low", fill: "fill-glu-low", solid: "bg-glu-low" },
};

/** Etiqueta com cor e texto da classificação (nunca só cor). */
export function GlucoseBadge({ classificacao, className }: { classificacao: Classificacao; className?: string }) {
  const tom = TOM_CLASSES[classificacao.tom];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-medium",
        tom.bg,
        tom.text,
        className,
      )}
    >
      <span className={cn("size-2 rounded-full bg-current")} aria-hidden />
      {classificacao.rotulo}
    </span>
  );
}
