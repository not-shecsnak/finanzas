import { expect, test } from "@playwright/test";
import { addExpense, signUp } from "./helpers";

test("un usuario no ve ni abre los movimientos de otro", async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  try {
    const a = await ctxA.newPage();
    await signUp(a);
    await addExpense(a, "12.345", "Transporte", "Secreto de A");
    const href = await a.getByRole("link", { name: /Secreto de A/ }).getAttribute("href");
    expect(href).toMatch(/^\/movimientos\/[0-9a-f-]{36}$/);

    const b = await ctxB.newPage();
    await signUp(b);

    // La app llama notFound() cuando RLS no devuelve la fila: 404 sin datos de A.
    const respuesta = await b.goto(href!);
    expect(respuesta?.status()).toBe(404);
    await expect(b.getByText("Secreto de A")).toHaveCount(0);
    await expect(b.getByText(/12\.345/)).toHaveCount(0);
    await expect(b.getByRole("heading", { name: "Editar movimiento" })).toHaveCount(0);

    // Su lista no incluye el movimiento de A.
    await b.goto("/movimientos");
    await expect(b.getByRole("link", { name: /Secreto de A/ })).toHaveCount(0);
    await expect(b.getByText("No hay movimientos en este mes")).toBeVisible();

    // A sigue viendo el suyo.
    await a.goto(href!);
    await expect(a.getByRole("heading", { name: "Editar movimiento" })).toBeVisible();
  } finally {
    await ctxA.close();
    await ctxB.close();
  }
});
