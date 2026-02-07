#!/bin/bash
set -euo pipefail

# Script to renumber sandbox migrations with correct +1 second increments
# Supports both macOS (BSD date) and GNU date

SOURCE_DIR="${SOURCE_DIR:-sandbox/migrations}"
TARGET_DIR="supabase/migrations"

# Check if source migrations directory exists
if [ ! -d "$SOURCE_DIR" ]; then
  echo "Error: Source migrations directory not found: $SOURCE_DIR"
  exit 1
fi

# Get all SQL files from source, sorted by name
shopt -s nullglob
FILES=("$SOURCE_DIR"/*.sql)
shopt -u nullglob

if [ ${#FILES[@]} -eq 0 ]; then
  echo "No migration files found in $SOURCE_DIR"
  exit 0
fi

# Function to convert timestamp to epoch (supports both macOS and GNU date)
timestamp_to_epoch() {
  local ts="$1"
  # Try macOS/BSD date first
  if epoch=$(date -j -f "%Y%m%d%H%M%S" "$ts" "+%s" 2>/dev/null); then
    echo "$epoch"
  # Fall back to GNU date
  elif epoch=$(date -d "${ts:0:8} ${ts:8:2}:${ts:10:2}:${ts:12:2}" "+%s" 2>/dev/null); then
    echo "$epoch"
  else
    echo "Error: Unable to parse timestamp $ts with available date command" >&2
    return 1
  fi
}

# Function to convert epoch to timestamp (supports both macOS and GNU date)
epoch_to_timestamp() {
  local epoch="$1"
  # Try macOS/BSD date first
  if ts=$(date -j -f "%s" "$epoch" "+%Y%m%d%H%M%S" 2>/dev/null); then
    echo "$ts"
  # Fall back to GNU date
  elif ts=$(date -d "@$epoch" "+%Y%m%d%H%M%S" 2>/dev/null); then
    echo "$ts"
  else
    echo "Error: Unable to convert epoch $epoch with available date command" >&2
    return 1
  fi
}

# Determine starting timestamp from latest migration in target directory
if [ -d "$TARGET_DIR" ]; then
  # Find the newest migration file by timestamp prefix
  LATEST_FILE=$(find "$TARGET_DIR" -name "[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]_*.sql" 2>/dev/null | sort -r | head -1 || true)

  if [ -n "$LATEST_FILE" ]; then
    # Extract the 14-digit timestamp from the filename
    LATEST_BASENAME=$(basename "$LATEST_FILE")
    LATEST_TIMESTAMP="${LATEST_BASENAME:0:14}"

    # Convert to epoch and add 1 second
    LATEST_EPOCH=$(timestamp_to_epoch "$LATEST_TIMESTAMP")
    START_EPOCH=$((LATEST_EPOCH + 1))

    echo "Found existing migrations in $TARGET_DIR"
    echo "Latest migration: $LATEST_BASENAME"
    echo "Starting from: $(epoch_to_timestamp "$START_EPOCH")"
  else
    # No existing migrations, use current time
    START_EPOCH=$(date "+%s")
    echo "No existing migrations found in $TARGET_DIR"
    echo "Starting from current time: $(epoch_to_timestamp "$START_EPOCH")"
  fi
else
  # Target directory doesn't exist, use current time
  START_EPOCH=$(date "+%s")
  echo "Target directory $TARGET_DIR does not exist yet"
  echo "Starting from current time: $(epoch_to_timestamp "$START_EPOCH")"
fi

CURRENT_EPOCH=$START_EPOCH

echo ""
echo "=== Preview of migrations to be renumbered ==="
echo ""

# Preview the renaming
declare -a RENAME_PLAN
for file in "${FILES[@]}"; do
  filename=$(basename "$file")

  # Strip existing 14-digit timestamp prefix if present
  if [[ "$filename" =~ ^[0-9]{14}_ ]]; then
    clean_name="${filename:15}"  # Remove YYYYMMDDHHmmss_
  else
    clean_name="$filename"
  fi

  # Generate new timestamp
  new_timestamp=$(epoch_to_timestamp "$CURRENT_EPOCH")
  new_filename="${new_timestamp}_${clean_name}"

  echo "  $filename -> $new_filename"

  # Store the renaming plan
  RENAME_PLAN+=("$file|$new_filename")

  # Increment by 1 second for next file
  CURRENT_EPOCH=$((CURRENT_EPOCH + 1))
done

echo ""
echo "=== Summary ==="
echo "Found ${#FILES[@]} migration file(s) in $SOURCE_DIR"
echo "Starting timestamp: $(epoch_to_timestamp "$START_EPOCH")"
echo "Ending timestamp: $(epoch_to_timestamp "$((CURRENT_EPOCH - 1))")"
echo ""
echo "Files will be copied to: $TARGET_DIR"
echo ""

# Confirmation prompt
read -p "Proceed with renumbering and copying to $TARGET_DIR? (y/N): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Operation cancelled."
  exit 0
fi

# Create target directory if it doesn't exist
mkdir -p "$TARGET_DIR"

# Perform the actual renaming and copying
echo "Copying migrations..."
for plan in "${RENAME_PLAN[@]}"; do
  IFS='|' read -r source_file target_filename <<< "$plan"
  target_path="$TARGET_DIR/$target_filename"

  cp "$source_file" "$target_path"
  echo "  Copied: $target_filename"
done

echo ""
echo "=== Renumbering complete ==="
echo "Migrations have been copied to $TARGET_DIR"
echo "You can now run: supabase db reset"
