#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 /path/to/audio.(mp3|m4a|wav)"
  exit 1
fi

AUDIO="$1"
OUTDIR="${2:-out}"
MODEL="${MODEL:-medium}"   # change to large if needed

mkdir -p "$OUTDIR"

# 1) Normalize audio for better results (mono, 16k)
CLEAN="$OUTDIR/clean.wav"
ffmpeg -y -i "$AUDIO" -ac 1 -ar 16000 "$CLEAN" >/dev/null 2>&1

# 2) Whisper: Telugu -> English translation with timestamps
whisper "$CLEAN" \
  --task translate \
  --model "$MODEL" \
  --output_format srt \
  --output_dir "$OUTDIR" >/dev/null

SRT="$OUTDIR/clean.srt"
MD="$OUTDIR/final.md"

# 3) Convert SRT -> Markdown (timestamped bullets)
python3 - <<'PY' "$SRT" "$MD"
import re, sys, pathlib

srt_path = pathlib.Path(sys.argv[1])
md_path  = pathlib.Path(sys.argv[2])

srt = srt_path.read_text(encoding="utf-8", errors="ignore").strip()
blocks = re.split(r"\n\s*\n", srt)

items = []
for b in blocks:
    lines = [ln.strip() for ln in b.splitlines() if ln.strip()]
    if len(lines) < 3:
        continue
    ts = lines[1]
    text = " ".join(lines[2:])
    text = re.sub(r"\s+", " ", text).strip()
    items.append((ts, text))

# merge short consecutive lines (reduces clutter)
merged = []
buf_ts, buf = None, []
for ts, text in items:
    if buf_ts is None:
        buf_ts, buf = ts, [text]
        continue
    if len(text) < 60:
        buf.append(text)
    else:
        merged.append((buf_ts, " ".join(buf)))
        buf_ts, buf = ts, [text]
if buf_ts is not None:
    merged.append((buf_ts, " ".join(buf)))

title = "Translated Transcript (Telugu → English)"
out = [f"# {title}\n", f"**Source:** {srt_path.name}\n", "## Transcript\n"]
for ts, text in merged:
    out.append(f"- **{ts}** {text}")
md_path.write_text("\n".join(out) + "\n", encoding="utf-8")

print(f"✅ Wrote: {md_path}")
PY

echo "✅ Done. Markdown: $MD"
