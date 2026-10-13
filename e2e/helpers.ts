import { expect, type Page } from "@playwright/test";

export const PASSWORD = "clave-e2e-segura-1";

export function uniqueEmail(): string {
  const rand = Math.random().toString(36).slice(2, 8);
  return `e2e-${Date.now()}-${rand}@example.test`;
}

/** Crea una cuenta desde la UI de registro y espera a estar dentro (inicio). */
export async function signUp(page: Page, email = uniqueEmail()): Promise<string> {
  await page.goto("/login");
  const tab = page.getByRole("group", { name: "Acceso" }).getByRole("button", { name: "Crear cuenta" });
  // Antes de hidratar el clic no cambia el modo: se reintenta hasta que quede activo.
  await expect(async () => {
    await tab.click();
    await expect(tab).toHaveAttribute("aria-pressed", "true", { timeout: 1000 });
  }).toPass();
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.locator("form").getByRole("button", { name: "Crear cuenta" }).click();
  await expect(page.getByRole("heading", { name: "Tus finanzas" })).toBeVisible();
  return email;
}

/** Agrega un gasto desde el formulario y espera a volver a la lista. */
export async function addExpense(page: Page, amount: string, category: string, note: string): Promise<void> {
  await page.goto("/movimientos/nuevo");
  const amountField = page.getByLabel("Monto");
  await amountField.fill(amount);
  await expect(amountField).toHaveValue(amount);
  await page.getByLabel("Categoría").selectOption({ label: category });
  await page.getByLabel("Nota (opcional)").fill(note);
  await page.getByRole("button", { name: "Guardar" }).click();
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();
}
