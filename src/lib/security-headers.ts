import { normalizeSupabaseUrl } from "./env";

/** CSP sin nonce: Next inyecta scripts inline, por eso 'unsafe-inline' en script/style (sin eval en producción). */
export function buildCsp(supabaseUrl: string | undefined, isDev = false): string {
  let supabaseOrigin = "";
  if (supabaseUrl) {
    try {
      supabaseOrigin = normalizeSupabaseUrl(supabaseUrl);
    } catch {
      // URL inválida: env.ts ya falla en runtime con un mensaje claro.
    }
  }
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src 'self' ${supabaseOrigin}${supabaseOrigin ? " " : ""}${supabaseOrigin.replace(/^https?/, (p) => (p === "https" ? "wss" : "ws"))}`.trim(),
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

export function securityHeaders(supabaseUrl: string | undefined, isDev = false) {
  return [
    { key: "Content-Security-Policy", value: buildCsp(supabaseUrl, isDev) },
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    { key: "X-Frame-Options", value: "DENY" },
  ];
}
