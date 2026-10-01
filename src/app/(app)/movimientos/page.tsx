import Link from "next/link";
import { z } from "zod";
import { AddFab } from "@/components/fab";
import { MonthPicker } from "@/components/month-picker";
import { SummaryCards } from "@/components/summary-cards";
import { sanitizeMonth } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { getCategories, getMonthTransactions, LOAD_ERROR } from "@/lib/queries";
import { summarize } from "@/lib/summary";
import { createClient } from "@/lib/supabase/server";

export default async function Movimientos({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string; categoria?: string }>;
}) {
  const sp = await searchParams;
  const month = sanitizeMonth(sp.mes);
  const category = z.uuid().safeParse(sp.categoria);
  const categoryId = category.success ? category.data : undefined;

  const supabase = await createClient();
  const [{ transactions, error: txError }, { categories, error: catError }] = await Promise.all([
    getMonthTransactions(supabase, month, categoryId),
    getCategories(supabase),
  ]);
  if (txError || catError) console.error("[movimientos]", txError?.message ?? catError?.message);

  const names = new Map(categories.map((c) => [c.id, c]));
  const summary = summarize(transactions);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <MonthPicker month={month} basePath="/movimientos" extra={categoryId ? `&categoria=${categoryId}` : ""} />

      <form method="get" className="flex gap-2">
        <input type="hidden" name="mes" value={month} />
        <label className="sr-only" htmlFor="categoria">
          Filtrar por categoría
        </label>
        <select id="categoria" name="categoria" defaultValue={categoryId ?? ""} className="min-h-11 flex-1 rounded-xl border border-border bg-bg px-3 text-ink">
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <button type="submit" className="min-h-11 rounded-xl border border-border px-4 text-ink focus-visible:outline-2 focus-visible:outline-accent-soft">
          Filtrar
        </button>
      </form>

      {txError || catError ? (
        <p role="alert" className="rounded-2xl border border-expense/40 bg-surface p-4 text-expense">
          {LOAD_ERROR}
        </p>
      ) : (
        <>
          <SummaryCards summary={summary} />
          {transactions.length === 0 ? (
            <p className="text-muted">No hay movimientos en este mes. Toca + para agregar uno.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {transactions.map((t) => {
                const cat = names.get(t.category_id);
                return (
                  <li key={t.id}>
                    <Link
                      href={`/movimientos/${t.id}`}
                      className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3 focus-visible:outline-2 focus-visible:outline-accent-soft"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span aria-hidden="true" className="h-3 w-3 shrink-0 rounded-full" style={{ background: cat?.color ?? "#8b5cf6" }} />
                        <span className="min-w-0">
                          <span className="block truncate">{t.note || cat?.name || "Movimiento"}</span>
                          <span className="block text-sm text-muted">
                            {cat?.name ?? "Sin categoría"} · {t.occurred_on}
                          </span>
                        </span>
                      </span>
                      <span className={t.kind === "income" ? "text-income" : "text-expense"}>
                        {t.kind === "income" ? "+" : "−"}
                        {formatCents(t.amount_cents)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      <AddFab />
    </main>
  );
}
