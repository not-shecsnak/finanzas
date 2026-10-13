/** Deja solo el origen (https://<id>.supabase.co); tolera rutas pegadas como /rest/v1/. */
export function normalizeSupabaseUrl(raw: string): string {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim().replace(/^["']|["']$/g, ""));
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL no es una URL válida (usa https://<id>.supabase.co)");
  }
  if (parsed.protocol !== "https:" && parsed.hostname !== "localhost") {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL debe empezar por https://");
  }
  return parsed.origin;
}

/** Variables públicas de Supabase. Falla con un mensaje claro si faltan. */
export function supabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY en .env");
  }
  return { url: normalizeSupabaseUrl(url), anonKey: anonKey.trim() };
}
