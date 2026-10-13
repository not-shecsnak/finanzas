import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/dates";
import { fetchAllPages } from "@/lib/paginate";
import type { Kind } from "@/lib/summary";

export type Category = { id: string; name: string; kind: Kind; color: string };

export type TxRow = {
  id: string;
  kind: Kind;
  amount_cents: number;
  category_id: string;
  occurred_on: string;
  note: string | null;
};

export const LOAD_ERROR =
  "No se pudieron cargar tus datos. Confirma que aplicaste la migración de Supabase y que las variables del .env son correctas.";

export async function getCategories(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("categories").select("id, name, kind, color").order("name");
  return { categories: (data ?? []) as Category[], error };
}

/** Máximo de filas que se muestran en la lista; el resumen siempre usa todas las del mes. */
export const LIST_LIMIT = 200;

/** Todas las filas del mes (paginadas) para que los totales sean exactos. */
export async function getMonthTransactions(supabase: SupabaseClient, month: string, categoryId?: string) {
  const { from, to } = monthRange(month);
  const { rows, error, truncated } = await fetchAllPages<TxRow>((start, end) => {
    let query = supabase
      .from("transactions")
      .select("id, kind, amount_cents, category_id, occurred_on, note")
      .gte("occurred_on", from)
      .lt("occurred_on", to)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false }); // desempate estable entre bloques
    if (categoryId) query = query.eq("category_id", categoryId);
    return query.range(start, end);
  });
  return { transactions: rows, error, truncated };
}

export type CardRow = { id: string; name: string; limit_cents: number; statement_day: number; due_day: number };
export type BalanceRow = { card_id: string; balance_cents: number };

export async function getCards(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("credit_cards")
    .select("id, name, limit_cents, statement_day, due_day")
    .order("created_at");
  return { cards: (data ?? []) as CardRow[], error };
}

/** Saldos registrados para un mes "YYYY-MM" (month se guarda como primer día del mes). */
export async function getCardBalances(supabase: SupabaseClient, month: string) {
  const { from } = monthRange(month);
  const { data, error } = await supabase.from("card_balances").select("card_id, balance_cents").eq("month", from);
  return { balances: (data ?? []) as BalanceRow[], error };
}
