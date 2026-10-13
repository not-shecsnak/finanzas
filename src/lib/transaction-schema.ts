import { z } from "zod";
import { isSupportedYear } from "@/lib/dates";
import { parseToCents } from "@/lib/money";

/** Valida el formulario de movimiento (todo llega como texto). Salida lista para la base. */
export const transactionSchema = z.object({
  kind: z.enum(["income", "expense"], { error: "Elige ingreso o gasto" }),
  amount: z.string().transform((value, ctx) => {
    const cents = parseToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Monto no válido. Escribe por ejemplo 50000, 50.000 o 150,50" });
      return z.NEVER;
    }
    return cents;
  }),
  category_id: z.uuid({ error: "Elige una categoría" }),
  occurred_on: z.iso
    .date({ error: "Fecha no válida" })
    .refine((d) => isSupportedYear(Number(d.slice(0, 4))), "Fecha no válida (años 2000 a 2100)"),
  note: z
    .string()
    .trim()
    .max(200, "La nota admite máximo 200 caracteres")
    .transform((v) => (v === "" ? null : v)),
});

export type TransactionInput = z.output<typeof transactionSchema>;
