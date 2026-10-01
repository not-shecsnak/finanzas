import { describe, expect, it } from "vitest";
import { formatCents } from "./money";

describe("formatCents", () => {
  it("formatea centavos como moneda", () => {
    expect(formatCents(123456)).toContain("1,234.56");
  });

  it("rechaza valores no enteros", () => {
    expect(() => formatCents(10.5)).toThrow(TypeError);
  });
});
