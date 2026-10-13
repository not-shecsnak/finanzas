import { describe, expect, it } from "vitest";
import { summarize } from "./summary";

describe("summarize", () => {
  it("devuelve ceros sin movimientos", () => {
    expect(summarize([])).toEqual({ incomeCents: 0, expenseCents: 0, balanceCents: 0, expenseByCategory: [] });
  });

  it("suma ingresos, gastos y saldo en centavos", () => {
    const s = summarize([
      { kind: "income", amount_cents: 500000, category_id: "sueldo" },
      { kind: "expense", amount_cents: 12050, category_id: "comida" },
      { kind: "expense", amount_cents: 7950, category_id: "comida" },
      { kind: "expense", amount_cents: 30000, category_id: "ocio" },
    ]);
    expect(s.incomeCents).toBe(500000);
    expect(s.expenseCents).toBe(50000);
    expect(s.balanceCents).toBe(450000);
  });

  it("agrupa gastos por categoría ordenados de mayor a menor", () => {
    const s = summarize([
      { kind: "expense", amount_cents: 100, category_id: "a" },
      { kind: "expense", amount_cents: 300, category_id: "b" },
      { kind: "expense", amount_cents: 50, category_id: "a" },
      { kind: "income", amount_cents: 999, category_id: "c" },
    ]);
    expect(s.expenseByCategory).toEqual([
      { categoryId: "b", cents: 300 },
      { categoryId: "a", cents: 150 },
    ]);
  });

  it("permite saldo negativo", () => {
    const s = summarize([{ kind: "expense", amount_cents: 100, category_id: "a" }]);
    expect(s.balanceCents).toBe(-100);
  });
});
