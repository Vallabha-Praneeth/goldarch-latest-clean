#!/usr/bin/env bash
set -euo pipefail

mkdir -p supabase/schema_snapshots/remote

# Run db pull and automatically answer "n" to avoid writing to remote migration history.
printf "n\n" | npx supabase db pull

# Move any generated remote schema snapshot out of migrations (if present).
shopt -s nullglob
for f in supabase/migrations/*_remote_schema.sql; do
  mv "$f" "supabase/schema_snapshots/remote/$(basename "$f")"
done
