"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent, type ReactNode } from "react";
import { saveCard, type FormState } from "@/app/(app)/credito/actions";
import { cardSchema } from "@/lib/credit-schema";
import { fieldErrors, firstInvalidField, pickFormFields, withoutError, type FieldErrors } from "@/lib/form-validation";
import { formatAmountTyping } from "@/lib/money";

/** Campos en el orden en que aparecen en pantalla (para enfocar el primero inválido). */
const FIELD_ORDER = ["name", "limit", "statement_day", "due_day"] as const;

const fieldClass =
  "min-h-11 w-full rounded-xl border border-muted bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft aria-invalid:border-expense aria-invalid:shadow-[0_0_0_1px_var(--color-expense)]";
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

export function CardForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(saveCard, {});
  const [limit, setLimit] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  // Estado del servidor cuyo error ya se descartó (un nuevo envío bloqueado por el cliente).
  const [dismissedState, setDismissedState] = useState<FormState | null>(null);

  // Tras un error React 19 resetea los campos no controlados: se repueblan con lo enviado.
  const sent = state.values;

  function clearError(name: string) {
    setErrors((e) => withoutError(e, name));
  }

  // Misma validación (cardSchema) que la Server Action; si falla, preventDefault evita despacharla.
  function onSubmit(e: FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const data = pickFormFields(new FormData(form), FIELD_ORDER);
    // Igual que la Server Action: un campo ausente cuenta como texto vacío.
    const found = fieldErrors(cardSchema, Object.fromEntries(FIELD_ORDER.map((name) => [name, data[name] ?? ""])));
    setErrors(found);
    const first = firstInvalidField(found, FIELD_ORDER);
    if (!first) return;
    // El error del servidor es de un envío anterior: se oculta al bloquear este.
    setDismissedState(state);
    e.preventDefault();
    const el = form.elements.namedItem(first);
    if (el instanceof HTMLElement) el.focus();
  }

  return (
    <form action={action} onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <Field label="Nombre de la tarjeta" htmlFor="name">
        <input
          id="name"
          name="name"
          required
          aria-required="true"
          aria-invalid={errors.name ? true : undefined}
          aria-describedby={describedBy(errors.name && "name-error")}
          maxLength={40}
          autoComplete="off"
          defaultValue={sent?.name ?? ""}
          placeholder="Mi tarjeta"
          onChange={() => clearError("name")}
          className={fieldClass}
        />
        <FieldError id="name-error" message={errors.name} />
      </Field>

      <Field label="Límite de crédito" htmlFor="limit">
        <input
          id="limit"
          name="limit"
          inputMode="decimal"
          autoComplete="off"
          required
          aria-required="true"
          aria-invalid={errors.limit ? true : undefined}
          aria-describedby={describedBy("limit-help", errors.limit && "limit-error")}
          value={limit}
          onChange={(e) => {
            setLimit(formatAmountTyping(e.target.value));
            clearError("limit");
          }}
          placeholder="2.000.000"
          className={fieldClass}
        />
        <span id="limit-help" className="text-xs">
          En pesos, mayor que 0.
        </span>
        <FieldError id="limit-error" message={errors.limit} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Día de corte" htmlFor="statement_day">
          <input
            id="statement_day"
            name="statement_day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step={1}
            required
            aria-required="true"
            aria-invalid={errors.statement_day ? true : undefined}
            aria-describedby={describedBy(errors.statement_day && "statement_day-error")}
            defaultValue={sent?.statement_day ?? ""}
            placeholder="15"
            onChange={() => clearError("statement_day")}
            className={fieldClass}
          />
          <FieldError id="statement_day-error" message={errors.statement_day} />
        </Field>
        <Field label="Día de pago" htmlFor="due_day">
          <input
            id="due_day"
            name="due_day"
            type="number"
            inputMode="numeric"
            min={1}
            max={31}
            step={1}
            required
            aria-required="true"
            aria-invalid={errors.due_day ? true : undefined}
            aria-describedby={describedBy(errors.due_day && "due_day-error")}
            defaultValue={sent?.due_day ?? ""}
            placeholder="30"
            onChange={() => clearError("due_day")}
            className={fieldClass}
          />
          <FieldError id="due_day-error" message={errors.due_day} />
        </Field>
      </div>
      <p className="text-xs text-muted">Si el mes no tiene ese día (por ejemplo 31 en abril), se usa el último día del mes.</p>

      <p id="form-error" role="alert" className="min-h-5 text-sm text-expense">
        {state === dismissedState ? null : state.error}
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
