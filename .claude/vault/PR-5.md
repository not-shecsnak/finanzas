---
issue: PR-5
parent: PR-2
agente: agent-developer
fecha: 2026-10-01
estado: in-review
pr: "#5"
---
# PR-5 — Movimientos y resumen mensual

Feature: [[PR-2]] · Rama `feat/PR-5-movimientos-resumen` · PR #5 abierta, sin mergear; apilada sobre [[PR-9]] y [[PR-4]].

## Qué se hizo
- `fca4b19`: lógica pura de montos (`parseToCents` sin float), rango de mes, resumen en centavos (`summary.ts`) y esquema Zod del formulario; alias `@/` en vitest.
- `1f0cbfb feat: movimientos, resumen mensual y navegacion`: inicio con resumen y gasto por categoría, lista con filtro por mes y categoría, formulario para crear/editar, eliminar con confirmación, navegación inferior en móvil y lateral en escritorio; server actions validadas con Zod.
- `94b66a4`: moneda y formato regional COP (`src/lib/config.ts`: `es-CO`/`COP`), decimales solo si existen.
- `87364b6`: montos a la colombiana: acepta `50000`, `50.000`, `1.500.000`, coma decimal; agrupa miles al escribir; rechaza formatos ambiguos como `1,234`.

## Decisiones
- Aritmética en centavos enteros; la RLS ([[PR-3]]) limita cada fila al usuario. Ver `docs/adr/0002-montos-en-centavos-y-rls.md`.

## Verificación
- Hay tests en `money`, `dates`, `summary` y `transaction-schema`. No se corrieron en el worktree de PR-10 (sin `node_modules`); resultados de la ejecución original no registrados aquí. Probar contra Supabase real: no verificado (la migración de PR-3 no está mergeada).

## Pendientes
- Sin E2E ni tests de componentes.
- Finalizar con `/close-issue PR-5` tras el merge.

## Registro rápido y validación cliente (rama `feat/PR-5-registro-rapido`)
- Chips de categoría (radios nativos), foco automático en el monto solo al crear, validación en cliente con `transactionSchema`/`cardSchema` vía `src/lib/form-validation.ts`; la Server Action sigue validando. Ver `docs/adr/0003-chips-y-validacion-compartida.md`.
- Medido por E2E (`e2e/registro-rapido.spec.ts`): gasto de hoy = 3 toques, ingreso = 4.
- Hallazgo: tras un error del servidor React 19 reseteaba el formulario y desmarcaba la categoría y el tipo (radios controlados); se corrige remontando los radios.
- Pendiente: probar el foco automático/teclado en un dispositivo real (iOS Safari incluido).
