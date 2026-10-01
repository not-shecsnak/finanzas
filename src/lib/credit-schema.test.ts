import { describe, expect, it } from "vitest";
import { balanceSchema, cardSchema } from "./credit-schema";

const card = { name: " Nu ", limit: "2.000.000", statement_day: "15", due_day: "31" };
const ID = "123e4567-e89b-42d3-a456-426614174000";

describe("cardSchema", () => {
  it("acepta una tarjeta válida", () => {
    expect(cardSchema.parse(card)).toEqual({ name: "Nu", limit: 200_000_000, statement_day: 15, due_day: 31 });
  });
  it("rechaza límite 0, vacío o basura", () => {
    for (const limit of ["0", "", "abc", "-5"]) expect(cardSchema.safeParse({ ...card, limit }).success).toBe(false);
  });
  it("rechaza días fuera de 1 a 31", () => {
    for (const d of ["0", "32", "", "1.5", "-1", "abc"]) {
      expect(cardSchema.safeParse({ ...card, due_day: d }).success).toBe(false);
      expect(cardSchema.safeParse({ ...card, statement_day: d }).success).toBe(false);
    }
  });
  it("rechaza nombre vacío o largo", () => {
    expect(cardSchema.safeParse({ ...card, name: "  " }).success).toBe(false);
    expect(cardSchema.safeParse({ ...card, name: "x".repeat(41) }).success).toBe(false);
  });
});

describe("balanceSchema", () => {
  const base = { card_id: ID, month: "2026-10", balance: "350.000" };
  it("acepta saldo positivo y cero", () => {
    expect(balanceSchema.parse(base).balance).toBe(35_000_000);
    expect(balanceSchema.parse({ ...base, balance: "0" }).balance).toBe(0);
  });
  it("rechaza saldo inválido, tarjeta y mes inválidos", () => {
    expect(balanceSchema.safeParse({ ...base, balance: "-1" }).success).toBe(false);
    expect(balanceSchema.safeParse({ ...base, balance: "" }).success).toBe(false);
    expect(balanceSchema.safeParse({ ...base, card_id: "x" }).success).toBe(false);
    expect(balanceSchema.safeParse({ ...base, month: "2026-13" }).success).toBe(false);
  });
});
