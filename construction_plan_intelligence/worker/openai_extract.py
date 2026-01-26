"""
OpenAI Extraction Module
2-pass extraction: extract → audit
"""

import logging
import json
import base64
from typing import List, Dict, Optional
from openai import OpenAI

from config import OPENAI_API_KEY, OPENAI_MODEL, EXTRACTION_PASS1_PROMPT, EXTRACTION_PASS2_PROMPT

logger = logging.getLogger(__name__)

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)


def encode_image_to_base64(image_path: str) -> str:
    """
    Encode image file to base64 string

    Args:
        image_path: Path to image file

    Returns:
        Base64 encoded string
    """
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode("utf-8")


def extract_quantities_pass1(
    image_paths: List[str],
    page_info: Optional[Dict] = None
) -> Dict:
    """
    Pass 1: Extract quantities from construction plan images

    Args:
        image_paths: List of paths to rendered page images
        page_info: Optional dict with page categorization info

    Returns:
        Extracted quantities as JSON dict
    """
    logger.info(f"Pass 1: Extracting quantities from {len(image_paths)} images")

    # Prepare image content for OpenAI
    image_content = []
    for idx, image_path in enumerate(image_paths):
        base64_image = encode_image_to_base64(image_path)
        image_content.append({
            "type": "image_url",
            "image_url": {
                "url": f"data:image/png;base64,{base64_image}"
            }
        })
        logger.info(f"Encoded image {idx + 1}/{len(image_paths)}")

    # Build context message
    context_msg = "Analyze these construction plan pages and extract quantities."
    if page_info:
        if page_info.get("has_schedules"):
            context_msg += " IMPORTANT: Door/window schedules are present - use them for accurate counts."
        if page_info.get("has_legend"):
            context_msg += " A legend/symbol key is provided - use it to interpret symbols."

    # Create messages
    messages = [
        {
            "role": "system",
            "content": EXTRACTION_PASS1_PROMPT
        },
        {
            "role": "user",
            "content": [
                {"type": "text", "text": context_msg},
                *image_content
            ]
        }
    ]

    # Call OpenAI
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=4000,  # Increased for larger JSON responses
            temperature=0.1,  # Low temperature for consistency
        )

        result_text = response.choices[0].message.content
        logger.info(f"Pass 1 completed. Tokens used: {response.usage.total_tokens}")

        # Check if response is empty
        if not result_text or result_text.strip() == "":
            logger.error("OpenAI returned empty response!")
            logger.error(f"Response object: {response}")
            raise ValueError("Empty response from OpenAI")

        # Parse JSON from response
        # GPT might wrap JSON in markdown code blocks, so clean it
        result_text = result_text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]  # Remove ```json
        if result_text.startswith("```"):
            result_text = result_text[3:]  # Remove ```
        if result_text.endswith("```"):
            result_text = result_text[:-3]  # Remove trailing ```
        result_text = result_text.strip()

        result_json = json.loads(result_text)
        return result_json

    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse JSON from Pass 1: {e}")
        logger.error(f"Response text (first 1000 chars): {result_text[:1000]}")
        logger.error(f"Response text (last 500 chars): {result_text[-500:]}")
        raise ValueError(f"Invalid JSON from extraction Pass 1: {e}")

    except Exception as e:
        logger.error(f"OpenAI API error in Pass 1: {e}")
        raise


def audit_extraction_pass2(
    pass1_result: Dict,
    original_images: Optional[List[str]] = None
) -> Dict:
    """
    Pass 2: Audit the extraction for consistency

    Args:
        pass1_result: JSON output from Pass 1
        original_images: Optional - re-send images for reference

    Returns:
        Audited and corrected JSON dict
    """
    logger.info("Pass 2: Auditing extraction for consistency")

    # Convert pass1 result to string for the audit prompt
    pass1_json_str = json.dumps(pass1_result, indent=2)

    # Build messages
    messages = [
        {
            "role": "system",
            "content": EXTRACTION_PASS2_PROMPT
        },
        {
            "role": "user",
            "content": f"Review this extraction for errors:\n\n{pass1_json_str}"
        }
    ]

    # Call OpenAI
    try:
        response = client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=messages,
            max_tokens=4000,  # Increased for larger JSON responses
            temperature=0.1,
        )

        result_text = response.choices[0].message.content
        logger.info(f"Pass 2 completed. Tokens used: {response.usage.total_tokens}")

        # Parse JSON from response
        result_text = result_text.strip()
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
        result_text = result_text.strip()

        result_json = json.loads(result_text)
        return result_json

    except json.JSONDecodeError as e:
        logger.warning(f"Failed to parse JSON from Pass 2, returning Pass 1 result: {e}")
        # If audit fails, return original Pass 1 result
        return pass1_result

    except Exception as e:
        logger.error(f"OpenAI API error in Pass 2: {e}")
        # If audit fails, return original Pass 1 result
        return pass1_result


def extract_with_2pass(
    image_paths: List[str],
    page_info: Optional[Dict] = None
) -> Dict:
    """
    Complete 2-pass extraction: extract → audit

    Args:
        image_paths: List of paths to rendered page images
        page_info: Optional dict with page categorization

    Returns:
        Final validated JSON extraction result
    """
    logger.info("Starting 2-pass extraction")

    # Pass 1: Extract
    pass1_result = extract_quantities_pass1(image_paths, page_info)

    # Pass 2: Audit
    final_result = audit_extraction_pass2(pass1_result)

    logger.info("2-pass extraction completed")

    return final_result
