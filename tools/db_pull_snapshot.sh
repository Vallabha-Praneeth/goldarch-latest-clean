#!/usr/bin/env bash
set -euo pipefail

# Resolve repo root safely (works even if invoked from another folder)
ROOT_DIR="$(git rev-parse --show-toplevel 2>/dev/null || true)"
if [[ -z "${ROOT_DIR}" ]]; then
  echo "ERROR: Not inside a git repo (can't find repo root)."
  exit 1
fi
cd "$ROOT_DIR"

SNAP_DIR="supabase/schema_snapshots/remote"
MIG_DIR="supabase/migrations"

mkdir -p "$SNAP_DIR"

echo "Running: npx supabase db pull (auto-answer: n)"

# Capture output to a temp file while also streaming it to the console.
TMP_OUT="$(mktemp -t supabase_db_pull.XXXXXX)"
trap 'rm -f "$TMP_OUT"' EXIT

# Stream to console, also write to temp.
# (Avoids tricky stdout/stderr interleaving from tee in command-substitution.)
printf "n\n" | npx supabase db pull 2>&1 | tee "$TMP_OUT"

# Extract the generated filename from CLI output
GEN_REL="$(sed -n 's/.*Schema written to \(supabase\/migrations\/[0-9]\{14\}_remote_schema\.sql\)[[:space:]]*$/\1/p' "$TMP_OUT" | tail -n 1)"
if [[ -z "${GEN_REL}" ]]; then
  echo "ERROR: Could not find generated remote schema path in output."
  exit 1
fi

GEN_PATH="$GEN_REL"
BASE="$(basename "$GEN_PATH")"
DEST="$SNAP_DIR/$BASE"

if [[ ! -f "$GEN_PATH" ]]; then
  echo "ERROR: Expected generated file not found: $GEN_PATH"
  exit 1
fi

mv -f "$GEN_PATH" "$DEST"
echo "Moved snapshot to: $DEST"

# Dedupe: if identical to the previous snapshot, delete the new one
PREV="$(ls -1 "$SNAP_DIR"/*_remote_schema.sql 2>/dev/null | grep -v "/$BASE\$" | tail -n 1 || true)"
if [[ -n "${PREV}" ]]; then
  NEW_HASH="$(shasum -a 256 "$DEST" | awk '{print $1}')"
  PREV_HASH="$(shasum -a 256 "$PREV" | awk '{print $1}')"
  if [[ "$NEW_HASH" == "$PREV_HASH" ]]; then
    rm -f "$DEST"
    echo "No schema change (snapshot identical). Deleted: $DEST"
  else
    echo "Schema changed (hash differs). Kept: $DEST"
  fi
else
  echo "No previous snapshot to compare. Kept: $DEST"
fi

# Safety: ensure nothing remains in supabase/migrations
LEFTOVERS="$(find "$MIG_DIR" -maxdepth 1 -type f -name '*_remote_schema.sql' -print || true)"
if [[ -n "${LEFTOVERS}" ]]; then
  echo "WARNING: Found leftover remote schema files in migrations:"
  echo "$LEFTOVERS"
  exit 1
fi

echo "Done."
