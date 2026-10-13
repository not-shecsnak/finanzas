"use client";

import { useActionState } from "react";
import { login, signup, type AuthState } from "./actions";

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft";

export function LoginForm() {
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, {});
  const state = signupState.error || signupState.info ? signupState : loginState;
  const pending = loginPending || signupPending;

  return (
    <form className="flex flex-col gap-4" action={loginAction}>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Correo
        <input name="email" type="email" autoComplete="email" required className={inputClass} placeholder="tu@correo.com" />
      </label>
      <label className="flex flex-col gap-1 text-sm text-muted">
        Contraseña
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className={inputClass}
          placeholder="Mínimo 8 caracteres"
        />
      </label>

      <p role="alert" className="min-h-5 text-sm text-expense">
        {state.error}
      </p>
      {state.info && (
        <p role="status" className="text-sm text-income">
          {state.info}
        </p>
      )}

      <button type="submit" disabled={pending} className={`rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60 ${focusRing}`}>
        Entrar
      </button>
      <button
        type="submit"
        formAction={signupAction}
        disabled={pending}
        className={`rounded-xl border border-border px-4 py-3 text-ink disabled:opacity-60 ${focusRing}`}
      >
        Crear cuenta
      </button>
    </form>
  );
}
