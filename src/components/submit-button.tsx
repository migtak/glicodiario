import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SubmitButton({
  pending,
  children,
  className,
}: {
  pending: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Button type="submit" disabled={pending} className={cn("h-12 w-full text-base", className)}>
      {pending ? "Aguarde…" : children}
    </Button>
  );
}
