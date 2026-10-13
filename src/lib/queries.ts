import type { SupabaseClient } from "@supabase/supabase-js";
import { monthRange } from "@/lib/dates";
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

export async function getMonthTransactions(supabase: SupabaseClient, month: string, categoryId?: string) {
  const { from, to } = monthRange(month);
  let query = supabase
    .from("transactions")
    .select("id, kind, amount_cents, category_id, occurred_on, note")
    .gte("occurred_on", from)
    .lt("occurred_on", to)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  return { transactions: (data ?? []) as TxRow[], error };
}
