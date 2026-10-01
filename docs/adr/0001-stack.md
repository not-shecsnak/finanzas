# ADR 0001 — Stack: Next.js + Supabase + Vercel

Estado: aceptada · Fecha: 2026-10-01 · Ticket: [[PR-2]]

## Contexto
App personal (un usuario por cuenta, escala mínima) que debe mostrarse funcionando rápido, con buena UI en móvil y escritorio. El brief fija Supabase, Vercel y el repo `not-shecsnak/finanzas`; el resto del stack es libre.

## Decisión
- Next.js 16 (App Router) con React 19 y Tailwind 4: una sola base de código para UI y server actions, sin API aparte.
- Supabase para Auth y Postgres. Las lecturas/escrituras pasan por server actions y `@supabase/ssr`; `src/proxy.ts` refresca la sesión y redirige a `/login` usando `getUser` (no `getSession`).
- Zod valida toda entrada en el servidor (movimientos y auth).
- Vitest para la lógica pura (`npm test`). Node 22 en CI.
- Despliegue en Vercel (aún no configurado en esta rama; Docker/CI en PR-8, sin mergear).

## Alternativas descartadas
- SPA + API propia: más piezas para un solo usuario.
- ORM (p. ej. Prisma) sobre Postgres: se pierde la RLS nativa por usuario con el JWT de Supabase.

## Consecuencias
- Pocas piezas y despliegue simple; dependencia de Supabase y Vercel (lock-in aceptado).
- Las versiones son muy recientes (Next 16, TypeScript 7, Vitest 5): vigilar cambios incompatibles.
- La anon key es pública por diseño; la seguridad descansa en RLS ([ADR 0002](0002-montos-en-centavos-y-rls.md)).
