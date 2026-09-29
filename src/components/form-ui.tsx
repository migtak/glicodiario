import { CircleCheck, TriangleAlert } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type FieldProps = React.ComponentProps<"input"> & { label: string; name: string; hint?: string };

/** Campo de formulário com rótulo e altura confortável para toque. */
export function Field({ label, name, hint, className, ...props }: FieldProps) {
  const hintId = hint ? `${name}-dica` : undefined;
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={name} className="text-base">
        {label}
      </Label>
      <Input
        id={name}
        name={name}
        aria-describedby={hintId}
        className={cn("h-12 px-3 text-base md:text-base", className)}
        {...props}
      />
      {hint && (
        <p id={hintId} className="text-sm text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}

/** Mensagem de erro ou sucesso anunciada por leitores de tela. */
export function FormMessage({ error, success }: { error?: string; success?: string }) {
  if (!error && !success) return null;
  return (
    <p
      role={error ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg p-3 text-base",
        error ? "bg-destructive/10 text-destructive" : "bg-glu-normal/10 text-glu-normal",
      )}
    >
      {error ? (
        <TriangleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
      ) : (
        <CircleCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
      )}
      <span>{error ?? success}</span>
    </p>
  );
}
