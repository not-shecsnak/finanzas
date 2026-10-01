export type Kind = "income" | "expense";

export type TxLike = { kind: Kind; amount_cents: number; category_id: string };

export type Summary = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  /** Gasto por categoría, de mayor a menor. */
  expenseByCategory: { categoryId: string; cents: number }[];
};

/** Resumen del mes con aritmética entera (centavos). */
export function summarize(transactions: TxLike[]): Summary {
  let incomeCents = 0;
  let expenseCents = 0;
  const byCategory = new Map<string, number>();

  for (const t of transactions) {
    if (t.kind === "income") {
      incomeCents += t.amount_cents;
    } else {
      expenseCents += t.amount_cents;
      byCategory.set(t.category_id, (byCategory.get(t.category_id) ?? 0) + t.amount_cents);
    }
  }

  return {
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    expenseByCategory: [...byCategory]
      .map(([categoryId, cents]) => ({ categoryId, cents }))
      .sort((a, b) => b.cents - a.cents),
  };
}
