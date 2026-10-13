/** Los montos se guardan como enteros en centavos, nunca como float. */
export function formatCents(cents: number, locale = "es-MX", currency = "MXN"): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError("cents debe ser un entero");
  }
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(cents / 100);
}
