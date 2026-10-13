export type KindedCategory = { id: string; kind: string };

/** Categorías que corresponden al tipo de movimiento elegido. */
export function categoriesForKind<T extends KindedCategory>(categories: readonly T[], kind: string): T[] {
  return categories.filter((c) => c.kind === kind);
}

/** Conserva la categoría seleccionada solo si pertenece al tipo; si no, la limpia (""). */
export function resolveCategory(categories: readonly KindedCategory[], kind: string, categoryId: string): string {
  return categories.some((c) => c.id === categoryId && c.kind === kind) ? categoryId : "";
}
