import { describe, expect, it } from "vitest";
import { SIGNUP_FALLBACK, signupErrorMessage } from "./auth-errors";

describe("signupErrorMessage", () => {
  it("traduce códigos conocidos", () => {
    expect(signupErrorMessage("user_already_exists")).toContain("Entrar");
    expect(signupErrorMessage("over_email_send_rate_limit")).toContain("Espera");
  });

  it("usa un mensaje genérico para códigos desconocidos o ausentes", () => {
    expect(signupErrorMessage("algo_raro")).toBe(SIGNUP_FALLBACK);
    expect(signupErrorMessage(undefined)).toBe(SIGNUP_FALLBACK);
  });
});
