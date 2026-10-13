import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseMock, redirectTarget, type MockOptions } from "@/test/supabase-mock";
import { deleteTransaction, saveTransaction } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", async () => (await import("@/test/supabase-mock")).navigationMock());
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const CAT = "11111111-1111-4111-8111-111111111111";
const TX = "22222222-2222-4222-8222-222222222222";

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}
const valid = { kind: "expense", amount: "50.000", category_id: CAT, occurred_on: "2026-03-15", note: " cena " };

function setup(opts: MockOptions = {}) {
  const mock = createSupabaseMock({
    ...opts,
    results: { "categories.select": { data: { kind: "expense" }, error: null }, ...opts.results },
  });
  vi.mocked(createClient).mockResolvedValue(mock.client as never);
  return mock;
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.clearAllMocks());

describe("saveTransaction", () => {
  it("camino feliz (alta): inserta amount_cents en centavos y redirige al mes", async () => {
    const m = setup({ results: { "transactions.insert": { data: [{ id: TX }], error: null } } });
    const url = await redirectTarget(() => saveTransaction({}, form(valid)));
    expect(url).toBe("/movimientos?mes=2026-03");
    expect(m.writes()).toHaveLength(1);
    expect(m.writes()[0]).toMatchObject({
      table: "transactions",
      op: "insert",
      payload: { kind: "expense", amount_cents: 5000000, category_id: CAT, occurred_on: "2026-03-15", note: "cena" },
    });
    expect(m.writes()[0].payload).not.toHaveProperty("amount");
  });

  it("camino feliz (edición): actualiza filtrando por el id", async () => {
    const m = setup({ results: { "transactions.update": { data: [{ id: TX }], error: null } } });
    const url = await redirectTarget(() => saveTransaction({}, form({ ...valid, id: TX })));
    expect(url).toBe("/movimientos?mes=2026-03");
    expect(m.writes()[0]).toMatchObject({ op: "update", filters: [["id", TX]] });
  });

  it("sin sesión redirige a /login y no escribe", async () => {
    const m = setup({ user: null });
    expect(await redirectTarget(() => saveTransaction({}, form(valid)))).toBe("/login");
    expect(m.writes()).toHaveLength(0);
  });

  it("validación Zod fallida: devuelve error y valores, sin tocar la BD", async () => {
    setup();
    const res = await saveTransaction({}, form({ ...valid, amount: "abc" }));
    expect(res.error).toMatch(/Monto no válido/);
    expect(res.values?.amount).toBe("abc");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("id de edición inválido: error sin tocar la BD", async () => {
    setup();
    const res = await saveTransaction({}, form({ ...valid, id: "no-es-uuid" }));
    expect(res.error).toBe("Movimiento no válido");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("categoría de otro tipo: rechaza y no escribe", async () => {
    const m = setup({ results: { "categories.select": { data: { kind: "income" }, error: null } } });
    const res = await saveTransaction({}, form(valid));
    expect(res.error).toBe("La categoría no corresponde al tipo de movimiento");
    expect(m.writes()).toHaveLength(0);
  });

  it("categoría inexistente (o ajena por RLS): rechaza y no escribe", async () => {
    const m = setup({ results: { "categories.select": { data: null, error: null } } });
    const res = await saveTransaction({}, form(valid));
    expect(res.error).toBe("La categoría no corresponde al tipo de movimiento");
    expect(m.writes()).toHaveLength(0);
  });

  it("error de BD: mensaje genérico, sin filtrar el error interno, y lo registra", async () => {
    setup({
      results: {
        "transactions.insert": { data: null, error: { code: "23505", message: "duplicate key secret_constraint" } },
      },
    });
    const res = await saveTransaction({}, form(valid));
    expect(res.error).toBe("No se pudo guardar el movimiento. Inténtalo de nuevo.");
    expect(JSON.stringify(res)).not.toMatch(/secret_constraint|23505/);
    expect(res.values?.amount).toBe("50.000");
    expect(errorSpy).toHaveBeenCalledWith("[saveTransaction]", "23505", "duplicate key secret_constraint");
  });

  it("0 filas afectadas (RLS/no existe): error de permiso, sin redirigir", async () => {
    setup({ results: { "transactions.update": { data: [], error: null } } });
    const res = await saveTransaction({}, form({ ...valid, id: TX }));
    expect(res.error).toBe("No se encontró el movimiento o no tienes permiso para modificarlo.");
  });
});

describe("deleteTransaction", () => {
  it("id inválido: redirige a la lista sin tocar la BD", async () => {
    setup();
    expect(await redirectTarget(() => deleteTransaction(form({ id: "x" })))).toBe("/movimientos");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("sin sesión redirige a /login", async () => {
    const m = setup({ user: null });
    expect(await redirectTarget(() => deleteTransaction(form({ id: TX })))).toBe("/login");
    expect(m.writes()).toHaveLength(0);
  });

  it("camino feliz: borra por id y vuelve a la lista", async () => {
    const m = setup({ results: { "transactions.delete": { data: [{ id: TX }], error: null } } });
    expect(await redirectTarget(() => deleteTransaction(form({ id: TX })))).toBe("/movimientos");
    expect(m.writes()[0]).toMatchObject({ op: "delete", filters: [["id", TX]] });
  });

  it("0 filas afectadas: redirige al detalle con error=eliminar", async () => {
    setup({ results: { "transactions.delete": { data: [], error: null } } });
    expect(await redirectTarget(() => deleteTransaction(form({ id: TX })))).toBe(`/movimientos/${TX}?error=eliminar`);
  });

  it("error de BD: redirige con error=eliminar sin filtrar el mensaje en la URL", async () => {
    setup({ results: { "transactions.delete": { data: null, error: { code: "XX000", message: "boom interno" } } } });
    const url = await redirectTarget(() => deleteTransaction(form({ id: TX })));
    expect(url).toBe(`/movimientos/${TX}?error=eliminar`);
    expect(url).not.toMatch(/boom/);
    expect(errorSpy).toHaveBeenCalledWith("[deleteTransaction]", "XX000", "boom interno");
  });
});
