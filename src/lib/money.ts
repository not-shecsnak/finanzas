import { CURRENCY, LOCALE } from "@/lib/config";

/**
 * Los montos se guardan como enteros en centavos, nunca como float.
 * Muestra decimales solo cuando existen (en COP casi siempre son pesos enteros).
 */
export function formatCents(cents: number, locale = LOCALE, currency = CURRENCY): string {
  if (!Number.isInteger(cents)) {
    throw new TypeError("cents debe ser un entero");
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

const MAX_CENTS = 99_999_999_999; // ~1,000 millones, evita desbordes absurdos
const THOUSANDS = /^\d{1,3}(?:[.,]\d{3})*$/;

function toCents(whole: string, decimals: string): number | null {
  const cents = Number(whole) * 100 + Number(decimals.padEnd(2, "0") || 0);
  return cents > 0 && cents <= MAX_CENTS ? cents : null;
}

/**
 * Convierte un monto escrito a la colombiana a centavos enteros, sin usar float.
 *  "50000", "50.000", "1.500.000"  → miles con punto
 *  "150,50", "1.234,56"            → coma decimal
 *  "1,234.56", "150.5"             → también se entiende (el último separador es el decimal)
 * Devuelve null si no es un monto válido y positivo.
 */
export function parseToCents(input: string): number | null {
  const s = input.trim();
  if (!/^[\d.,]+$/.test(s)) return null;

  const dots = s.includes(".");
  const commas = s.includes(",");

  if (dots && commas) {
    const last = Math.max(s.lastIndexOf("."), s.lastIndexOf(","));
    const intPart = s.slice(0, last);
    const decimals = s.slice(last + 1);
    const thousandsChar = s[last] === "," ? "." : ",";
    if (!THOUSANDS.test(intPart) || intPart.replace(/\d/g, "").split("").some((c) => c !== thousandsChar)) return null;
    if (!/^\d{1,2}$/.test(decimals)) return null;
    return toCents(intPart.replace(/\D/g, ""), decimals);
  }
  if (dots) {
    if (/^\d{1,3}(?:\.\d{3})+$/.test(s)) return toCents(s.replace(/\./g, ""), "");
    const m = /^(\d{1,12})\.(\d{1,2})$/.exec(s);
    return m ? toCents(m[1], m[2]) : null;
  }
  if (commas) {
    const m = /^(\d{1,12}),(\d{1,2})$/.exec(s);
    return m ? toCents(m[1], m[2]) : null;
  }
  return /^\d{1,12}$/.test(s) ? toCents(s, "") : null;
}

/** Agrupa miles con punto mientras se escribe: "1234567" → "1.234.567"; la coma marca decimales. */
export function formatAmountTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, "");
  const [intRaw, ...rest] = cleaned.split(",");
  const whole = intRaw.replace(/^0+(?=\d)/, "").slice(0, 12);
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  if (rest.length === 0) return grouped;
  return `${grouped || "0"},${rest.join("").slice(0, 2)}`;
}

/** Monto en centavos como texto editable: 5000000 → "50.000"; 123456 → "1.234,56". */
export function formatAmountInput(cents: number): string {
  const whole = String(Math.trunc(cents / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const frac = cents % 100;
  return frac === 0 ? whole : `${whole},${String(frac).padStart(2, "0")}`;
}
