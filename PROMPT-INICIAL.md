# Prompts para copiar y pegar

## A) Primera sesión de un proyecto nuevo
(Rellena antes el Brief de `CLAUDE.md`.)

```
Sigue el protocolo de arranque de CLAUDE.md. Después, con diseño primero y mi aprobación antes de crear tickets o escribir código, construye: <QUÉ QUIERO, en 1-3 frases>.
```

## B) Retomar en otra sesión (mismo proyecto)

```
Retoma el proyecto: lee CLAUDE.md, ejecuta /status y revisa las últimas notas de .claude/vault/. Dame un resumen de 5 líneas y propón el siguiente paso.
```

## C) Una feature nueva en un proyecto ya arrancado

```
/plan-feature "<feature en 1-3 frases>"
```

## D) Un arreglo pequeño

```
/create-issue "<qué falla y cómo reproducirlo>"   → luego /start-issue <ID> → arreglar con test → /close-issue <ID>
```

## E) Revisar calidad antes de mergear

```
Usa agent-qa-sec sobre la rama actual: corre los tests, revisa seguridad (OWASP básico, secretos, dependencias) y accesibilidad si hay UI. Dame hallazgos priorizados con evidencia; no cambies nada.
```
