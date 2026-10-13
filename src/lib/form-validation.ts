import type { z } from "zod";

/** Mapa campo -> primer mensaje de error. Vacío si los datos son válidos. */
export type FieldErrors = Record<string, string>;

/**
 * Valida `data` con el mismo esquema Zod que usa el servidor y devuelve el primer
 * mensaje por campo (según `issue.path[0]`). Lógica pura: sirve en cliente y en tests.
 * Los errores sin ruta (a nivel de objeto) se agrupan bajo la clave "_form".
 */
export function fieldErrors(schema: z.ZodType, data: unknown): FieldErrors {
  const result = schema.safeParse(data);
  if (result.success) return {};
  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}

/** Primer campo con error según el orden en que aparecen en el formulario. */
export function firstInvalidField(errors: FieldErrors, order: readonly string[]): string | undefined {
  return order.find((name) => name in errors);
}

/** Copia de `errors` sin el campo indicado (para limpiar al corregirlo). */
export function withoutError(errors: FieldErrors, name: string): FieldErrors {
  if (!(name in errors)) return errors;
  const rest = { ...errors };
  delete rest[name];
  return rest;
}

/** Lee del FormData solo los campos indicados; los ausentes quedan como null (igual que formData.get). */
export function pickFormFields(formData: FormData, names: readonly string[]): Record<string, FormDataEntryValue | null> {
  return Object.fromEntries(names.map((name) => [name, formData.get(name)]));
}
