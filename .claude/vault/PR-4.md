---
issue: PR-4
parent: PR-2
agente: agent-developer
fecha: 2026-10-01
estado: in-review
pr: "#2"
---
# PR-4 — Esqueleto Next.js, tema y login

Feature: [[PR-2]] · Rama `feat/PR-4-esqueleto-nextjs-tema-auth` · PR #2 abierta, sin mergear. Se apila sobre PR-1 (`feat/PR-1-bootstrap-del-flujo-hdd`).

## Qué se hizo
- `ed4625e feat: esqueleto Next.js con tema morado y pantalla de inicio`: Next.js + Tailwind con paleta morada oscura, resumen mensual, botón flotante; montos en centavos con test unitario (`src/lib/money.ts`).
- `74d7558 feat: login con Supabase Auth y rutas protegidas`: entrar, crear cuenta y salir con server actions validadas con Zod; `src/proxy.ts` refresca sesión y redirige a `/login` sin usuario.

## Decisiones
- `getUser` y no `getSession` en el proxy (valida el token contra Supabase).
- Mensaje de error genérico en el login para no revelar qué correos existen.
- Ver `docs/adr/0001-stack.md`.

## Verificación
- Los commits pasaron los hooks. `npm test` no se pudo correr en el worktree de PR-10 (sin `node_modules`); el resultado de tests de esta rama no está registrado aquí (no verificado en esta nota). Login contra Supabase real: no verificado.

## Pendientes
- Aclaraciones de UX del login se hicieron en [[PR-9]].
- Finalizar con `/close-issue PR-4` tras el merge.
