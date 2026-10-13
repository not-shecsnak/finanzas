"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { saveTransaction, type FormState } from "@/app/(app)/movimientos/actions";
import { categoriesForKind, resolveCategory } from "@/lib/category-options";
import { fieldErrors, firstInvalidField, pickFormFields, withoutError, type FieldErrors } from "@/lib/form-validation";
import { formatAmountTyping } from "@/lib/money";
import type { Category } from "@/lib/queries";
import type { Kind } from "@/lib/summary";
import { transactionSchema } from "@/lib/transaction-schema";

export type FormInitial = {
  id?: string;
  kind: Kind;
  amount: string;
  category_id: string;
  occurred_on: string;
  note: string;
};

/** Campos en el orden en que aparecen en pantalla (para enfocar el primero inválido). */
const FIELD_ORDER = ["kind", "amount", "category_id", "occurred_on", "note"] as const;

const fieldClass =
  "min-h-11 w-full rounded-xl border border-field-border bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft aria-invalid:border-2 aria-invalid:border-expense";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft";

function describedBy(...ids: (string | false | undefined)[]): string | undefined {
  const list = ids.filter(Boolean).join(" ");
  return list === "" ? undefined : list;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm text-expense">
      {message}
    </p>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1 text-sm text-muted">
      <label htmlFor={htmlFor}>{label}</label>
      {children}
    </div>
  );
}

export function TransactionForm({ categories, initial }: { categories: Category[]; initial: FormInitial }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveTransaction, {});
  const [kind, setKind] = useState<Kind>(initial.kind);
  const [amount, setAmount] = useState(initial.amount);
  // Controlada: así sobrevive al reseteo del formulario que hace React 19 tras un error del servidor.
  const [category, setCategory] = useState(() => resolveCategory(categories, initial.kind, initial.category_id));
  const [errors, setErrors] = useState<FieldErrors>({});
  // React 19 resetea el formulario tras cada action y los radios controlados vuelven a su atributo
  // `checked` inicial (la selección se perdería). Se vuelven a montar con el estado actual tras un error.
  const [radioSync, setRadioSync] = useState(0);
  const [seenState, setSeenState] = useState(state);
  if (state !== seenState) {
    setSeenState(state);
    if (state.values) setRadioSync((n) => n + 1);
  }
  const amountRef = useRef<HTMLInputElement>(null);
  // Tras un error React 19 resetea los campos no controlados: se repueblan con lo enviado.
  const sent = state.values;
  const options = categoriesForKind(categories, kind);

  // Solo en alta: el monto recibe foco para escribir sin tocar. En edición no se mueve el foco.
  useEffect(() => {
    if (!initial.id) amountRef.current?.focus();
  }, [initial.id]);

  function changeKind(next: Kind) {
    setKind(next);
    setCategory((current) => resolveCategory(categories, next, current));
    setErrors((e) => withoutError(e, "category_id"));
  }

  function clearError(name: string) {
    setErrors((e) => withoutError(e, name));
  }

  // Misma validación (transactionSchema) que la Server Action, sin round-trip.
  // Si falla, preventDefault impide que React despache la action.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = new FormData(form);
    const found = fieldErrors(transactionSchema, { ...pickFormFields(data, FIELD_ORDER), note: data.get("note") ?? "" });
    setErrors(found);
    const first = firstInvalidField(found, FIELD_ORDER);
    if (!first) return;
    e.preventDefault();
    const target = form.elements.namedItem(first);
    const el = target instanceof RadioNodeList ? target[0] : target;
    if (el instanceof HTMLElement) el.focus();
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      <fieldset key={`kind-${radioSync}`} className="grid grid-cols-2 gap-1 rounded-xl border border-field-border bg-surface p-1">
        <legend className="sr-only">Tipo de movimiento</legend>
        {(["expense", "income"] as const).map((k) => (
          <label key={k} className="relative">
            <input
              type="radio"
              name="kind"
              value={k}
              checked={kind === k}
              onChange={() => changeKind(k)}
              className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
            <span
              className={`flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-muted peer-checked:text-bg peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-soft ${
                k === "expense" ? "peer-checked:bg-expense" : "peer-checked:bg-income"
              }`}
            >
              {k === "expense" ? "Gasto" : "Ingreso"}
            </span>
          </label>
        ))}
      </fieldset>

      <Field label="Monto" htmlFor="amount">
        <input
          ref={amountRef}
          id="amount"
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          aria-required="true"
          aria-invalid={errors.amount ? true : undefined}
          aria-describedby={describedBy("amount-help", errors.amount && "amount-error")}
          value={amount}
          onChange={(e) => {
            setAmount(formatAmountTyping(e.target.value));
            clearError("amount");
          }}
          placeholder="50.000"
          className={`${fieldClass} text-2xl`}
        />
        <span id="amount-help" className="text-xs">
          En pesos. Los miles se separan solos; usa coma para decimales (150,50).
        </span>
        <FieldError id="amount-error" message={errors.amount} />
      </Field>

      <fieldset
        key={`category-${radioSync}`}
        id="category"
        role="radiogroup"
        aria-required="true"
        aria-invalid={errors.category_id ? true : undefined}
        aria-describedby={describedBy(errors.category_id && "category-error")}
        className="flex min-w-0 flex-col gap-2"
      >
        <legend className="mb-1 text-sm text-muted">Categoría</legend>
        <div className="flex flex-wrap gap-2">
          {options.map((c) => {
            const selected = category === c.id;
            return (
              <label key={c.id} className="relative">
                <input
                  type="radio"
                  name="category_id"
                  value={c.id}
                  required
                  checked={selected}
                  onChange={() => {
                    setCategory(c.id);
                    clearError("category_id");
                  }}
                  className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                <span
                  className={`flex min-h-11 items-center gap-1.5 rounded-xl border-2 px-4 text-sm font-medium peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-soft ${
                    selected ? "border-ink bg-accent text-on-accent" : "border-field-border bg-surface text-ink"
                  }`}
                >
                  {selected && <span aria-hidden="true">✓</span>}
                  {c.name}
                </span>
              </label>
            );
          })}
        </div>
        {options.length === 0 && <p className="text-sm text-muted">No hay categorías para este tipo de movimiento.</p>}
        <FieldError id="category-error" message={errors.category_id} />
      </fieldset>

      <Field label="Fecha" htmlFor="occurred_on">
        <input
          id="occurred_on"
          name="occurred_on"
          type="date"
          required
          aria-required="true"
          aria-invalid={errors.occurred_on ? true : undefined}
          aria-describedby={describedBy(errors.occurred_on && "occurred_on-error")}
          defaultValue={sent?.occurred_on ?? initial.occurred_on}
          onChange={() => clearError("occurred_on")}
          className={fieldClass}
        />
        <FieldError id="occurred_on-error" message={errors.occurred_on} />
      </Field>

      <Field label="Nota (opcional)" htmlFor="note">
        <input
          id="note"
          name="note"
          maxLength={200}
          aria-invalid={errors.note ? true : undefined}
          aria-describedby={describedBy(errors.note && "note-error")}
          defaultValue={sent?.note ?? initial.note}
          onChange={() => clearError("note")}
          placeholder="Tacos con amigos"
          className={fieldClass}
        />
        <FieldError id="note-error" message={errors.note} />
      </Field>

      <p id="form-error" role="alert" className="min-h-5 text-sm text-expense">
        {state.error}
      </p>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className={`min-h-11 flex-1 rounded-xl bg-accent px-4 font-medium text-on-accent disabled:opacity-60 ${focusRing}`}
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
