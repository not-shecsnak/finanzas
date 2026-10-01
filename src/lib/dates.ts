const MONTH_RE = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** Mes actual como "YYYY-MM" (hora local del servidor). */
export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/** Fecha de hoy como "YYYY-MM-DD" (hora local del servidor). */
export function todayIso(now = new Date()): string {
  return `${currentMonth(now)}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Devuelve un mes válido o el mes actual si el valor es inválido o falta. */
export function sanitizeMonth(value: string | undefined, now = new Date()): string {
  return value && MONTH_RE.test(value) ? value : currentMonth(now);
}

/** Rango [from, to) de fechas ISO para un mes "YYYY-MM". */
export function monthRange(month: string): { from: string; to: string } {
  const m = MONTH_RE.exec(month);
  if (!m) throw new RangeError("mes inválido");
  const year = Number(m[1]);
  const mon = Number(m[2]);
  const next = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
  return { from: `${month}-01`, to: `${next}-01` };
}

export function shiftMonth(month: string, delta: number): string {
  const m = MONTH_RE.exec(month);
  if (!m) throw new RangeError("mes inválido");
  const index = Number(m[1]) * 12 + (Number(m[2]) - 1) + delta;
  return `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, "0")}`;
}

export function monthLabel(month: string, locale = "es-MX"): string {
  const { from } = monthRange(month);
  return new Date(`${from}T12:00:00`).toLocaleDateString(locale, { month: "long", year: "numeric" });
}
