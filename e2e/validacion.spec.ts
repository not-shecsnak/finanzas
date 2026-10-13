import { expect, test, type Page, type Request } from "@playwright/test";
import { signUp } from "./helpers";

function trackPosts(page: Page): Request[] {
  const posts: Request[] = [];
  page.on("request", (r) => {
    if (r.method() === "POST") posts.push(r);
  });
  return posts;
}

test("movimiento: enviar vacío muestra errores junto a cada campo y no hay petición al servidor", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  const monto = page.getByLabel("Monto");
  await expect(monto).toBeFocused();
  const posts = trackPosts(page);

  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  // Monto: mensaje propio, aria-invalid y aria-describedby apuntando a ayuda + mensaje.
  const errorMonto = page.locator("#amount-error");
  await expect(errorMonto).toHaveText(/Monto no válido/);
  await expect(errorMonto).toHaveAttribute("role", "alert");
  await expect(monto).toHaveAttribute("aria-invalid", "true");
  await expect(monto).toHaveAttribute("aria-describedby", "amount-help amount-error");
  await expect(monto).toBeFocused(); // primer campo inválido

  // Categoría: el grupo de radios queda marcado y descrito por su mensaje.
  const grupo = page.getByRole("radiogroup", { name: "Categoría" });
  await expect(page.locator("#category-error")).toHaveText("Elige una categoría");
  await expect(grupo).toHaveAttribute("aria-invalid", "true");
  await expect(grupo).toHaveAttribute("aria-describedby", "category-error");

  // Sin round-trip: ni una sola petición POST (las Server Actions viajan por POST).
  // Espera determinista: dos fotogramas tras el estado visible; una petición habría salido ya.
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(posts).toHaveLength(0);
  await expect(page.getByRole("heading", { name: "Nuevo movimiento" })).toBeVisible();

  // Corregir limpia el error del campo (no el del otro).
  await page.keyboard.type("30000");
  await expect(page.locator("#amount-error")).toHaveCount(0);
  await expect(monto).not.toHaveAttribute("aria-invalid", "true");
  await expect(monto).toHaveAttribute("aria-describedby", "amount-help");
  await expect(page.locator("#category-error")).toBeVisible();
  await page.getByRole("radio", { name: "Transporte" }).check();
  await expect(page.locator("#category-error")).toHaveCount(0);

  // Ahora sí se envía: una petición y vuelve a la lista.
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Movimientos" })).toBeVisible();
  expect(posts.length).toBeGreaterThanOrEqual(1);
  await expect(page.getByRole("link", { name: /Transporte/ })).toContainText(/\$\s30\.000/);
});

test("movimiento: reenviar vuelve a calcular los errores (los corregidos desaparecen)", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  await expect(page.getByLabel("Monto")).toBeFocused();
  const posts = trackPosts(page);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator("#amount-error")).toBeVisible();
  await page.keyboard.type("1000");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator("#amount-error")).toHaveCount(0);
  await expect(page.locator("#category-error")).toBeVisible();
  await expect(page.getByRole("radio", { name: "Comida" })).toBeFocused();
  expect(posts).toHaveLength(0);
});

