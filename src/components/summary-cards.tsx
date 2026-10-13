import { formatCents } from "@/lib/money";
import type { Summary } from "@/lib/summary";

export function SummaryCards({ summary }: { summary: Summary }) {
  const cards = [
    { label: "Ingresos", cents: summary.incomeCents, color: "text-income" },
    { label: "Gastos", cents: summary.expenseCents, color: "text-expense" },
    { label: "Saldo del mes", cents: summary.balanceCents, color: summary.balanceCents < 0 ? "text-expense" : "text-ink" },
  ];

  return (
    <section aria-label="Resumen del mes" className="grid gap-3 sm:grid-cols-3">
      {cards.map((c) => (
        <div key={c.label} className="rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm text-muted">{c.label}</p>
          <p className={`mt-1 text-xl font-semibold ${c.color}`}>{formatCents(c.cents)}</p>
        </div>
      ))}
    </section>
  );
}
