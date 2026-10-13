import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
// Si ya hay un servidor levantado, E2E_BASE_URL lo usa y no se construye nada.
const externalBase = process.env.E2E_BASE_URL;
const baseURL = externalBase ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  workers: 1,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: { baseURL, trace: "retain-on-failure", locale: "es-CO", timezoneId: "America/Bogota" },
  projects: [
    { name: "movil", use: { ...devices["Pixel 7"], browserName: "chromium" } },
    { name: "escritorio", use: { ...devices["Desktop Chrome"], viewport: { width: 1280, height: 800 } } },
  ],
  // NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY vienen del entorno del shell
  // (supabase status -o env); nunca se guardan en archivos.
  webServer: externalBase
    ? undefined
    : {
        command: `npm run build && npm run start -- -H 127.0.0.1 -p ${PORT}`,
        url: `${baseURL}/login`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
      },
});
