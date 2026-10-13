---
issue: PR-9
parent: PR-2
agente: agent-developer
fecha: 2026-10-01
estado: in-review
pr: "#4"
---
# PR-9 — Aclarar login y errores de registro

Rama `feat/PR-9-aclarar-login` · PR #4 abierta, sin mergear; apilada sobre PR-4 ([[PR-4]]). El padre [[PR-2]] es una suposición: el vínculo real en Linear no se verificó.

## Qué se hizo
- `37deb9c feat: separar entrar y crear cuenta con texto de ayuda`: dos pestañas, un botón por modo, ayuda que aclara que la contraseña es nueva y no la de Supabase; errores con `aria-describedby`.
- `f3795b9 chore: conservar bloque de reglas de Next.js que genera next dev`.
- `c67f659 fix: mostrar la causa real cuando falla el registro`: `src/lib/auth-errors.ts` traduce códigos de Supabase (registro desactivado, correo inválido, límites).
- `a95159c fix: distinguir fallo de conexion con Supabase en el registro`: errores de red indican revisar la URL.
- `6fb61b4 fix: tolerar rutas pegadas en NEXT_PUBLIC_SUPABASE_URL`: `normalizeSupabaseUrl` recorta `/rest/v1/` al origen.

## Decisiones
- Traducir códigos de error en vez de un mensaje genérico, sin romper el mensaje genérico del login (para no revelar correos).

## Verificación
- Tests unitarios añadidos: `auth-errors.test.ts` y `env.test.ts`. No se ejecutaron en esta nota (sin `node_modules` en el worktree); resultado no verificado aquí.

## Pendientes
- Finalizar con `/close-issue PR-9` tras el merge.
