"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { transactionSchema } from "@/lib/transaction-schema";

export type FormState = { error?: string };

const idSchema = z.uuid();

export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transactionSchema.safeParse({
    kind: formData.get("kind"),
    amount: formData.get("amount"),
    category_id: formData.get("category_id"),
    occurred_on: formData.get("occurred_on"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Movimiento no válido" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // La categoría debe existir (RLS solo deja ver las propias) y coincidir con el tipo.
  const { data: category } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.category_id)
    .maybeSingle();
  if (!category || category.kind !== parsed.data.kind) {
    return { error: "La categoría no corresponde al tipo de movimiento" };
  }

  const { amount, ...rest } = parsed.data;
  const row = { ...rest, amount_cents: amount };
  const { error } = id
    ? await supabase.from("transactions").update(row).eq("id", id.data)
    : await supabase.from("transactions").insert(row);

  if (error) {
    console.error("[saveTransaction]", error.code, error.message);
    return { error: "No se pudo guardar el movimiento. Inténtalo de nuevo." };
  }
  redirect(`/movimientos?mes=${parsed.data.occurred_on.slice(0, 7)}`);
}

export async function deleteTransaction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/movimientos");

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").delete().eq("id", id.data);
  if (error) console.error("[deleteTransaction]", error.code, error.message);
  redirect("/movimientos");
}
