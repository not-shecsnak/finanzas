import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseMock, redirectTarget, type MockOptions } from "@/test/supabase-mock";
import { saveBalance, saveCard } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", async () => (await import("@/test/supabase-mock")).navigationMock());
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const CARD = "33333333-3333-4333-8333-333333333333";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}
const validCard = { name: " Visa ", limit: "2.000.000", statement_day: "5", due_day: "20" };
const validBalance = { card_id: CARD, month: "2026-03", balance: "350.000" };

function setup(opts: MockOptions = {}) {
  const mock = createSupabaseMock(opts);
  vi.mocked(createClient).mockResolvedValue(mock.client as never);
  return mock;
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.clearAllMocks());

describe("saveCard", () => {
  it("camino feliz: inserta limit_cents en centavos y redirige a /credito", async () => {
    const m = setup({ results: { "credit_cards.insert": { data: [{ id: CARD }], error: null } } });
    expect(await redirectTarget(() => saveCard({}, form(validCard)))).toBe("/credito");
    expect(m.writes()).toHaveLength(1);
    expect(m.writes()[0]).toMatchObject({
      table: "credit_cards",
      op: "insert",
      payload: { name: "Visa", limit_cents: 200000000, statement_day: 5, due_day: 20 },
    });
  });

  it("validación fallida: error y sin BD", async () => {
    setup();
    const res = await saveCard({}, form({ ...validCard, statement_day: "40" }));
    expect(res.error).toMatch(/Día de corte no válido/);
    // Devuelve lo enviado para repoblar el formulario (React 19 lo resetea tras la action).
    expect(res.values).toEqual({ name: " Visa ", statement_day: "40", due_day: "20" });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("sin sesión redirige a /login y no escribe", async () => {
    const m = setup({ user: null });
    expect(await redirectTarget(() => saveCard({}, form(validCard)))).toBe("/login");
    expect(m.writes()).toHaveLength(0);
  });

  it("error de BD: mensaje genérico sin filtrar el interno", async () => {
    setup({ results: { "credit_cards.insert": { data: null, error: { code: "42501", message: "policy secreta" } } } });
    const res = await saveCard({}, form(validCard));
    expect(res).toEqual({
      error: "No se pudo guardar la tarjeta. Inténtalo de nuevo.",
      values: { name: " Visa ", statement_day: "5", due_day: "20" },
    });
    expect(errorSpy).toHaveBeenCalledWith("[saveCard]", "42501", "policy secreta");
  });

  it("0 filas afectadas: error genérico y no redirige", async () => {
    setup({ results: { "credit_cards.insert": { data: [], error: null } } });
    const res = await saveCard({}, form(validCard));
    expect(res.error).toBe("No se pudo guardar la tarjeta. Inténtalo de nuevo.");
    expect(errorSpy).toHaveBeenCalledWith("[saveCard]", undefined, "0 filas afectadas");
  });
});

describe("saveBalance", () => {
  it("camino feliz: upsert por card_id+month con primer día del mes y centavos; revalida", async () => {
    const m = setup({ results: { "card_balances.upsert": { data: [{ id: "b1" }], error: null } } });
    const res = await saveBalance({}, form(validBalance));
    expect(res).toEqual({ ok: true });
    expect(m.writes()[0]).toMatchObject({
      table: "card_balances",
      op: "upsert",
      payload: { card_id: CARD, month: "2026-03-01", balance_cents: 35000000 },
      options: { onConflict: "card_id,month" },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/credito");
  });

  it("saldo 0 es válido", async () => {
    const m = setup({ results: { "card_balances.upsert": { data: [{ id: "b1" }], error: null } } });
    expect(await saveBalance({}, form({ ...validBalance, balance: "0" }))).toEqual({ ok: true });
    expect(m.writes()[0].payload).toMatchObject({ balance_cents: 0 });
  });

  it("validación fallida (tarjeta no uuid): error y sin BD", async () => {
    setup();
    const res = await saveBalance({}, form({ ...validBalance, card_id: "abc" }));
    expect(res.error).toBe("Tarjeta no válida");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("sin sesión redirige a /login y no escribe", async () => {
    const m = setup({ user: null });
    expect(await redirectTarget(() => saveBalance({}, form(validBalance)))).toBe("/login");
    expect(m.writes()).toHaveLength(0);
  });

  it("error de BD: mensaje genérico, sin revalidar", async () => {
    setup({ results: { "card_balances.upsert": { data: null, error: { code: "23503", message: "fk interna" } } } });
    const res = await saveBalance({}, form(validBalance));
    expect(res).toEqual({ error: "No se pudo guardar el saldo. Inténtalo de nuevo." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("0 filas afectadas (tarjeta ajena por RLS): error y sin revalidar", async () => {
    setup({ results: { "card_balances.upsert": { data: [], error: null } } });
    const res = await saveBalance({}, form(validBalance));
    expect(res.error).toBe("No se pudo guardar el saldo. Inténtalo de nuevo.");
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
