import { describe, expect, it } from "vitest";
import { fetchAllPages } from "./paginate";

const source = (n: number) => (from: number, to: number) =>
  Promise.resolve({ data: Array.from({ length: n }, (_, i) => i).slice(from, to + 1), error: null });

describe("fetchAllPages", () => {
  it("junta todos los bloques, también con más de 500 filas", async () => {
    const r = await fetchAllPages(source(2500), 1000);
    expect(r.rows).toHaveLength(2500);
    expect(r.truncated).toBe(false);
  });

  it("maneja un total exacto múltiplo del bloque y vacío", async () => {
    expect((await fetchAllPages(source(2000), 1000)).rows).toHaveLength(2000);
    expect((await fetchAllPages(source(0), 1000)).rows).toHaveLength(0);
  });

  it("propaga el error sin devolver datos parciales", async () => {
    let calls = 0;
    const r = await fetchAllPages(
      (from, to) => {
        calls++;
        return calls === 2 ? Promise.resolve({ data: null, error: { message: "boom" } }) : source(5000)(from, to);
      },
      1000,
    );
    expect(r.error?.message).toBe("boom");
    expect(r.rows).toEqual([]);
  });

  it("marca truncado al alcanzar el tope de páginas", async () => {
    const r = await fetchAllPages(source(10_000), 1000, 3);
    expect(r.rows).toHaveLength(3000);
    expect(r.truncated).toBe(true);
  });
});
