"use client";

import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";

type Mode = "login" | "signup";

const inputClass =
  "w-full rounded-xl border border-border bg-bg px-4 py-3 text-ink placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent-soft";
const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft";

const COPY: Record<Mode, { submit: string; help: string; autoComplete: string }> = {
  login: {
    submit: "Entrar",
    help: "Usa el correo y la contraseña con los que creaste tu cuenta aquí.",
    autoComplete: "current-password",
  },
  signup: {
    submit: "Crear cuenta",
    help: "Usa tu correo y elige una contraseña nueva de al menos 8 caracteres. No es la de Supabase ni ninguna clave: la defines tú ahora.",
    autoComplete: "new-password",
  },
};

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [loginState, loginAction, loginPending] = useActionState<AuthState, FormData>(login, {});
  const [signupState, signupAction, signupPending] = useActionState<AuthState, FormData>(signup, {});

  const state = mode === "login" ? loginState : signupState;
  const pending = mode === "login" ? loginPending : signupPending;
  const copy = COPY[mode];

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Acceso" className="grid grid-cols-2 gap-1 rounded-xl border border-border bg-surface p-1">
        {(["login", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => setMode(m)}
            className={`rounded-lg px-3 py-2 text-sm font-medium ${focusRing} ${
              mode === m ? "bg-accent text-white" : "text-muted"
            }`}
          >
            {m === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-4" action={mode === "login" ? loginAction : signupAction}>
        <p id="auth-help" className="text-sm text-muted">
          {copy.help}
        </p>

        <label className="flex flex-col gap-1 text-sm text-muted">
          Correo
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-describedby={state.error ? "auth-error" : "auth-help"}
            aria-invalid={state.error ? true : undefined}
            className={inputClass}
            placeholder="tu@correo.com"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-muted">
          Contraseña
          <input
            name="password"
            type="password"
            autoComplete={copy.autoComplete}
            required
            minLength={8}
            maxLength={72}
            aria-describedby={state.error ? "auth-error" : "auth-help"}
            aria-invalid={state.error ? true : undefined}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
          />
        </label>

        <p id="auth-error" role="alert" className="min-h-5 text-sm text-expense">
          {state.error}
        </p>
        {state.info && (
          <p role="status" className="text-sm text-income">
            {state.info}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className={`rounded-xl bg-accent px-4 py-3 font-medium text-white disabled:opacity-60 ${focusRing}`}
        >
          {pending ? "Un momento..." : copy.submit}
        </button>
      </form>
    </div>
  );
}
