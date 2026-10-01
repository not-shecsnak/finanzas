import { formatCents } from "@/lib/money";

const resumen = [
  { etiqueta: "Ingresos", centavos: 0, color: "text-income" },
  { etiqueta: "Gastos", centavos: 0, color: "text-expense" },
  { etiqueta: "Saldo del mes", centavos: 0, color: "text-ink" },
];

export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-4 py-8">
      <header>
        <p className="text-sm text-muted">Hola, Sebastián</p>
        <h1 className="text-2xl font-semibold">Tus finanzas</h1>
      </header>

      <section aria-label="Resumen del mes" className="grid gap-3 sm:grid-cols-3">
        {resumen.map((r) => (
          <div key={r.etiqueta} className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm text-muted">{r.etiqueta}</p>
            <p className={`mt-1 text-xl font-semibold ${r.color}`}>{formatCents(r.centavos)}</p>
          </div>
        ))}
      </section>

      <button
        type="button"
        className="fixed right-4 bottom-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
        aria-label="Agregar movimiento"
      >
        +
      </button>
    </main>
  );
}