test("el servidor sigue validando: categoría de ingreso en un gasto es rechazada y se conservan los valores", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");

  // Id real de una categoría de ingreso (visible al cambiar a Ingreso).
  await page.getByRole("radio", { name: "Ingreso", exact: true }).check();
  const incomeId = await page.getByRole("radio", { name: "Sueldo" }).getAttribute("value");
  expect(incomeId).toMatch(/^[0-9a-f-]{36}$/);
  await page.getByRole("radio", { name: "Gasto", exact: true }).check();

  await page.getByLabel("Monto").fill("42.000");
  await page.getByRole("radio", { name: "Comida" }).check();
  await page.getByLabel("Nota (opcional)").fill("Nota que debe sobrevivir");
  // Manipulación fuera de la UI: pasa el cliente (es un uuid válido) pero no el servidor.
  await page.getByRole("radio", { name: "Comida" }).evaluate((el, id) => ((el as HTMLInputElement).value = id as string), incomeId);

  const posts = trackPosts(page);
  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page.locator("#form-error")).toHaveText("La categoría no corresponde al tipo de movimiento");
  expect(posts.length).toBeGreaterThanOrEqual(1); // el cliente no lo bloqueó: llegó al servidor
  await expect(page.locator("#amount-error")).toHaveCount(0);
  await expect(page.getByLabel("Monto")).toHaveValue("42.000");
  await expect(page.getByLabel("Nota (opcional)")).toHaveValue("Nota que debe sobrevivir");
  await expect(page.getByRole("radio", { name: "Comida" })).toBeChecked();
  await expect(page.getByRole("radio", { name: "Gasto", exact: true })).toBeChecked();

  // Un nuevo envío bloqueado por el cliente no deja visible el error del servidor anterior.
  await page.getByLabel("Monto").fill("");
  await page.getByRole("button", { name: "Guardar", exact: true }).click();
  await expect(page.locator("#amount-error")).toHaveText(/Monto no válido/);
  await expect(page.locator("#form-error")).toHaveText("");
});

test("el servidor sigue validando en modo Ingreso: el tipo y la categoría elegidos sobreviven al error", async ({ page }) => {
  await signUp(page);
  await page.goto("/movimientos/nuevo");
  const gasto = page.getByRole("radio", { name: "Gasto", exact: true });
  const ingreso = page.getByRole("radio", { name: "Ingreso", exact: true });
  const expenseId = await page.getByRole("radio", { name: "Comida" }).getAttribute("value");
  await ingreso.check();
  await page.getByLabel("Monto").fill("900.000");
  await page.getByRole("radio", { name: "Sueldo" }).check();
  await page.getByRole("radio", { name: "Sueldo" }).evaluate((el, id) => ((el as HTMLInputElement).value = id as string), expenseId);

  await page.getByRole("button", { name: "Guardar", exact: true }).click();

  await expect(page.locator("#form-error")).toHaveText("La categoría no corresponde al tipo de movimiento");
  await expect(page.getByLabel("Monto")).toHaveValue("900.000");
  await expect(ingreso).toBeChecked();
  await expect(gasto).not.toBeChecked();
  await expect(page.getByRole("radio", { name: "Sueldo" })).toBeChecked();
});

test("tarjeta: enviar vacío muestra un error por campo, sin petición al servidor, y luego guarda", async ({ page }) => {
  await signUp(page);
  await page.goto("/credito/nueva");
  await expect(page.getByRole("heading", { name: "Nueva tarjeta" })).toBeVisible();
  const posts = trackPosts(page);

  await page.getByRole("button", { name: "Guardar tarjeta" }).click();

  const campos = [
    { id: "name", label: "Nombre de la tarjeta", msg: "Escribe el nombre de la tarjeta" },
    { id: "limit", label: "Límite de crédito", msg: /Límite no válido/ },
    { id: "statement_day", label: "Día de corte", msg: /Día de corte no válido/ },
    { id: "due_day", label: "Día de pago", msg: /Día de pago no válido/ },
  ];
  for (const c of campos) {
    const input = page.getByLabel(c.label);
    await expect(page.locator(`#${c.id}-error`)).toHaveText(c.msg);
    await expect(input).toHaveAttribute("aria-invalid", "true");
    expect(await input.getAttribute("aria-describedby")).toContain(`${c.id}-error`);
  }
  await expect(page.getByLabel("Nombre de la tarjeta")).toBeFocused();
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  expect(posts).toHaveLength(0);

  await page.getByLabel("Nombre de la tarjeta").fill("Tarjeta e2e");
  await expect(page.locator("#name-error")).toHaveCount(0);
  await page.getByLabel("Límite de crédito").fill("2000000");
  await page.getByLabel("Día de corte").fill("15");
  await page.getByLabel("Día de pago").fill("30");
  await page.getByRole("button", { name: "Guardar tarjeta" }).click();
  await expect(page.getByRole("heading", { name: "Nueva tarjeta" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Tarjeta e2e" })).toBeVisible();
  expect(posts.length).toBeGreaterThanOrEqual(1);
});
