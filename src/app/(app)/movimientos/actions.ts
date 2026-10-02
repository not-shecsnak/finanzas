"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/supabase/require-user";
import { transactionSchema } from "@/lib/transaction-schema";

/** Valores devueltos tras un error para que React 19 no los pierda al resetear el formulario. */
export type FormValues = { kind: string; amount: string; category_id: string; occurred_on: string; note: string };
export type FormState = { error?: string; values?: FormValues };

function text(formData: FormData, name: string): string {
  const v = formData.get(name);
  return typeof v === "string" ? v : "";
}

function values(formData: FormData): FormValues {
  return {
    kind: text(formData, "kind"),
    amount: text(formData, "amount"),
    category_id: text(formData, "category_id"),
    occurred_on: text(formData, "occurred_on"),
    note: text(formData, "note"),
  };
}

const idSchema = z.uuid();

export async function saveTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = transactionSchema.safeParse({
    kind: formData.get("kind"),
    amount: formData.get("amount"),
    category_id: formData.get("category_id"),
    occurred_on: formData.get("occurred_on"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message, values: values(formData) };

  const rawId = formData.get("id");
  const id = rawId ? idSchema.safeParse(rawId) : null;
  if (id && !id.success) return { error: "Movimiento no válido", values: values(formData) };

  const { supabase } = await requireUser();

  // La categoría debe existir (RLS solo deja ver las propias) y coincidir con el tipo.
  const { data: category } = await supabase
    .from("categories")
    .select("kind")
    .eq("id", parsed.data.category_id)
    .maybeSingle();
  if (!category || category.kind !== parsed.data.kind) {
    return { error: "La categoría no corresponde al tipo de movimiento", values: values(formData) };
  }

  const { amount, ...rest } = parsed.data;
  const row = { ...rest, amount_cents: amount };
  // .select("id") devuelve las filas afectadas: RLS filtra sin error, así que 0 filas = no se guardó.
  const { data, error } = id
    ? await supabase.from("transactions").update(row).eq("id", id.data).select("id")
    : await supabase.from("transactions").insert(row).select("id");

  if (error) {
    console.error("[saveTransaction]", error.code, error.message);
    return { error: "No se pudo guardar el movimiento. Inténtalo de nuevo.", values: values(formData) };
  }
  if (data?.length !== 1) {
    console.error("[saveTransaction] filas afectadas:", data?.length ?? 0);
    return { error: "No se encontró el movimiento o no tienes permiso para modificarlo.", values: values(formData) };
  }
  redirect(`/movimientos?mes=${parsed.data.occurred_on.slice(0, 7)}`);
}

export async function deleteTransaction(formData: FormData) {
  const id = idSchema.safeParse(formData.get("id"));
  if (!id.success) redirect("/movimientos");

  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("transactions").delete().eq("id", id.data).select("id");
  if (error || data?.length !== 1) {
    console.error("[deleteTransaction]", error?.code, error?.message ?? `filas afectadas: ${data?.length ?? 0}`);
    redirect(`/movimientos/${id.data}?error=eliminar`);
  }
  redirect("/movimientos");
}
