/** Los montos se guardan como enteros en centavos, nunca como float. */
export function formatCents(cents: number, locale = "es-MX", currency = "MXN"): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError("cents debe ser un entero");
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}

const MAX_CENTS = 99_999_999_999; // ~1,000 millones, evita desbordes absurdos

/**
 * Convierte texto como "150", "150.5" o "150,50" a centavos enteros sin usar float.
 * Devuelve null si no es un monto válido y positivo. No admite separadores de miles.
 */
export function parseToCents(input: string): number | null {
  const match = /^(\d{1,12})(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  const cents = Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0") || 0);
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}
