import { expect, test } from "@playwright/test";
import { addExpense, signUp } from "./helpers";

test("crear, editar y eliminar un gasto se refleja en lista y resumen", async ({ page }) => {
  await signUp(page);

  // Crear: 50.000 en Comida.
  await addExpense(page, "50.000", "Comida", "Almuerzo e2e");
  const fila = page.getByRole("link", { name: /Almuerzo e2e/ });
  await expect(fila).toBeVisible();
  await expect(fila).toContainText(/\$\s50\.000/);

  // Reflejado en el resumen de inicio.
  await page.goto("/");
  const resumen = page.getByRole("region", { name: "Resumen del mes" });
  const gastos = resumen.locator("div", { has: page.getByText("Gastos", { exact: true }) });
  await expect(gastos.getByText(/\$\s50\.000/)).toBeVisible();
  const porCategoria = page.getByRole("region", { name: "Gasto por categoría" });
  await expect(porCategoria).toContainText("Comida");
  await expect(porCategoria).toContainText("100%");

  // Editar a 75.000.
  await page.goto("/movimientos");
  await page.getByRole("link", { name: /Almuerzo e2e/ }).click();
  await expect(page.getByRole("heading", { name: "Editar movimiento" })).toBeVisible();
  const monto = page.getByLabel("Monto");
  await expect(monto).toHaveValue("50.000");
  await monto.fill("75.000");
  await expect(monto).toHaveValue("75.000");
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Almuerzo e2e/ })).toContainText(/\$\s75\.000/);
  await page.goto("/");
  await expect(gastos.getByText(/\$\s75\.000/)).toBeVisible();

  // Eliminar: desplegable de confirmacion + boton "Sí, eliminar".
  await page.goto("/movimientos");
  await page.getByRole("link", { name: /Almuerzo e2e/ }).click();
  await page.getByText("Eliminar movimiento").click();
  await page.getByRole("button", { name: "Sí, eliminar" }).click();
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Almuerzo e2e/ })).toHaveCount(0);
  await expect(page.getByText("No hay movimientos en este mes")).toBeVisible();
});
