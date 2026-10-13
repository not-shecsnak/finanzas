#!/usr/bin/env bash
# Valida el aislamiento RLS en un Postgres DESECHABLE (nunca en Supabase real).
# Uso: scripts/rls-check.sh <base> [full|no-hardening]
#   full          stub de auth -> init -> hardening -> rls_check_v2 (esperado: exit 0)
#   no-hardening  stub de auth -> init -> rls_check_v2             (esperado: exit != 0)
#   reset         elimina la base <base> y los roles anon/authenticated/service_role (los roles son
#                 globales al cluster: sin esto el stub no puede repetirse en otra base del mismo servidor)
# $PSQL define el cliente (por defecto "psql"; la conexion sale de PG* env). Los .sql entran por stdin,
# asi funciona igual con `docker exec -i <contenedor> psql -U postgres`.
set -euo pipefail
DB="${1:?uso: rls-check.sh <base> [full|no-hardening]}"
MODE="${2:-full}"
PSQL="${PSQL:-psql}"
cd "$(dirname "$0")/.."

run() { $PSQL -v ON_ERROR_STOP=1 -d "$DB" -f - < "$1"; }

if [ "$MODE" = "reset" ]; then
  $PSQL -v ON_ERROR_STOP=1 -c "drop database if exists \"$DB\""     -c 'drop role if exists anon' -c 'drop role if exists authenticated' -c 'drop role if exists service_role'
  exit 0
fi

run supabase/tests/local_auth_stub.sql
run supabase/migrations/20261001000000_init_schema.sql
if [ "$MODE" = "full" ]; then
  run supabase/migrations/20261002000000_hardening.sql
fi
run supabase/tests/rls_check_v2.sql
