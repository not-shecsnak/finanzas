import { describe, expect, it } from "vitest";
import { CONNECTION_MESSAGE, SIGNUP_FALLBACK, signupErrorMessage } from "./auth-errors";

describe("signupErrorMessage", () => {
  it("traduce códigos conocidos", () => {
    expect(signupErrorMessage("user_already_exists")).toContain("Entrar");
    expect(signupErrorMessage("over_email_send_rate_limit")).toContain("Espera");
  });

  it("detecta fallos de conexión", () => {
    expect(signupErrorMessage(undefined, "AuthRetryableFetchError", 0)).toBe(CONNECTION_MESSAGE);
    expect(signupErrorMessage(undefined, undefined, 0)).toBe(CONNECTION_MESSAGE);
  });

  it("usa un mensaje genérico para códigos desconocidos o ausentes", () => {
    expect(signupErrorMessage("algo_raro")).toBe(SIGNUP_FALLBACK);
    expect(signupErrorMessage(undefined)).toBe(SIGNUP_FALLBACK);
  });
});
