"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { saveTransaction, type FormState } from "@/app/(app)/movimientos/actions";
import { formatAmountTyping } from "@/lib/money";
import type { Category } from "@/lib/queries";
import type { Kind } from "@/lib/summary";

export type FormInitial = {
  id?: string;
  kind: Kind;
  amount: string;
  category_id: string;
  occurred_on: string;
  note: string;
};

const fieldClass =
  "min-h-11 w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft";

export function TransactionForm({ categories, initial }: { categories: Category[]; initial: FormInitial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTransaction, {});
  const [kind, setKind] = useState<Kind>(initial.kind);
  const [amount, setAmount] = useState(initial.amount);
  const options = categories.filter((c) => c.kind === kind);

  return (
    <form action={action} className="flex flex-col gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="kind" value={kind} />

      <div role="radiogroup" aria-label="Tipo de movimiento" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={kind === k}
            onClick={() => setKind(k)}
            className={`min-h-11 rounded-lg px-3 text-sm font-medium ${focusRing} ${
              kind === k ? (k === "expense" ? "bg-expense text-bg" : "bg-income text-bg") : "text-muted"
            }`}
          >
            {k === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Monto
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          value={amount}
          onChange={(e) => setAmount(formatAmountTyping(e.target.value))}
          placeholder="50.000"
          aria-describedby="amount-help form-error"
          className={`${fieldClass} text-2xl`}
        />
        <span id="amount-help" className="text-xs">
          En pesos. Los miles se separan solos; usa coma para decimales (150,50).
        </span>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Categoría
        <select
          key={kind}
          name="category_id"
          required
          defaultValue={options.some((c) => c.id === initial.category_id) ? initial.category_id : ""}
          className={fieldClass}
        >
          <option value="" disabled>
            Elige una categoría
          </option>
          {options.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Fecha
        <input name="occurred_on" type="date" required defaultValue={initial.occurred_on} className={fieldClass} />
      </label>

      <label className="flex flex-col gap-1 text-sm text-muted">
        Nota (opcional)
        <input name="note" maxLength={200} defaultValue={initial.note} placeholder="Tacos con amigos" className={fieldClass} />
      </label>

      <p id="form-error" role="alert" className="min-h-5 text-sm text-expense">
        {state.error}
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 flex-1 rounded-xl bg-accent px-4 font-medium text-white disabled:opacity-60 ${focusRing}`}
        >
          {pending ? "Guardando..." : "Guardar"}
        </button>
        <Link href="/movimientos" className={`flex min-h-11 items-center rounded-xl border border-border px-4 text-ink ${focusRing}`}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}
