import { describe, expect, it } from "vitest";
import { formatAmountInput, formatAmountTyping, formatCents, parseToCents } from "./money";

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

describe("parseToCents (convención colombiana)", () => {
  it("entiende miles con punto o sin separador", () => {
    expect(parseToCents("50000")).toBe(5000000);
    expect(parseToCents("50.000")).toBe(5000000);
    expect(parseToCents("1.500.000")).toBe(150000000);
    expect(parseToCents("12.345")).toBe(1234500);
  });

  it("entiende coma decimal y miles con decimales", () => {
    expect(parseToCents("150,50")).toBe(15050);
    expect(parseToCents("1.234,56")).toBe(123456);
    expect(parseToCents("100.000,5")).toBe(10000050);
  });

  it("también acepta el formato anglosajón por tolerancia", () => {
    expect(parseToCents("150.5")).toBe(15050);
    expect(parseToCents("1,234.56")).toBe(123456);
    expect(parseToCents("19.99")).toBe(1999);
    expect(parseToCents("0.07")).toBe(7);
  });

  it("no pierde precisión con decimales problemáticos", () => {
    expect(parseToCents("1.1")).toBe(110);
    expect(parseToCents("0,1")).toBe(10);
  });

  it("rechaza vacío, cero, negativos, texto y formatos ambiguos o rotos", () => {
    for (const bad of ["", "0", "0.00", "-5", "abc", "1e5", "1,234", "1.2345", "1,2.3", "1.234.56", "12,345,67", ".5", "5."]) {
      expect(parseToCents(bad), bad).toBeNull();
    }
  });
});

describe("formatAmountTyping", () => {
  it("agrupa miles con punto mientras se escribe", () => {
    expect(formatAmountTyping("50000")).toBe("50.000");
    expect(formatAmountTyping("1234567")).toBe("1.234.567");
    expect(formatAmountTyping("50.000")).toBe("50.000");
  });

  it("respeta la coma decimal con máximo dos decimales", () => {
    expect(formatAmountTyping("150,5")).toBe("150,5");
    expect(formatAmountTyping("150,567")).toBe("150,56");
    expect(formatAmountTyping(",5")).toBe("0,5");
  });

  it("quita letras y ceros a la izquierda", () => {
    expect(formatAmountTyping("abc")).toBe("");
    expect(formatAmountTyping("0050")).toBe("50");
  });
});

describe("formatAmountInput", () => {
  it("devuelve el monto editable en formato colombiano", () => {
    expect(formatAmountInput(5000000)).toBe("50.000");
    expect(formatAmountInput(123456)).toBe("1.234,56");
    expect(formatAmountInput(7)).toBe("0,07");
  });

  it("es el inverso de parseToCents", () => {
    for (const cents of [100, 15050, 5000000, 123456789]) {
      expect(parseToCents(formatAmountInput(cents))).toBe(cents);
    }
  });
});
