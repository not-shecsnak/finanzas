---
issue: PR-7
parent: PR-2
agente: agent-qa-sec
fecha: 2026-10-13
estado: in-review
---
# PR-7 — Tests, RLS y accesibilidad

Feature: [[PR-2]] · Ramas `fix/PR-7-calidad-a11y`, `fix/PR-7-rls-hardening` y `test/PR-7-e2e-ci` (esta última parte de `tmp/integracion`); sin push ni PR verificados. Relacionadas: [[PR-3]], [[PR-5]], [[PR-6]], [[PR-8]].

## Qué se hizo
Calidad y a11y (`fix/PR-7-calidad-a11y`): `e4fe6ca` contraste AA, `a770889` fechas en America/Bogota, `12c2012` paginar el resumen del mes, `7822eaa` exigir una fila afectada en update/delete, `1801589` radios nativos y `aria-pressed`, `45f2167` cookies refrescadas al redirigir, `219458c` aceptar http://127.0.0.1, `2d51535` título por ruta, `4b482c6` cabeceras HTTP y CSP.

Seguridad de BD (`fix/PR-7-rls-hardening`): `9df9149` FK compuesta por `kind`, privilegios mínimos e índices; `26e9c5f` prueba `rls_check_v2.sql` y stub local de auth.

Cierre de criterios (`test/PR-7-e2e-ci`):
- `9d48ebe` trae `supabase/` desde `fix/PR-7-rls-hardening`.
- `c0b7e2c` job de CI `rls.yml` + `scripts/rls-check.sh`: ejecuta `rls_check_v2.sql` contra Postgres 16.4 de servicio, con verificación negativa (sin hardening debe fallar).
- `adb9544` tests de integración de Server Actions con cliente Supabase simulado (36 casos).
- `033803f` cobertura v8 con umbral, artefacto y `npm audit`; `a70ea1c` audit solo de runtime (ver decisiones).
- `2e5f877`, `6c9c0d6`, `b368b02`, `5860b1e`, `d70bcb2`: Playwright + axe contra Supabase local (puertos propios), 8 specs x 2 viewports, workflow `e2e.yml`, README.

## Decisiones
- Umbral de cobertura 79% (líneas/ramas/statements) y 72% (funciones) sobre `src/lib` y `actions.ts`; cobertura real 84.22% líneas, 84.59% statements, 84.38% ramas, 77.94% funciones.
- `braces` (DoS, GHSA-vfj7-8cjw-p6xm) entra solo por `eslint-config-next` y no tiene versión parcheada: el gate audita con `--omit=dev`. Pendiente de revisar al actualizar eslint-config-next.

## Verificación (ejecutada localmente)
- `npm test`: 15 archivos, 114 tests; `npm run test:coverage` pasa el umbral; lint limpio; `next build` ok con variables ficticias.
- RLS: `rls_check_v2.sql` salió 0 con las 20 comprobaciones OK en Postgres 16.4; sin hardening falla (exit 3).
- E2E: 16/16 pasan en dos ejecuciones seguidas; axe (wcag2a/2aa/21a/21aa/22aa) con 0 violaciones en `/login`, inicio y `/movimientos/nuevo`.
- No verificado: ninguno de los workflows se ha ejecutado en GitHub Actions; `/credito` solo tiene E2E de redirección; revisión OWASP escrita no existe aún como documento.

## Pendientes (criterios de Linear)
- [ ] Revisión OWASP básica documentada (falta el documento).
- [ ] Confirmar CI en verde en GitHub tras abrir la PR (requiere autorización).
- Finalizar con `/close-issue PR-7` tras el merge.

## Cierre — 2026-10-13T16:54:13Z
- Gates: 3/3 (intentos: 1) · Agente: agent-qa-sec · PR: n/a
