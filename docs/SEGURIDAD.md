# Revisión de seguridad y calidad (OWASP básico) — Finanzas v1

Auditoría de solo lectura hecha sobre la rama de PR-5 (ticket PR-7), con verificación posterior de los hallazgos más graves (contrastes calculados, límite de 500, zona horaria, FK). Estado al cierre de la rama `test/PR-7-e2e-ci`.

**Lo que NO cubre:** no se probó contra el Supabase real de producción ni con lector de pantalla; la CSP no se validó en un navegador real; los workflows de GitHub Actions `rls.yml` y `e2e.yml` se validaron solo como YAML hasta que corran en GitHub.

## Resultado

Sin hallazgos críticos: sin inyección SQL (consultas parametrizadas por el cliente), sin secretos en el repo (gitleaks en pre-commit y CI), sin XSS por `dangerouslySetInnerHTML`/`eval`, sin redirecciones abiertas, `getUser()` y no `getSession()` para validar sesión en el servidor.

## Hallazgos y estado

| Id | Sev. | Hallazgo | Estado |
|---|---|---|---|
| A1 | Alta | Texto blanco sobre `#8b5cf6` = 4,23:1 (<4,5:1, WCAG 1.4.3) | Corregido: texto `#0f0b1a` = 4,58:1 (PR-7) |
| A2 | Alta | CI sin gate de calidad | Corregido: lint, build, cobertura con umbral, `npm audit` de runtime, RLS y E2E (PR-8, PR-7) |
| M1 | Media | Fecha/mes con la zona del servidor (UTC en Vercel) | Corregido: `America/Bogota` en `config.ts` |
| M2 | Media | `transactions.kind` podía diferir de `categories.kind` | Corregido en migración `20261002000000_hardening.sql`; **pendiente de aplicar en Supabase** |
| M3 | Media | Sin cabeceras de seguridad | Corregido: CSP, `nosniff`, `Referrer-Policy`, `X-Frame-Options`. `script-src` con `'unsafe-inline'` (sin nonce) |
| M4 | Media | Registro abierto | **Decisión del dueño**: desactivar "Allow new users to sign up" tras crear la cuenta (ver `DEPLOY.md`) |
| M5 | Media | Prueba de RLS incompleta | Corregido: `rls_check_v2.sql` (UPDATE/DELETE ajenos, `anon`, FK real, cascada, trigger, tarjetas) y job de CI |
| M6 | Media | Resumen incorrecto con más de 500 movimientos | Corregido: paginado, con aviso si se alcanza el tope |
| M7 | Media | ARIA/teclado incompleto (tabs, radiogroup) | Corregido: radios nativos y botones `aria-pressed`; axe sin violaciones (E2E) |
| M8 | Media | Borde de campos 1,36:1 (<3:1, WCAG 1.4.11) | Corregido: `#6d5fa3` = 3,52:1 sobre el fondo |
| M9 | Media | Editar/eliminar fingían éxito con 0 filas afectadas | Corregido: se exige 1 fila y se muestra el error |
| M10 | Media | Formularios perdían lo escrito tras un error | Implementado; sin reproducir el fallo original en un navegador |
| B1 | Baja | Mensajes con detalles de configuración visibles | Abierto (cómodo en uso personal; ocultar en una app pública) |
| B2 | Baja | Enumeración de cuentas en el registro ("ese correo ya tiene cuenta") | Abierto |
| B3/B4 | Baja | Cookies perdidas en redirecciones del proxy; `startsWith("/login")` | Corregido |
| B5 | Baja | Autenticación solo en el proxy | Parcial: `requireUser()` en las acciones; el layout no verifica sesión (RLS devolvería vacío, no fuga) |
| B6 | Baja | Cookies de sesión no `httpOnly` (diseño de `@supabase/ssr`) | Aceptado; la CSP reduce el riesgo |
| B7 | Baja | Sin límite de intentos propio en login | Aceptado: depende del límite de Supabase Auth |
| B8–B11, B13 | Baja | Rango de fechas, títulos por página, `scroll-padding`, `127.0.0.1` | Corregido |
| B10 | Baja | Sin enlace "saltar al contenido" | Abierto |
| Deps | — | `npm audit` completo: 5 altas por `braces` (vía `eslint-config-next`, solo desarrollo, sin parche). Runtime: 0 | Se audita solo runtime (`--omit=dev`); revisar al actualizar `eslint-config-next` |

## Cómo se previene la regresión

- Pruebas unitarias y de Server Actions con cliente simulado (sin sesión, categoría de otro tipo, 0 filas, error de BD).
- `supabase/tests/rls_check_v2.sql` en CI contra Postgres de servicio.
- E2E con Playwright y `@axe-core/playwright` (WCAG 2.2 AA) contra Supabase local, incluido el aislamiento entre dos usuarios.
