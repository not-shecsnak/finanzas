"use client";

import { useActionState, useState } from "react";
import { saveBalance, type FormState } from "@/app/(app)/credito/actions";
import { formatAmountTyping } from "@/lib/money";

export function BalanceForm({
  cardId,
  cardName,
  month,
  initial,
}: {
  cardId: string;
  cardName: string;
  month: string;
  initial: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveBalance, {});
  const [balance, setBalance] = useState(initial);
  const errorId = `balance-msg-${cardId}`;

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="card_id" value={cardId} />
      <input type="hidden" name="month" value={month} />
      <label className="flex flex-col gap-1 text-sm text-muted">
        Saldo del mes ({cardName})
        <span className="flex gap-2">
          <input
            name="balance"
            inputMode="decimal"
            autoComplete="off"
            required
            value={balance}
            onChange={(e) => setBalance(formatAmountTyping(e.target.value))}
            placeholder="350.000"
            aria-describedby={errorId}
            className="min-h-11 w-full min-w-0 rounded-xl border border-muted bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft"
          />
          <button
            type="submit"
            disabled={pending}
            className="min-h-11 shrink-0 rounded-xl bg-accent px-4 font-medium text-bg disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
          >
            {pending ? "Guardando..." : "Guardar saldo"}
          </button>
        </span>
      </label>
      <p id={errorId} role={state.error ? "alert" : "status"} className={`min-h-5 text-sm ${state.error ? "text-expense" : "text-income"}`}>
        {state.error ?? (state.ok ? "Saldo guardado" : "")}
      </p>
    </form>
  );
}
