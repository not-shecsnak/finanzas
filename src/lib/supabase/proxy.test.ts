import { NextResponse } from "next/server";
import { describe, expect, it } from "vitest";
import { isPublicPath, redirectWithCookies } from "./proxy";

describe("proxy", () => {
  it("solo /login (y /login/) es público", () => {
    expect(isPublicPath("/login")).toBe(true);
    expect(isPublicPath("/login/")).toBe(true);
    expect(isPublicPath("/login-secreto")).toBe(false);
    expect(isPublicPath("/loginfoo")).toBe(false);
    expect(isPublicPath("/movimientos")).toBe(false);
  });

  it("la redirección conserva las cookies refrescadas", () => {
    const from = NextResponse.next();
    from.cookies.set("sb-token", "nuevo", { path: "/", httpOnly: true });
    const res = redirectWithCookies(new URL("http://localhost/login"), from);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login");
    expect(res.cookies.get("sb-token")?.value).toBe("nuevo");
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly/i);
  });
});
