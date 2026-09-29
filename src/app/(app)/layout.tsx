import { AppNav } from "@/components/app-nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1">
      <AppNav />
      <main className="flex-1 px-4 pt-6 pb-28 sm:px-6 md:px-10 md:pb-10">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}
