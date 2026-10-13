import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { CONNECTION_MESSAGE, SIGNUP_FALLBACK } from "@/lib/auth-errors";
import { createSupabaseMock, redirectTarget } from "@/test/supabase-mock";
import { login, logout, signup } from "./actions";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("next/navigation", async () => (await import("@/test/supabase-mock")).navigationMock());
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}
const creds = { email: "  Sebas@Example.com ", password: "clave-segura-1" };

function setup() {
  const mock = createSupabaseMock();
  vi.mocked(createClient).mockResolvedValue(mock.client as never);
  return mock;
}

let errorSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.clearAllMocks());

describe("login", () => {
  it("camino feliz: normaliza el correo y redirige a /", async () => {
    const m = setup();
    expect(await redirectTarget(() => login({}, form(creds)))).toBe("/");
    expect(m.client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "sebas@example.com",
      password: "clave-segura-1",
    });
  });

  it("correo inválido: error, repuebla el correo y no llama a Supabase", async () => {
    setup();
    const res = await login({}, form({ email: "no-es-correo", password: "clave-segura-1" }));
    expect(res).toEqual({ error: "Correo no válido", email: "no-es-correo" });
    expect(createClient).not.toHaveBeenCalled();
  });

  it("contraseña corta: no llama a Supabase", async () => {
    setup();
    const res = await login({}, form({ email: "a@b.co", password: "123" }));
    expect(res.error).toBe("Mínimo 8 caracteres");
    expect(createClient).not.toHaveBeenCalled();
  });

  it("credenciales incorrectas: mensaje genérico, sin filtrar el error ni la contraseña", async () => {
    const m = setup();
    m.client.auth.signInWithPassword.mockResolvedValueOnce({
      data: {},
      error: { message: "Invalid login credentials: user not found" },
    });
    const res = await login({}, form(creds));
    expect(res).toEqual({ error: "Correo o contraseña incorrectos", email: "  Sebas@Example.com " });
    expect(JSON.stringify(res)).not.toMatch(/not found|clave-segura/);
  });
});

describe("signup", () => {
  it("sin sesión (confirmar correo): devuelve info y no redirige", async () => {
    setup();
    const res = await signup({}, form(creds));
    expect(res).toEqual({ info: "Revisa tu correo para confirmar la cuenta y luego inicia sesión." });
  });

  it("con sesión inmediata: redirige a /", async () => {
    const m = setup();
    m.client.auth.signUp.mockResolvedValueOnce({ data: { session: { access_token: "t" } }, error: null });
    expect(await redirectTarget(() => signup({}, form(creds)))).toBe("/");
  });

  it("error conocido: mensaje traducido y se registra el detalle", async () => {
    const m = setup();
    m.client.auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { code: "user_already_exists", name: "AuthApiError", status: 422, message: "raw" },
    });
    const res = await signup({}, form(creds));
    expect(res.error).toBe("Ese correo ya tiene cuenta. Ve a la pestaña Entrar.");
    expect(errorSpy).toHaveBeenCalled();
  });

  it("error desconocido: mensaje genérico sin filtrar el mensaje crudo", async () => {
    const m = setup();
    m.client.auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { code: "weird", name: "AuthApiError", status: 500, message: "stack interno" },
    });
    const res = await signup({}, form(creds));
    expect(res.error).toBe(SIGNUP_FALLBACK);
    expect(JSON.stringify(res)).not.toMatch(/stack interno/);
  });

  it("fallo de red: mensaje de conexión", async () => {
    const m = setup();
    m.client.auth.signUp.mockResolvedValueOnce({
      data: { session: null },
      error: { name: "AuthRetryableFetchError", status: 0, message: "fetch failed" },
    });
    expect((await signup({}, form(creds))).error).toBe(CONNECTION_MESSAGE);
  });

  it("validación fallida: no llama a Supabase", async () => {
    setup();
    const res = await signup({}, form({ email: "a@b.co", password: "x" }));
    expect(res.error).toBe("Mínimo 8 caracteres");
    expect(createClient).not.toHaveBeenCalled();
  });
});

describe("logout", () => {
  it("cierra sesión y redirige a /login", async () => {
    const m = setup();
    expect(await redirectTarget(() => logout())).toBe("/login");
    expect(m.client.auth.signOut).toHaveBeenCalled();
  });
});
