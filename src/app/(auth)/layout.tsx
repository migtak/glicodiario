import { Droplet } from "lucide-react";
import { LimparAoSair } from "@/components/service-worker";
import { DISCLAIMER_TEXT } from "@/lib/disclaimer";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center bg-muted/40 px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-2xl font-semibold text-primary">
        <Droplet className="size-8" aria-hidden />
        GlicoDiário
      </div>
      <main className="w-full max-w-md rounded-xl border bg-background p-6 shadow-sm sm:p-8">
        {children}
      </main>
      <p className="mt-6 max-w-md text-center text-sm text-muted-foreground">{DISCLAIMER_TEXT}</p>
      <LimparAoSair />
    </div>
  );
}
