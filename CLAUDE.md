# CLAUDE.md — Contexto del proyecto

> Este archivo se carga solo al abrir Claude Code en esta carpeta. Rellena el **Brief** (sección 1) y escribe tu petición; el resto ya está resuelto.

## 1. Brief del proyecto  (RELLENAR; lo que no sepas, déjalo en blanco y Claude preguntará)

- **Nombre:** <<Sebastian>>
- **Objetivo (1-2 líneas):** <<darme una pagina web que me pueda facilitar la vida para organizar mis finanzas como un joven que apenas tiene 20 años, quiero poner odrden a mis finanzas para poder sacar mi historial credticio con esta ayuda donde ingrese facilmente mis gastos y ingresos, con una interfaz buena para movil y ordenador con una paleta de colores morados y oscuros>>
- **Usuarios / escala:** <<sera para mi>>
- **Stack preferido:** <<a tu preferencia, pero montaremos el proyecto en supabase con vercel y en el repositorio https://github.com/not-shecsnak/finanzas.git>>
- **Restricciones:** <<la idea esa hacerlo simple para poder mostrar su funcionalidad lo mas rapido posible cumpliendo bien su funciona>>
- **Definición de "terminado" para v1:** <<criterios medibles>>
- **Linear team key:** PR   ·   **Comando de tests (Gate 1):** <<p. ej. npm test --silent | pytest -q | decide tú>>

## 2. Modo de trabajo (obligatorio)

Actúas como **ingeniero senior** dentro del harness personal (`~/.claude/CLAUDE.md`: GitHub Flow, Conventional Commits, Docker multi-stage no-root, informe de cierre). La calidad se consigue por **proceso**, no por velocidad:

1. **Diseño antes de código** (en toda feature con impacto de arquitectura, datos, tenencia o seguridad): usa `agent-architect` → requisitos, riesgos, ADRs cortos, modelo de datos, decisiones de seguridad y accesibilidad. **Preséntalo y espera mi aprobación** antes de crear tickets o escribir código.
2. **Implementación** con `agent-developer`: código pequeño, legible, validación de entrada allow-list, auth/permisos por defecto, errores explícitos, sin secretos en el código.
3. **Validación** con `agent-qa-sec`: tests unitarios + integración + (si hay UI) E2E y accesibilidad; cobertura razonable; revisión OWASP básica. Nada se declara "listo" sin pruebas ejecutadas y su salida a la vista.
4. **Operación** con `agent-devops`: Dockerfile multi-stage (imagen fijada, usuario no-root, HEALTHCHECK), `docker-compose` para desarrollo, CI en verde, `.env.example` actualizado.
5. **Documentación viva**: `README.md` (qué es, cómo correrlo en 3 comandos, cómo testear) y notas en `.claude/vault/` (las genera `close_issue.sh`).

Calidad mínima de cada entrega: compila/arranca · tests pasan (muéstralos) · linter limpio · sin TODOs ocultos · README al día · riesgos y pendientes declarados con honestidad.

## 3. Protocolo de arranque (primera sesión de este proyecto)

Haz esto en orden y **para a preguntarme solo si algo bloquea**:

1. **Entorno** (solo lectura): `git rev-parse --show-toplevel` (si no es repo, di que hace falta `git init` + repo en GitHub y espera), `gh auth status` (indica con qué cuenta se creará todo y confírmala conmigo), `python --version` (Python 3 real; en Windows `python3` puede ser el stub de la Store), `pre-commit --version`.
2. **Instalar el flujo**: `/hdd-init --team-key TY --test-cmd "<comando>"` (dry-run primero, luego real). Existe un `.env` de plantilla en esta carpeta: **no lo abras, no lo leas, no lo edites**. Para comprobar que la clave funciona, usa `python scripts/linear_client.py list` (solo lectura); si falla por falta de clave, dime que complete `.env` y espera.
3. `pre-commit install --hook-type pre-commit --hook-type commit-msg`.
4. **Ticket de arranque**: crea con `/create-issue` un ticket "Bootstrap del flujo HDD" con criterios `- [ ]`; el primer commit lleva `Refs TY-N` (el hook lo exige).
5. Revisa `.claude/hdd.conf` y `.github/workflows/ci.yml` y adáptalos al stack; confirma que el CI corre en GitHub (en un fork hay que habilitar Actions).
6. Entonces: `/plan-feature "<mi petición>"` (diseño primero, con mi aprobación; criterios `- [ ]` en TODOS los tickets, el padre incluido).

