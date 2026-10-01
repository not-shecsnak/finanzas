import { describe, expect, it } from "vitest";
import { formatCents, parseToCents } from "./money";

describe("formatCents", () => {
  it("formatea pesos colombianos sin decimales cuando son enteros", () => {
    const out = formatCents(5000000); // 50.000 COP
    expect(out).toContain("50.000");
    expect(out).not.toContain(",00");
  });

  it("muestra decimales solo si existen", () => {
    expect(formatCents(123456)).toContain("1.234,56");
  });

  it("rechaza valores no enteros", () => {
    expect(() => formatCents(10.5)).toThrow(TypeError);
  });
});

describe("parseToCents", () => {
  it("convierte enteros y decimales con punto o coma", () => {
    expect(parseToCents("150")).toBe(15000);
    expect(parseToCents("150.5")).toBe(15050);
    expect(parseToCents("150,50")).toBe(15050);
    expect(parseToCents("0.07")).toBe(7);
  });

  it("no pierde precisión con decimales problemáticos", () => {
    expect(parseToCents("19.99")).toBe(1999);
    expect(parseToCents("1.1")).toBe(110);
  });

  it("rechaza vacío, cero, negativos, texto y miles", () => {
    for (const bad of ["", "0", "0.00", "-5", "abc", "1,234.56", "12.345", "1e5"]) {
      expect(parseToCents(bad)).toBeNull();
    }
  });
});
