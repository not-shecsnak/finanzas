import { TransactionForm } from "@/components/transaction-form";
import { todayIso } from "@/lib/dates";
import { getCategories, LOAD_ERROR } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export default async function NuevoMovimiento() {
  const supabase = await createClient();
  const { categories, error } = await getCategories(supabase);

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>
      {error || categories.length === 0 ? (
        <p role="alert" className="rounded-2xl border border-expense/40 bg-surface p-4 text-expense">
          {error ? LOAD_ERROR : "No tienes categorías. Se crean al registrar la cuenta; revisa la migración de Supabase."}
        </p>
      ) : (
        <TransactionForm
          categories={categories}
          initial={{ kind: "expense", amount: "", category_id: "", occurred_on: todayIso(), note: "" }}
        />
      )}
    </main>
  );
}
