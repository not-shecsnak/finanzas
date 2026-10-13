"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { balanceSchema, cardSchema } from "@/lib/credit-schema";
import { monthRange } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

export async function saveCard(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = cardSchema.safeParse({
    name: formData.get("name") ?? "",
    limit: formData.get("limit") ?? "",
    statement_day: formData.get("statement_day") ?? "",
    due_day: formData.get("due_day") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { name, limit, statement_day, due_day } = parsed.data;
  const { data, error } = await supabase
    .from("credit_cards")
    .insert({ name, limit_cents: limit, statement_day, due_day })
    .select("id");
  if (error || data?.length !== 1) {
    console.error(
      "[saveCard]",
      error?.code,
      error?.message ?? "0 filas afectadas",
    );
    return { error: "No se pudo guardar la tarjeta. Inténtalo de nuevo." };
  }
  redirect("/credito");
}

/** Un registro por tarjeta y mes: si ya existe se actualiza (upsert por card_id + month). */
export async function saveBalance(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = balanceSchema.safeParse({
    card_id: formData.get("card_id"),
    month: formData.get("month"),
    balance: formData.get("balance") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("card_balances")
    .upsert(
      {
        card_id: parsed.data.card_id,
        month: monthRange(parsed.data.month).from,
        balance_cents: parsed.data.balance,
      },
      { onConflict: "card_id,month" },
    )
    .select("id");
  if (error || data?.length !== 1) {
    console.error(
      "[saveBalance]",
      error?.code,
      error?.message ?? "0 filas afectadas",
    );
    return { error: "No se pudo guardar el saldo. Inténtalo de nuevo." };
  }
  revalidatePath("/credito");
  return { ok: true };
}
