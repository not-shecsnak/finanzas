import { describe, expect, it } from "vitest";
import { daysBetween, nextDueDate, utilization } from "./credit";

describe("utilization", () => {
  it("calcula porcentaje con un decimal", () => {
    expect(utilization(150_000_00, 1_000_000_00)).toEqual({ percent: 15, withinTarget: true });
    expect(utilization(1, 3)).toEqual({ percent: 33.3, withinTarget: false });
  });
  it("saldo 0 es 0 %", () => {
    expect(utilization(0, 100)).toEqual({ percent: 0, withinTarget: true });
  });
  it("la meta es estrictamente menor a 30 %", () => {
    expect(utilization(299, 1000).withinTarget).toBe(true);
    expect(utilization(300, 1000).withinTarget).toBe(false);
    expect(utilization(301, 1000).withinTarget).toBe(false);
  });
  it("permite superar 100 %", () => {
    expect(utilization(2000, 1000).percent).toBe(200);
  });
  it("rechaza límite 0 o negativo", () => {
    expect(() => utilization(10, 0)).toThrow(RangeError);
    expect(() => utilization(10, -5)).toThrow(RangeError);
  });
  it("rechaza saldo negativo y no enteros", () => {
    expect(() => utilization(-1, 100)).toThrow(RangeError);
    expect(() => utilization(1.5, 100)).toThrow(TypeError);
    expect(() => utilization(1, 100.5)).toThrow(TypeError);
  });
});

describe("nextDueDate", () => {
  it("usa este mes si el día aún no pasó", () => {
    expect(nextDueDate(20, "2026-10-05")).toBe("2026-10-20");
  });
  it("hoy cuenta como vencimiento", () => {
    expect(nextDueDate(5, "2026-10-05")).toBe("2026-10-05");
  });
  it("pasa al mes siguiente si ya pasó", () => {
    expect(nextDueDate(5, "2026-10-06")).toBe("2026-11-05");
  });
  it("cambia de año en diciembre", () => {
    expect(nextDueDate(10, "2026-12-15")).toBe("2027-01-10");
  });
  it("día 31 en meses de 30 días se ajusta al 30", () => {
    expect(nextDueDate(31, "2026-04-10")).toBe("2026-04-30");
    expect(nextDueDate(31, "2026-09-30")).toBe("2026-09-30");
  });
  it("día 31 en meses de 31 días", () => {
    expect(nextDueDate(31, "2026-10-31")).toBe("2026-10-31");
    expect(nextDueDate(30, "2026-10-31")).toBe("2026-11-30");
  });
  it("febrero: 28 días en año normal y 29 en bisiesto", () => {
    expect(nextDueDate(31, "2027-02-01")).toBe("2027-02-28");
    expect(nextDueDate(30, "2028-02-01")).toBe("2028-02-29");
    expect(nextDueDate(29, "2027-02-10")).toBe("2027-02-28");
  });
  it("tras el último día ajustado salta al mes siguiente ajustado", () => {
    expect(nextDueDate(30, "2027-01-31")).toBe("2027-02-28");
    expect(nextDueDate(31, "2027-02-28")).toBe("2027-02-28");
    expect(nextDueDate(30, "2027-12-31")).toBe("2028-01-30");
  });
  it("valida entradas", () => {
    expect(() => nextDueDate(0, "2026-10-05")).toThrow(RangeError);
    expect(() => nextDueDate(32, "2026-10-05")).toThrow(RangeError);
    expect(() => nextDueDate(1.5, "2026-10-05")).toThrow(RangeError);
    expect(() => nextDueDate(5, "2026-13-05")).toThrow(RangeError);
    expect(() => nextDueDate(5, "2026-02-30")).toThrow(RangeError);
  });
});

describe("daysBetween", () => {
  it("cuenta días entre fechas", () => {
    expect(daysBetween("2026-10-05", "2026-10-20")).toBe(15);
    expect(daysBetween("2026-12-30", "2027-01-02")).toBe(3);
    expect(daysBetween("2026-10-05", "2026-10-05")).toBe(0);
  });
});
