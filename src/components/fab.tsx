import Link from "next/link";

/** Botón flotante para agregar un movimiento. */
export function AddFab() {
  return (
    <Link
      href="/movimientos/nuevo"
      aria-label="Agregar movimiento"
      className="fixed right-4 bottom-20 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft md:bottom-6"
    >
      +
    </Link>
  );
}
