import { vi } from "vitest";

/** Lo que lanza el `redirect` simulado: igual que el real, corta la ejecución y lleva el destino. */
export class RedirectError extends Error {
  constructor(public readonly url: string) {
    super(`NEXT_REDIRECT:${url}`);
  }
}

/** Factory para `vi.mock("next/navigation", ...)`. */
export function navigationMock() {
  return {
    redirect: vi.fn((url: string) => {
      throw new RedirectError(url);
    }),
  };
}

/** Ejecuta una acción y devuelve el destino del redirect; falla si no redirigió. */
export async function redirectTarget(run: () => Promise<unknown>): Promise<string> {
  try {
    await run();
  } catch (e) {
    if (e instanceof RedirectError) return e.url;
    throw e;
  }
  throw new Error("La acción no redirigió");
}

type Result = { data: unknown; error: { code?: string; message: string } | null };

export type Call = {
  table: string;
  op: "select" | "insert" | "update" | "delete" | "upsert";
  payload?: unknown;
  options?: unknown;
  filters: Array<[string, unknown]>;
};

export type MockOptions = {
  /** Usuario de la sesión; null = sin sesión. */
  user?: { id: string } | null;
  /** Resultado por "tabla.operación" (p. ej. "transactions.insert"). Por defecto { data: [], error: null }. */
  results?: Record<string, Result>;
};

/**
 * Cliente Supabase simulado: encadena .from().insert().eq().select() y registra cada llamada
 * en `calls`; al esperar la cadena resuelve con el resultado configurado para "tabla.operación".
 */
export function createSupabaseMock({ user = { id: "user-1" }, results = {} }: MockOptions = {}) {
  const calls: Call[] = [];

  function builder(table: string) {
    const call: Call = { table, op: "select", filters: [] };
    calls.push(call);
    const settle = (): Result => results[`${table}.${call.op}`] ?? { data: [], error: null };
    const b = {
      select: () => b,
      insert: (payload: unknown) => {
        call.op = "insert";
        call.payload = payload;
        return b;
      },
      update: (payload: unknown) => {
        call.op = "update";
        call.payload = payload;
        return b;
      },
      delete: () => {
        call.op = "delete";
        return b;
      },
      upsert: (payload: unknown, options?: unknown) => {
        call.op = "upsert";
        call.payload = payload;
        call.options = options;
        return b;
      },
      eq: (col: string, val: unknown) => {
        call.filters.push([col, val]);
        return b;
      },
      maybeSingle: () => Promise.resolve(settle()),
      then: (resolve: (r: Result) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve(settle()).then(resolve, reject),
    };
    return b;
  }

  const client = {
    auth: {
      getUser: vi.fn(async () => ({ data: { user }, error: null })),
      signInWithPassword: vi.fn<(creds: unknown) => Promise<{ data: unknown; error: unknown }>>(async () => ({
        data: {},
        error: null,
      })),
      signUp: vi.fn<(creds: unknown) => Promise<{ data: unknown; error: unknown }>>(async () => ({
        data: { session: null },
        error: null,
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: vi.fn((table: string) => builder(table)),
  };

  return { client, calls, writes: () => calls.filter((c) => c.op !== "select") };
}
