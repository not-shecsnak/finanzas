import { describe, expect, it } from "vitest";
import { currentMonth, monthRange, sanitizeMonth, shiftMonth } from "./dates";

describe("dates", () => {
  it("calcula el rango de un mes, incluido diciembre", () => {
    expect(monthRange("2026-10")).toEqual({ from: "2026-10-01", to: "2026-11-01" });
    expect(monthRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });

  it("rechaza meses inválidos", () => {
    expect(() => monthRange("2026-13")).toThrow(RangeError);
    expect(() => monthRange("hola")).toThrow(RangeError);
  });

  it("sanitiza el mes de la URL", () => {
    const now = new Date(2026, 9, 15);
    expect(currentMonth(now)).toBe("2026-10");
    expect(sanitizeMonth("2026-03", now)).toBe("2026-03");
    expect(sanitizeMonth("'; drop table", now)).toBe("2026-10");
    expect(sanitizeMonth(undefined, now)).toBe("2026-10");
  });

  it("navega entre meses cruzando años", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-05", 0)).toBe("2026-05");
  });
});
