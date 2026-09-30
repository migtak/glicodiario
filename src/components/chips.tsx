import Link from "next/link";
import { cn } from "@/lib/utils";

/** Fileira de filtros em formato de pílula (links), com rolagem lateral própria no celular. */
export function Chips({
  label,
  items,
}: {
  label: string;
  items: { label: string; href: string; active: boolean }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {items.map((item) => (
          <li key={item.label} className="shrink-0">
            <Link
              href={item.href}
              scroll={false}
              aria-current={item.active ? "true" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-4 text-base",
                item.active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
