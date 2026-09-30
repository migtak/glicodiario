import { redirect } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { OfflineProvider } from "@/components/offline-provider";
import { SyncStatus } from "@/components/sync-status";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  // o proxy já garante o login; aqui só pegamos o id (checagem local, sem rede)
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) redirect("/login");

  return (
    <OfflineProvider userId={userId}>
      <div className="flex min-h-dvh flex-1">
        <AppNav />
        <main className="min-w-0 flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pb-10 print:p-0">
          <div className="mx-auto w-full max-w-3xl print:max-w-none">
            <SyncStatus />
            {children}
          </div>
        </main>
      </div>
    </OfflineProvider>
  );
}
