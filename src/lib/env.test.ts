import { describe, expect, it } from "vitest";
import { normalizeSupabaseUrl } from "./env";

describe("normalizeSupabaseUrl", () => {
  it("deja solo el origen cuando se pega la ruta de la API REST", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co/rest/v1/")).toBe("https://abc.supabase.co");
  });

  it("acepta la URL limpia y con comillas", () => {
    expect(normalizeSupabaseUrl("https://abc.supabase.co")).toBe("https://abc.supabase.co");
    expect(normalizeSupabaseUrl('"https://abc.supabase.co"')).toBe("https://abc.supabase.co");
  });

  it("rechaza URLs inválidas o sin https", () => {
    expect(() => normalizeSupabaseUrl("abc.supabase.co")).toThrow();
    expect(() => normalizeSupabaseUrl("http://abc.supabase.co")).toThrow();
  });
});
