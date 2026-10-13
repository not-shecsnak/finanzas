import { describe, expect, it } from "vitest";
import { currentMonth, monthLabel, monthRange, sanitizeMonth, shiftMonth, todayIso } from "./dates";

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
    const now = new Date("2026-10-15T17:00:00Z");
    expect(currentMonth(now)).toBe("2026-10");
    expect(sanitizeMonth("2026-03", now)).toBe("2026-03");
    expect(sanitizeMonth("'; drop table", now)).toBe("2026-10");
    expect(sanitizeMonth(undefined, now)).toBe("2026-10");
  });

  it("formatea la fecha de hoy con ceros", () => {
    expect(todayIso(new Date("2026-01-05T17:00:00Z"))).toBe("2026-01-05");
  });

  it("navega entre meses cruzando años", () => {
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-05", 0)).toBe("2026-05");
  });

  it("usa la zona de Bogotá y no la del servidor (UTC)", () => {
    // 01:00 UTC del 2 de octubre = 20:00 del 1 de octubre en Bogotá (UTC-5).
    const now = new Date("2026-10-02T01:00:00Z");
    expect(todayIso(now)).toBe("2026-10-01");
    expect(currentMonth(now)).toBe("2026-10");
    expect(sanitizeMonth(undefined, now)).toBe("2026-10");
  });

  it("cambia de mes y de año a medianoche de Bogotá", () => {
    expect(todayIso(new Date("2026-11-01T04:59:59Z"))).toBe("2026-10-31");
    expect(currentMonth(new Date("2026-11-01T05:00:00Z"))).toBe("2026-11");
    expect(todayIso(new Date("2027-01-01T04:59:59Z"))).toBe("2026-12-31");
    expect(currentMonth(new Date("2027-01-01T05:00:00Z"))).toBe("2027-01");
  });

  it("acota los años a 2000-2100", () => {
    const now = new Date("2026-10-15T17:00:00Z");
    expect(sanitizeMonth("1999-12", now)).toBe("2026-10");
    expect(sanitizeMonth("2101-01", now)).toBe("2026-10");
    expect(sanitizeMonth("0000-01", now)).toBe("2026-10");
    expect(sanitizeMonth("2000-01", now)).toBe("2000-01");
    expect(() => monthRange("2101-01")).toThrow(RangeError);
    expect(shiftMonth("2000-01", -1)).toBe("2000-01");
    expect(shiftMonth("2100-12", 1)).toBe("2100-12");
  });

  it("etiqueta el mes sin depender de la zona del servidor", () => {
    expect(monthLabel("2026-10")).toMatch(/octubre/i);
  });
});
