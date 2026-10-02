"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveCard, type FormState } from "@/app/(app)/credito/actions";
import { formatAmountTyping } from "@/lib/money";

const fieldClass =
  "min-h-11 w-full rounded-xl border border-muted bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft";

export function CardForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCard, {});
  const [limit, setLimit] = useState("");

  return (
    <form action={action} className="flex flex-col gap-5">
      <label className="flex flex-col gap-1 text-sm text-muted">
        Nombre de la tarjeta
        <input name="name" required maxLength={40} autoComplete="off" placeholder="Mi tarjeta" className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Límite de crédito
        <input
          name="limit"
          inputMode="decimal"
          autoComplete="off"
          required
          value={limit}
          onChange={(e) => setLimit(formatAmountTyping(e.target.value))}
          placeholder="2.000.000"
          aria-describedby="limit-help form-error"
          className={fieldClass}
        />
        <span id="limit-help" className="text-xs">
          En pesos, mayor que 0.
        </span>
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm text-muted">
          Día de corte
          <input name="statement_day" type="number" inputMode="numeric" min={1} max={31} step={1} required placeholder="15" className={fieldClass} />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Día de pago
          <input name="due_day" type="number" inputMode="numeric" min={1} max={31} step={1} required placeholder="30" className={fieldClass} />
        </label>
      </div>
      <p className="text-xs text-muted">Si el mes no tiene ese día (por ejemplo 31 en abril), se usa el último día del mes.</p>

      <p id="form-error" role="alert" className="min-h-5 text-sm text-expense">
        {state.error}
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 flex-1 rounded-xl bg-accent px-4 font-medium text-bg disabled:opacity-60 ${focusRing}`}
        >
          {pending ? "Guardando..." : "Guardar tarjeta"}
        </button>
        <Link href="/credito" className={`flex min-h-11 items-center rounded-xl border border-border px-4 text-ink ${focusRing}`}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
