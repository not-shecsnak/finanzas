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
