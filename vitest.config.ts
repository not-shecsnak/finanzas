import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "json-summary"],
      include: ["src/lib/**/*.ts", "src/app/**/actions.ts"],
      exclude: ["**/*.test.ts", "src/test/**"],
      // Medido: stmts 84.59, ramas 84.38, funciones 77.94, lineas 84.22 (umbral ~5 puntos por debajo).
      thresholds: { statements: 79, branches: 79, functions: 72, lines: 79 },
    },
  },
});
