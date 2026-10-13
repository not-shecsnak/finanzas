import { describe, expect, it } from "vitest";
import { categoriesForKind, resolveCategory } from "@/lib/category-options";

const cats = [
  { id: "g1", kind: "expense", name: "Comida" },
  { id: "g2", kind: "expense", name: "Ocio" },
  { id: "i1", kind: "income", name: "Sueldo" },
];

describe("categoriesForKind", () => {
  it("filtra por tipo conservando el resto de campos", () => {
    expect(categoriesForKind(cats, "expense").map((c) => c.name)).toEqual(["Comida", "Ocio"]);
    expect(categoriesForKind(cats, "income")).toEqual([cats[2]]);
  });
  it("tipo desconocido: lista vacía", () => {
    expect(categoriesForKind(cats, "otro")).toEqual([]);
  });
});

describe("resolveCategory", () => {
  it("conserva la categoría si pertenece al tipo", () => {
    expect(resolveCategory(cats, "expense", "g1")).toBe("g1");
  });
  it("limpia si pertenece a otro tipo (al cambiar Gasto/Ingreso)", () => {
    expect(resolveCategory(cats, "income", "g1")).toBe("");
  });
  it("limpia si no existe o está vacía", () => {
    expect(resolveCategory(cats, "expense", "zzz")).toBe("");
    expect(resolveCategory(cats, "expense", "")).toBe("");
  });
});
