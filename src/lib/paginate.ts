export const PAGE_SIZE = 1000;
/** Tope de seguridad: 50.000 filas por mes. Si se alcanza, el resultado se marca como truncado. */
export const MAX_PAGES = 50;

type Page<T> = { data: T[] | null; error: { message: string } | null };

/**
 * Trae todas las filas pidiendo bloques [from, to] hasta que uno venga incompleto.
 * Si hay error en cualquier bloque, lo devuelve (nunca devuelve datos parciales como completos).
 */
export async function fetchAllPages<T>(
  fetchPage: (from: number, to: number) => PromiseLike<Page<T>>,
  pageSize = PAGE_SIZE,
  maxPages = MAX_PAGES,
): Promise<{ rows: T[]; error: { message: string } | null; truncated: boolean }> {
  const rows: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    const { data, error } = await fetchPage(page * pageSize, page * pageSize + pageSize - 1);
    if (error) return { rows: [], error, truncated: false };
    const chunk = data ?? [];
    rows.push(...chunk);
    if (chunk.length < pageSize) return { rows, error: null, truncated: false };
  }
  return { rows, error: null, truncated: true };
}
