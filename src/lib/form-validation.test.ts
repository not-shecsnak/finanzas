import { describe, expect, it } from "vitest";
import { z } from "zod";
import { cardSchema } from "@/lib/credit-schema";
import { fieldErrors, firstInvalidField, pickFormFields, withoutError } from "@/lib/form-validation";
import { transactionSchema } from "@/lib/transaction-schema";

const CAT = "3f2b8c1e-5d4a-4e7b-9c6d-1a2b3c4d5e6f";
const valid = { kind: "expense", amount: "50.000", category_id: CAT, occurred_on: "2026-10-13", note: "" };

describe("fieldErrors con transactionSchema", () => {
  it("datos válidos: sin errores", () => {
    expect(fieldErrors(transactionSchema, valid)).toEqual({});
  });

  it("formulario vacío (FormData ausente = null): un mensaje por campo obligatorio", () => {
    const errors = fieldErrors(transactionSchema, { kind: "expense", amount: "", category_id: null, occurred_on: "", note: "" });
    expect(Object.keys(errors).sort()).toEqual(["amount", "category_id", "occurred_on"]);
    expect(errors.amount).toMatch(/Monto no válido/);
    expect(errors.category_id).toBe("Elige una categoría");
    expect(errors.occurred_on).toBe("Fecha no válida");
  });

  it("usa issue.path: el error cae en el campo que lo causó", () => {
    expect(fieldErrors(transactionSchema, { ...valid, note: "x".repeat(201) })).toEqual({
      note: "La nota admite máximo 200 caracteres",
    });
    expect(fieldErrors(transactionSchema, { ...valid, occurred_on: "1999-01-01" })).toEqual({
      occurred_on: "Fecha no válida (años 2000 a 2100)",
    });
    expect(fieldErrors(transactionSchema, { ...valid, kind: "otro" })).toEqual({ kind: "Elige ingreso o gasto" });
  });

  it("devuelve solo el primer mensaje por campo", () => {
    const schema = z.object({ a: z.string().min(3, "corto").regex(/^\d+$/, "solo dígitos") });
    expect(fieldErrors(schema, { a: "x" })).toEqual({ a: "corto" });
  });

  it("monto en formato colombiano es válido, ambiguo no", () => {
    expect(fieldErrors(transactionSchema, { ...valid, amount: "1.500.000" })).toEqual({});
    expect(fieldErrors(transactionSchema, { ...valid, amount: "1,234" }).amount).toMatch(/Monto no válido/);
  });
});

describe("fieldErrors con cardSchema", () => {
  const card = { name: "Mi tarjeta", limit: "2.000.000", statement_day: "15", due_day: "30" };

  it("válido", () => {
    expect(fieldErrors(cardSchema, card)).toEqual({});
  });

  it("vacío: error en los cuatro campos", () => {
    const errors = fieldErrors(cardSchema, { name: "", limit: "", statement_day: "", due_day: "" });
    expect(Object.keys(errors).sort()).toEqual(["due_day", "limit", "name", "statement_day"]);
    expect(errors.name).toBe("Escribe el nombre de la tarjeta");
  });

  it("día fuera de rango", () => {
    expect(fieldErrors(cardSchema, { ...card, statement_day: "32" })).toEqual({ statement_day: "Día de corte no válido (1 a 31)" });
    expect(fieldErrors(cardSchema, { ...card, due_day: "0" })).toEqual({ due_day: "Día de pago no válido (1 a 31)" });
  });
});

describe("errores sin ruta", () => {
  it("se agrupan bajo _form", () => {
    const schema = z.object({ a: z.string() }).refine(() => false, "mal");
    expect(fieldErrors(schema, { a: "x" })).toEqual({ _form: "mal" });
  });
});

describe("firstInvalidField", () => {
  it("respeta el orden del formulario, no el del objeto de errores", () => {
    const errors = { note: "n", amount: "a", category_id: "c" };
    expect(firstInvalidField(errors, ["kind", "amount", "category_id", "occurred_on", "note"])).toBe("amount");
  });
  it("undefined si no hay errores", () => {
    expect(firstInvalidField({}, ["a", "b"])).toBeUndefined();
  });
});

describe("withoutError", () => {
  it("quita solo el campo indicado sin mutar el original", () => {
    const errors = { a: "1", b: "2" };
    expect(withoutError(errors, "a")).toEqual({ b: "2" });
    expect(errors).toEqual({ a: "1", b: "2" });
  });
  it("si no estaba, devuelve el mismo objeto", () => {
    const errors = { a: "1" };
    expect(withoutError(errors, "z")).toBe(errors);
  });
});

describe("pickFormFields", () => {
  it("toma los campos pedidos y deja null los ausentes", () => {
    const fd = new FormData();
    fd.set("kind", "expense");
    fd.set("extra", "ignorado");
    expect(pickFormFields(fd, ["kind", "category_id"])).toEqual({ kind: "expense", category_id: null });
  });
});
