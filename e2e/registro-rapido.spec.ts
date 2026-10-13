import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

/**
 * Cuenta los toques reales: un listener `click` en fase de captura (solo eventos de confianza,
 * es decir, generados por el navegador y no por scripts) que guarda el total en sessionStorage,
 * para que sobreviva a las navegaciones completas de página.
 */
async function installTapCounter(page: Page): Promise<void> {
  await page.addInitScript(() => {
    document.addEventListener(
      "click",
      (e) => {
        if (!e.isTrusted) return;
        sessionStorage.setItem("taps", String(Number(sessionStorage.getItem("taps") ?? "0") + 1));
      },
      true,
    );
  });
}

const resetTaps = (page: Page) => page.evaluate(() => sessionStorage.setItem("taps", "0"));
const readTaps = (page: Page) => page.evaluate(() => Number(sessionStorage.getItem("taps") ?? "0"));

test("gasto con fecha de hoy: 3 toques o menos desde Inicio", async ({ page }) => {
  await installTapCounter(page);
  await signUp(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tus finanzas" })).toBeVisible();
  await resetTaps(page);
  expect(await readTaps(page)).toBe(0);

  // Toque 1: "+" (FAB).
  await page.getByRole("link", { name: "Agregar movimiento" }).click();
  await expect(page.getByRole("heading", { name: "Nuevo movimiento" })).toBeVisible();

  // El monto ya tiene foco: se escribe sin tocar.
  const monto = page.getByLabel("Monto");
  await expect(monto).toBeFocused();
  await page.keyboard.type("25000");
  await expect(monto).toHaveValue("25.000");

  // Toque 2: categoría (chip).
  await page.getByRole("radio", { name: "Comida" }).check();
  // Toque 3: Guardar.
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();

  const taps = await readTaps(page);
  console.log(`TOQUES_MEDIDOS gasto (hoy, categoria, sin nota) = ${taps}`);
  expect(taps).toBeGreaterThan(0);
  expect(taps).toBeLessThanOrEqual(3);

  // Quedó guardado con el monto y la categoría elegidos.
  const fila = page.getByRole("link", { name: /Comida/ });
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText(/\$\s25\.000/);
});

test("ingreso: 4 toques (no se disimula: hay que cambiar a Ingreso)", async ({ page }) => {
  await installTapCounter(page);
  await signUp(page);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Tus finanzas" })).toBeVisible();
  await resetTaps(page);

  await page.getByRole("link", { name: "Agregar movimiento" }).click(); // 1
  const monto = page.getByLabel("Monto");
  await expect(monto).toBeFocused();
  await page.keyboard.type("1500000");
  await expect(monto).toHaveValue("1.500.000");
  await page.getByRole("radio", { name: "Ingreso", exact: true }).check(); // 2
  await page.getByRole("radio", { name: "Sueldo" }).check(); // 3
  await page.getByRole("button", { name: "Guardar", exact: true }).click(); // 4
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();

  const taps = await readTaps(page);
  console.log(`TOQUES_MEDIDOS ingreso (hoy, categoria, sin nota) = ${taps}`);
  expect(taps).toBe(4);

  const fila = page.getByRole("link", { name: /Sueldo/ });
  await expect(fila).toHaveCount(1);
  await expect(fila).toContainText(/\$\s1\.500\.000/);
});

test("al cambiar de Gasto a Ingreso se limpia la categoría que no corresponde", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  const comida = page.getByRole("radio", { name: "Comida" });
  await comida.check();
  await expect(comida).toBeChecked();
  await page.getByRole("radio", { name: "Ingreso", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Comida" })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "Sueldo" })).not.toBeChecked();
  await page.getByRole("radio", { name: "Gasto", exact: true }).check();
  await expect(page.getByRole("radio", { name: "Comida" })).not.toBeChecked();
});

test("las categorías se recorren con flechas del teclado", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  await expect(page.getByLabel("Monto")).toBeFocused();
  const primera = page.getByRole("radio").nth(2); // 0-1: Gasto/Ingreso; 2: primera categoría
  await primera.focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("radio").nth(3)).toBeChecked();
  await expect(page.getByRole("radio").nth(3)).toBeFocused();
});
