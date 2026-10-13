import Link from "next/link";
import { monthLabel, shiftMonth } from "@/lib/dates";

const linkClass =
  "flex h-11 w-11 items-center justify-center rounded-xl border border-border text-lg focus-visible:outline-2 focus-visible:outline-accent-soft";

export function MonthPicker({ month, basePath, extra = "" }: { month: string; basePath: string; extra?: string }) {
  const href = (m: string) => `${basePath}?mes=${m}${extra}`;
  return (
    <div className="flex items-center justify-between gap-3">
      <Link href={href(shiftMonth(month, -1))} aria-label="Mes anterior" className={linkClass}>
        ‹
      </Link>
      <p className="text-lg font-medium capitalize" aria-live="polite">
        {monthLabel(month)}
      </p>
      <Link href={href(shiftMonth(month, 1))} aria-label="Mes siguiente" className={linkClass}>
        ›
      </Link>
    </div>
  );
}
