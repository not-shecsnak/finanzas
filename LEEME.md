# Kit de arranque — proyecto nuevo con el flujo HDD

1. **Copia esta carpeta** completa a la carpeta de tu proyecto nuevo (o renómbrala y úsala como el proyecto).
2. **Edita `.env`** (solo tú): pega tu `LINEAR_API_KEY`. `LINEAR_TEAM_KEY` ya viene como `TY`. (`.gitignore` ya lo protege.)
3. **Rellena el Brief** en `CLAUDE.md` (sección 1). Lo que no sepas, déjalo.
4. En una terminal dentro de la carpeta: `git init -b main` y crea el repo en GitHub (`gh repo create <nombre> --private --source . --remote origin`).
5. Abre **Claude Code** en esa carpeta y pega el **prompt A** de `PROMPT-INICIAL.md`.

Claude instalará el flujo (`/hdd-init`), te pedirá confirmar cuenta/CI y planificará con diseño primero. Guía completa: `~/.claude/hdd/GUIA.md`.

No subas este kit con `.env` real a ningún sitio. El `.env` nunca debe llegar a git.
