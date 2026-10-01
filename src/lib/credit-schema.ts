import { z } from "zod";
import { parseToCents } from "@/lib/money";

const day = (label: string) =>
  z
    .string()
    .regex(/^\d{1,2}$/, `${label} no válido (1 a 31)`)
    .transform(Number)
    .refine((n) => n >= 1 && n <= 31, `${label} no válido (1 a 31)`);

/** Alta de tarjeta. El límite debe ser mayor que 0 (parseToCents ya lo exige). */
export const cardSchema = z.object({
  name: z.string().trim().min(1, "Escribe el nombre de la tarjeta").max(40, "El nombre admite máximo 40 caracteres"),
  limit: z.string().transform((value, ctx) => {
    const cents = parseToCents(value);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Límite no válido. Debe ser mayor que 0, por ejemplo 2.000.000" });
      return z.NEVER;
    }
    return cents;
  }),
  statement_day: day("Día de corte"),
  due_day: day("Día de pago"),
});

/** Saldo del mes de una tarjeta; 0 es válido. */
export const balanceSchema = z.object({
  card_id: z.uuid({ error: "Tarjeta no válida" }),
  month: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Mes no válido"),
  balance: z.string().transform((value, ctx) => {
    const s = value.trim();
    const cents = /^0+(?:[.,]0{1,2})?$/.test(s) ? 0 : parseToCents(s);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "Saldo no válido. Escribe por ejemplo 350.000 (o 0)" });
      return z.NEVER;
    }
    return cents;
  }),
});
