import { expect, test } from "@playwright/test";
import { uniqueEmail } from "./helpers";

test.describe("acceso", () => {
  for (const ruta of ["/", "/movimientos", "/credito"]) {
    test(`sin sesion ${ruta} redirige a /login`, async ({ page }) => {
      await page.goto(ruta);
      await expect(page).toHaveURL(/\/login$/);
      await expect(page.getByLabel("Correo")).toBeVisible();
    });
  }

  test("credenciales incorrectas muestran error y no entran", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Correo").fill(uniqueEmail());
    await page.getByLabel("Contraseña").fill("clave-que-no-existe-1");
    await page.locator("form").getByRole("button", { name: "Entrar" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Correo o contraseña incorrectos" })).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });
});
