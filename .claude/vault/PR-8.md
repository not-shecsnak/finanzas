---
issue: PR-8
parent: PR-2
agente: agent-devops
fecha: 2026-10-13
estado: in-review
---
# PR-8 — Docker, CI y despliegue

Feature: [[PR-2]] · Rama `chore/PR-8-docker-ci` (sin push ni PR verificados desde esta sesión).

## Qué se hizo
- `0755a3e chore: ESLint con config de Next 16 y TypeScript 6 para typescript-eslint`: `npm run lint` funcional.
- `5e8ed63 feat: salida standalone de Next para la imagen Docker`.
- `d5c4633 feat: Dockerfile multi-stage, .dockerignore y docker-compose de desarrollo`: imagen `node:22.14.0-alpine3.21` fijada, stages deps/build/runtime, usuario `node`, `HEALTHCHECK` sobre `/login`; `NEXT_PUBLIC_*` como `--build-arg` porque se incrustan al compilar. Compose sin servicio de BD (Supabase es hospedado).
- `1188946 docs: documentar variables de Supabase en .env.example`.
- `22746d7 ci: añadir lint y build con variables ficticias al workflow`.
- En la rama de pruebas `test/PR-7-e2e-ci`: `docs/DEPLOY.md` (Supabase + Vercel) con comprobaciones por paso.

## Decisiones
- Vercel no usa el Dockerfile: Docker es la vía de desarrollo/alternativa. Node 22 en CI, imagen y Vercel.

## Verificación
- `tmp/integracion` pasó lint y build; no se verificó aquí `docker compose up` (ver el informe de la sesión) ni el CI en GitHub.

## Pendientes (criterios de Linear sin cumplir)
- Desplegado en Vercel desde `main`: requiere la cuenta del usuario; procedimiento en `docs/DEPLOY.md`.
- Finalizar con `/close-issue PR-8` tras el merge.
