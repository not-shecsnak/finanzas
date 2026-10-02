import Link from "next/link";
import { BalanceForm } from "@/components/balance-form";
import { MonthPicker } from "@/components/month-picker";
import { daysBetween, nextDueDate, UTILIZATION_TARGET, utilization } from "@/lib/credit";
import { sanitizeMonth, todayIso } from "@/lib/dates";
import { formatAmountInput, formatCents } from "@/lib/money";
import { getCardBalances, getCards, LOAD_ERROR } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

function dueText(days: number): string {
  if (days === 0) return "vence hoy";
  return days === 1 ? "falta 1 día" : `faltan ${days} días`;
}

export default async function Credito({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const sp = await searchParams;
  const month = sanitizeMonth(sp.mes);
  const today = todayIso();

  const supabase = await createClient();
  const [{ cards, error: cardsError }, { balances, error: balError }] = await Promise.all([
    getCards(supabase),
    getCardBalances(supabase, month),
  ]);
  if (cardsError || balError) console.error("[credito]", cardsError?.message ?? balError?.message);
  const balanceByCard = new Map(balances.map((b) => [b.card_id, b.balance_cents]));

  return (
    <main className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Crédito</h1>

      <p role="note" className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted">
        Esto es una guía de hábitos, <strong className="text-ink">no es tu puntaje crediticio oficial</strong>. Mantener tu
        utilización por debajo del {UTILIZATION_TARGET} % del límite y pagar a tiempo ayuda a construir buen historial.
      </p>

      <MonthPicker month={month} basePath="/credito" />

      {cardsError || balError ? (
        <p role="alert" className="rounded-2xl border border-expense/40 bg-surface p-4 text-expense">
          {LOAD_ERROR}
        </p>
      ) : cards.length === 0 ? (
        <p className="text-muted">Aún no tienes tarjetas. Agrega una para seguir tu utilización.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {cards.map((card) => {
            const balance = balanceByCard.get(card.id);
            const util = balance === undefined ? null : utilization(balance, card.limit_cents);
            const due = nextDueDate(card.due_day, today);
            const days = daysBetween(today, due);
            return (
              <li key={card.id} className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h2 className="min-w-0 truncate text-lg font-medium">{card.name}</h2>
                  <span className="shrink-0 text-sm text-muted">Límite {formatCents(card.limit_cents)}</span>
                </div>

                {util ? (
                  <div className="flex flex-col gap-2">
                    <p className="flex items-center justify-between gap-3">
                      <span>
                        Utilización: <strong>{String(util.percent).replace(".", ",")} %</strong>
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-sm ${
                          util.withinTarget ? "border-income text-income" : "border-expense text-expense"
                        }`}
                      >
                        {util.withinTarget ? "✓ Dentro de la meta" : `⚠ Sobre la meta (${UTILIZATION_TARGET} %)`}
                      </span>
                    </p>
                    <div
                      role="progressbar"
                      aria-label={`Utilización de ${card.name}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={Math.min(100, Math.round(util.percent))}
                      aria-valuetext={`${String(util.percent).replace(".", ",")} % del límite`}
                      className="relative h-3 overflow-hidden rounded-full border border-muted bg-bg"
                    >
                      <div
                        className={`h-full ${util.withinTarget ? "bg-income" : "bg-expense"}`}
                        style={{ width: `${Math.min(100, util.percent)}%` }}
                      />
                      <div
                        aria-hidden="true"
                        className="absolute inset-y-0 w-0.5 bg-ink"
                        style={{ left: `${UTILIZATION_TARGET}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted">
                      Saldo {formatCents(balance as number)} · la línea marca la meta del {UTILIZATION_TARGET} %
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted">Sin saldo registrado para este mes.</p>
                )}

                <p className="text-sm">
                  Próximo pago: <strong>{due}</strong> ({dueText(days)}) · corte el día {card.statement_day}
                </p>

                <BalanceForm
                  key={`${card.id}-${month}`}
                  cardId={card.id}
                  cardName={card.name}
                  month={month}
                  initial={balance === undefined ? "" : formatAmountInput(balance)}
                />
              </li>
            );
          })}
        </ul>
      )}

      <Link
        href="/credito/nueva"
        className="flex min-h-11 items-center justify-center rounded-xl bg-accent px-4 font-medium text-bg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-soft"
      >
        Agregar tarjeta
      </Link>
    </main>
  );
}
