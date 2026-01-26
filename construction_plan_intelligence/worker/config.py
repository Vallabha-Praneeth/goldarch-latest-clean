"""
Construction Plan Intelligence - Worker Configuration
Centralized configuration for the Python worker
"""

import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# ============================================================================
# ENVIRONMENT VARIABLES
# ============================================================================

# Supabase
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set")

# OpenAI
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise ValueError("OPENAI_API_KEY must be set")

# ============================================================================
# PROCESSING CONFIGURATION
# ============================================================================

# PDF Rendering
PDF_DPI = int(os.getenv("PDF_DPI", "300"))  # 250-300 DPI for good quality
PDF_FORMAT = "PNG"  # Output format for rendered pages

# OpenAI Model
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o")  # gpt-4o supports vision

# Processing Limits
MAX_PAGES = int(os.getenv("MAX_PAGES", "50"))  # Max pages to process
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "50"))

# Polling
POLL_INTERVAL_SECONDS = int(os.getenv("POLL_INTERVAL_SECONDS", "5"))
MAX_RETRIES = int(os.getenv("MAX_RETRIES", "3"))

# ============================================================================
# EXTRACTION PROMPTS
# ============================================================================

EXTRACTION_PASS1_PROMPT = """You are analyzing a construction plan. Extract quantities for doors, windows, kitchen fixtures, bathrooms, and other items.

IMPORTANT:
- Return ONLY valid JSON matching the schema below
- Use schedules/tables if present (most accurate)
- Use legends for interpretation help
- Use symbol counting from floor plans if no schedules exist (mark as low confidence)
- If you cannot find information, return 0 with low confidence

JSON Schema:
{
  "meta": {
    "floors_detected": <number>,
    "plan_type": "residential|commercial|mixed|unknown",
    "units": "imperial|metric|unknown",
    "notes": "<any important notes>"
  },
  "doors": {
    "total": <number>,
    "by_type": {
      "entry": <number>,
      "interior": <number>,
      "sliding": <number>,
      "bifold": <number>,
      "other": <number>
    },
    "confidence": "low|medium|high",
    "evidence": [
      {
        "page_no": <number>,
        "artifact_id": "<uuid>",
        "source": "schedule|legend|plan_symbols|ocr_text",
        "note": "<brief description>"
      }
    ]
  },
  "windows": {
    "total": <number>,
    "by_type": {
      "fixed": <number>,
      "casement": <number>,
      "sliding": <number>,
      "other": <number>
    },
    "confidence": "low|medium|high",
    "evidence": []
  },
  "kitchen": {
    "cabinets_count_est": <number>,
    "linear_ft_est": <number>,
    "confidence": "low|medium|high",
    "evidence": []
  },
  "bathrooms": {
    "bathroom_count": <number>,
    "toilets": <number>,
    "sinks": <number>,
    "showers": <number>,
    "bathtubs": <number>,
    "confidence": "low|medium|high",
    "evidence": []
  },
  "other_fixtures": {
    "wardrobes": <number>,
    "closets": <number>,
    "shelving_units": <number>,
    "confidence": "low|medium|high",
    "evidence": []
  },
  "review": {
    "needs_review": <boolean>,
    "flags": ["<flag1>", "<flag2>"],
    "assumptions": ["<assumption1>", "<assumption2>"]
  }
}

Return ONLY the JSON, no other text."""

EXTRACTION_PASS2_PROMPT = """You are auditing a construction plan quantity extraction.

Review the JSON output for internal consistency:
- Do the totals add up? (e.g., doors.total should equal sum of doors.by_type)
- Are there obvious errors or contradictions?
- Should any confidence levels be adjusted?
- Are there missing review flags?

If you find issues:
- Correct the JSON
- Add appropriate flags to review.flags
- Update confidence levels if needed

Return ONLY the corrected JSON, no other text."""

# ============================================================================
# PAGE SELECTION KEYWORDS
# ============================================================================

# Keywords for identifying relevant pages (used in simple keyword-based selection)
PAGE_KEYWORDS = {
    "schedule": ["door schedule", "window schedule", "fixture schedule", "finish schedule"],
    "legend": ["legend", "symbols", "key", "notes"],
    "floor_plan": ["floor plan", "first floor", "second floor", "ground floor", "plan view"],
}

# ============================================================================
# LOGGING
# ============================================================================

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
