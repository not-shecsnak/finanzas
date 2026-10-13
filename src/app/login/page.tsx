import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-8 px-4 py-8">
      <header>
        <h1 className="text-3xl font-semibold">Finanzas</h1>
        <p className="mt-1 text-muted">Ordena tus ingresos y gastos.</p>
      </header>
      <LoginForm />
    </main>
  );
}
