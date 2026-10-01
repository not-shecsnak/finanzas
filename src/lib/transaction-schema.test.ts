import { describe, expect, it } from "vitest";
import { transactionSchema } from "./transaction-schema";

const valid = {
  kind: "expense",
  amount: "150,50",
  category_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
  occurred_on: "2026-10-01",
  note: "  tacos  ",
};

describe("transactionSchema", () => {
  it("convierte el monto a centavos y limpia la nota", () => {
    const r = transactionSchema.parse(valid);
    expect(r.amount).toBe(15050);
    expect(r.note).toBe("tacos");
  });

  it("acepta miles con punto", () => {
    expect(transactionSchema.parse({ ...valid, amount: "50.000" }).amount).toBe(5000000);
  });

  it("deja la nota vacía como null", () => {
    expect(transactionSchema.parse({ ...valid, note: "   " }).note).toBeNull();
  });

  it.each([
    ["monto inválido", { amount: "abc" }],
    ["monto cero", { amount: "0" }],
    ["tipo inválido", { kind: "otro" }],
    ["categoría que no es uuid", { category_id: "1; drop table" }],
    ["fecha inválida", { occurred_on: "2026-13-45" }],
    ["nota demasiado larga", { note: "x".repeat(201) }],
  ])("rechaza %s", (_name, override) => {
    expect(transactionSchema.safeParse({ ...valid, ...override }).success).toBe(false);
  });
});
