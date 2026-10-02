import { LOCALE, TIME_ZONE } from "@/lib/config";

const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;
export const MIN_YEAR = 2000;
export const MAX_YEAR = 2100;

export function isSupportedYear(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

/** Fecha de hoy como "YYYY-MM-DD" en la zona horaria de la app (no la del servidor). */
export function todayIso(now = new Date(), timeZone = TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Mes actual como "YYYY-MM" en la zona horaria de la app. */
export function currentMonth(now = new Date(), timeZone = TIME_ZONE): string {
  return todayIso(now, timeZone).slice(0, 7);
}

function parseMonth(month: string): { year: number; mon: number } {
  const m = MONTH_RE.exec(month);
  if (!m || !isSupportedYear(Number(m[1]))) throw new RangeError("mes inválido");
  return { year: Number(m[1]), mon: Number(m[2]) };
}

/** Devuelve un mes válido (años 2000-2100) o el mes actual si el valor es inválido o falta. */
export function sanitizeMonth(value: string | undefined, now = new Date()): string {
  if (value && MONTH_RE.test(value) && isSupportedYear(Number(value.slice(0, 4)))) return value;
  return currentMonth(now);
}

/** Rango [from, to) de fechas ISO para un mes "YYYY-MM". */
export function monthRange(month: string): { from: string; to: string } {
  const { year, mon } = parseMonth(month);
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}

/** Desplaza el mes; el resultado se acota a 2000-2100 (no sale del rango soportado). */
export function shiftMonth(month: string, delta: number): string {
  const { year, mon } = parseMonth(month);
  const index = year * 12 + (mon - 1) + delta;
  const shifted = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
  return isSupportedYear(Math.floor(index / 12)) ? shifted : month;
}

export function monthLabel(month: string, locale = LOCALE): string {
  const { from } = monthRange(month);
  // Mediodía UTC y formateo en UTC: el día no cambia según la zona del servidor.
  return new Date(`${from}T12:00:00Z`).toLocaleDateString(locale, { month: "long", year: "numeric", timeZone: "UTC" });
}
