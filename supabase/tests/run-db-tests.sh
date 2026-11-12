#!/bin/bash
# Rebuilds a throwaway database from the migrations and runs the database
# acceptance tests, including a real two-connection concurrency test.
# Needs a local Postgres 16: PGHOST/PGPORT/PGUSER (defaults 127.0.0.1:54329, postgres).
set -euo pipefail
cd "$(dirname "$0")/../.."
export PGHOST="${PGHOST:-127.0.0.1}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
PSQL="${PSQL:-psql}"
DB=blaqora_test
q() { "$PSQL" -v ON_ERROR_STOP=1 -q "$@"; }

q -d postgres -c "drop database if exists $DB" -c "create database $DB"
q -d $DB -f supabase/tests/supabase-stubs.sql
for m in supabase/migrations/*.sql; do q -d $DB -f "$m"; done
q -d $DB -f supabase/seed.sql
q -d $DB -f supabase/tests/database.test.sql 2>&1 | sed 's/^psql:[^ ]* NOTICE:  /  /;s/^NOTICE:  /  /'

# Concurrency: two withdrawals of the whole balance at the same instant.
# The per-vendor lock must let exactly one through.
BAL=$(q -d $DB -Atc "select vendor_available_balance('00000000-0000-0000-0000-00000000000a')")
for i in 1 2; do
  q -d $DB -Atc "select pg_sleep(0.2); select request_withdrawal('00000000-0000-0000-0000-00000000000a', $BAL) ->> 'ok'" > /tmp/blaqora_w$i.txt &
done
wait
OKS=$(cat /tmp/blaqora_w1.txt /tmp/blaqora_w2.txt | grep -c '^true$' || true)
ROWS=$(q -d $DB -Atc "select count(*) from withdrawal_requests")
if [ "$OKS" = "1" ] && [ "$ROWS" = "1" ]; then
  echo "  PASS withdraw: two simultaneous full-balance withdrawals -> exactly one succeeds"
else
  echo "FAIL withdraw concurrency: $OKS succeeded, $ROWS rows"; exit 1
fi

# Concurrency: two buyers reserving the last item at the same instant.
PID=$(q -d $DB -Atc "select (save_product(id, null, '{\"product_type\":\"physical\",\"status\":\"published\",\"title\":\"Last One\",\"price\":500,\"images\":[],\"file_urls\":[],\"available_days\":[],\"time_slots\":[],\"stock_quantity\":1}', '[]', '[]') -> 'product' ->> 'id') from users where email = 'vendor-a@test.ng'")
for i in 1 2; do
  q -d $DB -Atc "select pg_sleep(0.2); select reserve_checkout('C$i', '[{\"product_id\":\"$PID\",\"quantity\":1}]') ->> 'ok'" > /tmp/blaqora_r$i.txt &
done
wait
OKS=$(cat /tmp/blaqora_r1.txt /tmp/blaqora_r2.txt | grep -c '^true$' || true)
if [ "$OKS" = "1" ]; then
  echo "  PASS holds: two buyers reserving the last item at once -> exactly one succeeds"
else
  echo "FAIL holds concurrency: $OKS succeeded"; exit 1
fi
rm -f /tmp/blaqora_w*.txt /tmp/blaqora_r*.txt
echo "DATABASE SUITE: ALL PASSED"
