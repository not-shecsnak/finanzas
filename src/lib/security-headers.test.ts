import { describe, expect, it } from "vitest";
import { buildCsp, securityHeaders } from "./security-headers";

describe("security headers", () => {
  it("permite conectar solo al origen de Supabase (aunque se pegue una ruta)", () => {
    const csp = buildCsp("https://abc.supabase.co/rest/v1/");
    expect(csp).toContain("connect-src 'self' https://abc.supabase.co wss://abc.supabase.co");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("no rompe sin URL o con URL inválida", () => {
    expect(buildCsp(undefined)).toContain("connect-src 'self'");
    expect(buildCsp("basura")).toContain("connect-src 'self'");
  });

  it("incluye las cabeceras pedidas", () => {
    const h = Object.fromEntries(securityHeaders(undefined).map((x) => [x.key, x.value]));
    expect(h["X-Content-Type-Options"]).toBe("nosniff");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(h["X-Frame-Options"]).toBe("DENY");
  });
});
