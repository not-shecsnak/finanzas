import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { signUp } from "./helpers";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function audit(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const detalle = violations.map((v) => ({
    regla: v.id,
    impacto: v.impact,
    nodos: v.nodes.map((n) => n.target.join(" ")),
  }));
  expect(detalle, JSON.stringify(detalle, null, 2)).toEqual([]);
}

test("accesibilidad de /login", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel("Correo")).toBeVisible();
  await audit(page);
});

test("accesibilidad de inicio y del formulario de nuevo movimiento", async ({ page }) => {
  await signUp(page);
  await expect(page.getByRole("region", { name: "Resumen del mes" })).toBeVisible();
  await audit(page);

  await page.goto("/movimientos/nuevo");
  await expect(page.getByRole("heading", { name: "Nuevo movimiento" })).toBeVisible();
  await audit(page);
});

test("accesibilidad del formulario con una categoría seleccionada", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  await expect(page.getByLabel("Monto")).toBeFocused();
  await page.keyboard.type("25000");
  const chip = page.getByRole("radio", { name: "Comida" });
  await chip.check();
  await expect(chip).toBeChecked();
  await audit(page);

  // Foco visible sobre un chip (navegación por teclado).
  await page.keyboard.press("ArrowRight");
  await audit(page);

  // Modo ingreso.
  await page.getByRole("radio", { name: "Ingreso", exact: true }).check();
  await page.getByRole("radio", { name: "Sueldo" }).check();
  await audit(page);
});

test("accesibilidad del formulario de movimiento con errores mostrados", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  await expect(page.getByLabel("Monto")).toBeFocused();
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator("#amount-error")).toBeVisible();
  await expect(page.locator("#category-error")).toBeVisible();
  await audit(page);
});

test("accesibilidad del formulario de tarjeta, vacío y con errores", async ({ page }) => {
  await signUp(page);
  await page.goto("/credito/nueva");
  await expect(page.getByRole("heading", { name: "Nueva tarjeta" })).toBeVisible();
  await audit(page);
  await page.getByRole("button", { name: "Guardar tarjeta" }).click();
  await expect(page.locator("#name-error")).toBeVisible();
  await audit(page);
});
