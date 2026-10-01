import { notFound } from "next/navigation";
import { z } from "zod";
import { TransactionForm } from "@/components/transaction-form";
import { getCategories, LOAD_ERROR, type TxRow } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { deleteTransaction } from "../actions";

export default async function EditarMovimiento({ params }: { params: Promise<{ id: string }> }) {
  const id = z.uuid().safeParse((await params).id);
  if (!id.success) notFound();

  const supabase = await createClient();
  const [{ data, error }, { categories, error: catError }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, kind, amount_cents, category_id, occurred_on, note")
      .eq("id", id.data)
      .maybeSingle(),
    getCategories(supabase),
  ]);

  if (error || catError) {
    return (
      <p role="alert" className="rounded-2xl border border-expense/40 bg-surface p-4 text-expense">
        {LOAD_ERROR}
      </p>
    );
  }
  if (!data) notFound();
  const tx = data as TxRow;

  // Mostrar el monto como texto editable sin usar float: 15050 -> "150.50".
  const amount = `${Math.trunc(tx.amount_cents / 100)}.${String(tx.amount_cents % 100).padStart(2, "0")}`;

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Editar movimiento</h1>
      <TransactionForm
        categories={categories}
        initial={{
          id: tx.id,
          kind: tx.kind,
          amount,
          category_id: tx.category_id,
          occurred_on: tx.occurred_on,
          note: tx.note ?? "",
        }}
      />

      <details className="rounded-2xl border border-border bg-surface p-4">
        <summary className="min-h-11 cursor-pointer text-expense">Eliminar movimiento</summary>
        <form action={deleteTransaction} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="id" value={tx.id} />
          <p className="text-sm text-muted">Esta acción no se puede deshacer.</p>
          <button
            type="submit"
            className="min-h-11 rounded-xl bg-expense px-4 font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
          >
            Sí, eliminar
          </button>
        </form>
      </details>
    </main>
  );
}
