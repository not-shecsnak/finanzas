import Link from "next/link";
import { logout } from "@/app/login/actions";
import { AddFab } from "@/components/fab";
import { MonthPicker } from "@/components/month-picker";
import { SummaryCards } from "@/components/summary-cards";
import { sanitizeMonth } from "@/lib/dates";
import { formatCents } from "@/lib/money";
import { getCategories, getMonthTransactions, LOAD_ERROR } from "@/lib/queries";
import { summarize } from "@/lib/summary";
import { createClient } from "@/lib/supabase/server";

export default async function Inicio({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const month = sanitizeMonth((await searchParams).mes);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ transactions, error: txError }, { categories, error: catError }] = await Promise.all([
    getMonthTransactions(supabase, month),
    getCategories(supabase),
  ]);
  const failed = Boolean(txError || catError);
  if (failed) console.error("[inicio]", txError?.message ?? catError?.message);

  const summary = summarize(transactions);
  const names = new Map(categories.map((c) => [c.id, c]));

  return (
    <main className="flex flex-col gap-6">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{user?.email}</p>
          <h1 className="text-2xl font-semibold">Tus finanzas</h1>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="min-h-11 rounded-xl border border-border px-3 text-sm text-muted focus-visible:outline-2 focus-visible:outline-accent-soft"
          >
            Salir
          </button>
        </form>
      </header>

      <MonthPicker month={month} basePath="/" />

      {failed ? (
        <p role="alert" className="rounded-2xl border border-expense/40 bg-surface p-4 text-expense">
          {LOAD_ERROR}
        </p>
      ) : (
        <>
          <SummaryCards summary={summary} />

          <section aria-label="Gasto por categoría" className="rounded-2xl border border-border bg-surface p-4">
            <h2 className="mb-3 font-medium">Gasto por categoría</h2>
            {summary.expenseByCategory.length === 0 ? (
              <p className="text-muted">Aún no hay gastos este mes. Toca + para agregar el primero.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {summary.expenseByCategory.map(({ categoryId, cents }) => {
                  const cat = names.get(categoryId);
                  const pct = Math.round((cents / summary.expenseCents) * 100);
                  return (
                    <li key={categoryId}>
                      <div className="flex justify-between text-sm">
                        <span>{cat?.name ?? "Sin categoría"}</span>
                        <span className="text-muted">
                          {formatCents(cents)} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1 h-2 rounded-full bg-bg" role="presentation">
                        <div className="h-2 rounded-full" style={{ width: `${pct}%`, background: cat?.color ?? "#8b5cf6" }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          <Link href={`/movimientos?mes=${month}`} className="text-accent-soft underline-offset-4 hover:underline">
            Ver todos los movimientos →
          </Link>
        </>
      )}

      <AddFab />
    </main>
  );
}
