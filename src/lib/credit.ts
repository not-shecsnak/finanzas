/** Meta de utilización: por debajo de este porcentaje se considera un buen hábito. */
export const UTILIZATION_TARGET = 30;

export type Utilization = { percent: number; withinTarget: boolean };

/**
 * Utilización = saldo / límite, en porcentaje con un decimal (aritmética sobre centavos enteros).
 * El límite debe ser > 0 y el saldo >= 0; ambos enteros. Puede superar 100 si el saldo excede el límite.
 */
export function utilization(balanceCents: number, limitCents: number): Utilization {
  if (!Number.isInteger(balanceCents) || !Number.isInteger(limitCents)) {
    throw new TypeError("saldo y límite deben ser enteros en centavos");
  }
  if (limitCents <= 0) throw new RangeError("el límite debe ser mayor que 0");
  if (balanceCents < 0) throw new RangeError("el saldo no puede ser negativo");
  const tenths = Math.round((balanceCents * 1000) / limitCents);
  return { percent: tenths / 10, withinTarget: tenths < UTILIZATION_TARGET * 10 };
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate(); // month 1-12
}

function iso(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Próxima fecha de pago (YYYY-MM-DD) a partir de `today` (YYYY-MM-DD), incluyendo hoy.
 * Si el día de pago no existe en el mes (p. ej. 31 en abril o 30 en febrero) se usa el último día del mes.
 */
export function nextDueDate(dueDay: number, today: string): string {
  if (!Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) throw new RangeError("día de pago inválido");
  const m = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.exec(today);
  if (!m) throw new RangeError("fecha inválida");
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  if (day > daysInMonth(year, month)) throw new RangeError("fecha inválida");

  const thisMonth = Math.min(dueDay, daysInMonth(year, month));
  if (thisMonth >= day) return iso(year, month, thisMonth);

  const ny = month === 12 ? year + 1 : year;
  const nm = month === 12 ? 1 : month + 1;
  return iso(ny, nm, Math.min(dueDay, daysInMonth(ny, nm)));
}

/** Días naturales entre dos fechas ISO (to - from). */
export function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`);
  return Math.round(ms / 86_400_000);
}
