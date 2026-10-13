import { describe, expect, it } from "vitest";
import { credentialsSchema } from "./auth-schema";

describe("credentialsSchema", () => {
  it("normaliza el correo", () => {
    const r = credentialsSchema.parse({ email: "  Sebas@Mail.COM ", password: "12345678" });
    expect(r.email).toBe("sebas@mail.com");
  });

  it("rechaza correo inválido", () => {
    expect(credentialsSchema.safeParse({ email: "no-es-correo", password: "12345678" }).success).toBe(false);
  });

  it("rechaza contraseñas cortas", () => {
    expect(credentialsSchema.safeParse({ email: "a@b.co", password: "1234567" }).success).toBe(false);
  });
});
