---
name: fix-secret
description: Resolve a commit blocked by gitleaks — move the secret to .env, ask the user to populate it, and WAIT for confirmation before retrying the commit
user-invocable: true
allowed-tools: Bash(git *) Bash(grep *)
argument-hint: "<file>:<line> (optional — where gitleaks flagged the secret)"
---

# Fix Secret

Use this skill whenever a `git commit` is blocked by the **gitleaks**
pre-commit hook because a secret was hardcoded in source code.

## Steps

1. **Identify the secret**: Read the gitleaks output — file, line, and
   RuleID. Confirm what kind of secret it is (API key, token, password).

2. **Remove it from the code**: Delete the hardcoded value. Refactor the
   code to read the value from an environment variable
   (e.g. `process.env.LINEAR_API_KEY`). Keep the real connection code so
   there is something meaningful to commit.

3. **Document the variable**: Make sure `.env.example` lists the variable
   name with a placeholder value — never the real one.

4. **STOP — hand off to the user.** Tell the user the exact variable name
   to set and ask them to add the real value to the `.env` file.
   NEVER read, write, or create `.env` yourself — the user owns secrets.

5. **WAIT for explicit confirmation.** Do NOT retry the commit and do NOT
   continue with any other step until the user confirms `.env` is ready
   (e.g. "listo", "ya está", "done"). This pause is MANDATORY — never
   assume `.env` is configured.

6. **Retry the commit** only after the user confirms. gitleaks now passes
   because the code is clean.

7. **Continue** the normal flow (push → PR → `/close-issue`).

## Rules

- NEVER commit a secret, even with `--no-verify`. The CI gitleaks job
  would catch it anyway and the secret would land in git history.
- NEVER touch `.env` — reading, writing, or creating it. The user
  manages all secret values.
- Step 5 is non-negotiable: WAIT for the user's confirmation before
  retrying the commit. Do not assume the flow will succeed.