## 4. Flujo diario

`/plan-feature` → `/start-issue TY-N` (siempre antes de código) → trabajar con commits `Refs TY-N` → PR contra **mi** repo con `gh pr create --repo <dueño>/<repo> --base main` → `/close-issue TY-N` → `/close-feature TY-PADRE`. `/status`, `/agent-metrics` y `/agent-metrics-all` para ver estado y rendimiento.

## 5. Reglas duras

- **Nunca** leer ni escribir `.env`. **Nunca** `--no-verify`, ni `Closes/Fixes/Resolves`, ni commit directo a `main`.
- **Pide mi autorización explícita** antes de: push, abrir/mergear PRs, crear o cerrar tickets en Linear, borrar ramas/archivos, cualquier cambio en `main`. La autorización de una tarea no se extiende a la siguiente.
- Exit codes de `scripts/close_issue.sh`: `0` cerrado · `1` un gate falló (arréglalo, no lo esquives) · `2` entorno roto (repórtalo tal cual y arréglalo). Un gate que no puede correr falla el cierre, nunca se salta.
- Si algo falla, dilo con la salida real. No declares éxito sin verificación. Si no estás seguro, di que no lo estás.
- Respuesta final de cada tarea sustantiva: el **Informe de cierre** del `CLAUDE.md` global (qué se hizo, fases, prácticas, verificación, riesgos, siguiente paso).

## 6. Sesiones siguientes (retomar)

Al abrir una sesión nueva en este proyecto: lee este archivo, ejecuta `/status` y lee las últimas notas de `.claude/vault/` (cada nota enlaza a su feature con `[[KEY-N]]`); resume en 5 líneas dónde estamos y propón el siguiente paso. No repitas el arranque si `scripts/close_issue.sh` ya existe.

<!-- HDD:BEGIN -->
## Harness-Driven Development (HDD)

Este proyecto usa el flujo HDD: Linear (tickets) + GitHub (código) + gates mecánicos.

| Skill | Cuándo |
|---|---|
| `/plan-feature <feature>` | Al arrancar una feature: crea el ticket padre y sub-issues (uno por agente) y la nota en `.claude/vault/`. |
| `/start-issue <ID>` | SIEMPRE antes de escribir código: lee el issue, crea la rama `feat/<ID>-<slug>`, mueve a In Progress. |
| `/close-issue <ID>` | SIEMPRE para cerrar un issue: corre 3 gates (tests + CI + criterios), comenta evidencia, mueve a Done. |
| `/close-feature <ID-padre>` | Cierra los sub-issues y el padre de una feature. |
| `/status` | Panel: issues, rama, CI. |
| `/agent-metrics` | Tabla por agente de este proyecto (cerrados, ciclo medio, % de gates a la primera). |
| `/fix-secret` | Cuando gitleaks bloquea un commit. |

Reglas:

1. **Sin código sin issue**: primero `/start-issue`.
2. **`Refs <KEY>-N`, nunca `Closes/Fixes/Resolves`**: esas palabras saltan los gates (el hook `commit-msg` lo bloquea).
3. **Cierre solo con `/close-issue`**. Códigos de salida de `scripts/close_issue.sh`: `0` cerrado · `1` un gate falló · `2` entorno roto (no se pudo validar). Un gate que no puede correr falla el cierre; nunca se salta.
4. **Todo ticket (padre incluido) lleva criterios de aceptación como checkboxes `- [ ]`**: el Gate 3 falla sin ellos.
5. **Nunca leer ni escribir `.env`**: lo gestiona el usuario. Cada proyecto tiene su propio `LINEAR_API_KEY`.
6. Configuración por proyecto en `.claude/hdd.conf` (`HDD_TEST_CMD`, `HDD_CI_WORKFLOW`).

Vault del proyecto: `.claude/vault/` (notas por issue con `[[wikilinks]]`, y `_metrics/agent-log.jsonl`). La config de Obsidian (`.obsidian/`) no se versiona.
<!-- HDD:END -->

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
