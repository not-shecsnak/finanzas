import { z } from "zod";
import { parseToCents } from "@/lib/money";

/** Valida el formulario de movimiento (todo llega como texto). Salida lista para la base. */
export const transactionSchema = z.object({
  kind: z.enum(["income", "expense"], { error: "Elige ingreso o gasto" }),
  amount: z.string().transform((value, ctx) => {
    const cents = parseToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Monto no válido. Usa solo números, por ejemplo 150.50" });
      return z.NEVER;
    }
    return cents;
  }),
  category_id: z.uuid({ error: "Elige una categoría" }),
  occurred_on: z.iso.date({ error: "Fecha no válida" }),
  note: z
    .string()
    .trim()
    .max(200, "La nota admite máximo 200 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type TransactionInput = z.output<typeof transactionSchema>;
