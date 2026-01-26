"""
Validation Module
Validates and normalizes extraction results using Pydantic
"""

import logging
from typing import List, Dict, Optional
from pydantic import BaseModel, Field, validator

logger = logging.getLogger(__name__)


# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class Evidence(BaseModel):
    page_no: int
    artifact_id: str
    source: str  # schedule|legend|plan_symbols|ocr_text
    note: str


class Meta(BaseModel):
    floors_detected: int = Field(ge=1)
    plan_type: str  # residential|commercial|mixed|unknown
    units: str  # imperial|metric|unknown
    notes: str = ""


class DoorsByType(BaseModel):
    entry: int = Field(ge=0)
    interior: int = Field(ge=0)
    sliding: int = Field(ge=0)
    bifold: int = Field(ge=0)
    other: int = Field(ge=0)


class Doors(BaseModel):
    total: int = Field(ge=0)
    by_type: DoorsByType
    confidence: str  # low|medium|high
    evidence: List[Evidence] = []

    @validator('confidence')
    def validate_confidence(cls, v):
        if v not in ['low', 'medium', 'high']:
            return 'low'
        return v


class WindowsByType(BaseModel):
    fixed: int = Field(ge=0, default=0)
    casement: int = Field(ge=0, default=0)
    sliding: int = Field(ge=0, default=0)
    other: int = Field(ge=0, default=0)


class Windows(BaseModel):
    total: int = Field(ge=0)
    by_type: Optional[WindowsByType] = None
    confidence: str
    evidence: List[Evidence] = []

    @validator('confidence')
    def validate_confidence(cls, v):
        if v not in ['low', 'medium', 'high']:
            return 'low'
        return v


class Kitchen(BaseModel):
    cabinets_count_est: int = Field(ge=0)
    linear_ft_est: float = Field(ge=0)
    confidence: str
    evidence: List[Evidence] = []

    @validator('confidence')
    def validate_confidence(cls, v):
        if v not in ['low', 'medium', 'high']:
            return 'low'
        return v


class Bathrooms(BaseModel):
    bathroom_count: int = Field(ge=0)
    toilets: int = Field(ge=0)
    sinks: int = Field(ge=0)
    showers: int = Field(ge=0)
    bathtubs: int = Field(ge=0)
    confidence: str
    evidence: List[Evidence] = []

    @validator('confidence')
    def validate_confidence(cls, v):
        if v not in ['low', 'medium', 'high']:
            return 'low'
        return v


class OtherFixtures(BaseModel):
    wardrobes: int = Field(ge=0)
    closets: int = Field(ge=0)
    shelving_units: int = Field(ge=0)
    confidence: str
    evidence: List[Evidence] = []

    @validator('confidence')
    def validate_confidence(cls, v):
        if v not in ['low', 'medium', 'high']:
            return 'low'
        return v


class Review(BaseModel):
    needs_review: bool
    flags: List[str] = []
    assumptions: List[str] = []


class PlanExtractionResult(BaseModel):
    meta: Meta
    doors: Doors
    windows: Windows
    kitchen: Kitchen
    bathrooms: Bathrooms
    other_fixtures: OtherFixtures
    review: Review


# ============================================================================
# VALIDATION FUNCTIONS
# ============================================================================

def validate_extraction(raw_json: Dict) -> Dict:
    """
    Validate extraction result using Pydantic

    Args:
        raw_json: Raw JSON dict from OpenAI

    Returns:
        Validated and normalized dict

    Raises:
        ValueError: If validation fails
    """
    logger.info("Validating extraction result")

    try:
        # Parse with Pydantic
        validated = PlanExtractionResult(**raw_json)

        # Convert back to dict
        result = validated.dict()

        logger.info("Validation successful")
        return result

    except Exception as e:
        logger.error(f"Validation failed: {e}")
        raise ValueError(f"Extraction validation failed: {e}")


def repair_extraction(raw_json: Dict) -> Optional[Dict]:
    """
    Attempt to repair common validation errors

    Args:
        raw_json: Raw JSON dict that failed validation

    Returns:
        Repaired dict, or None if repair fails
    """
    logger.info("Attempting to repair extraction")

    try:
        # Common repairs:

        # 1. Ensure required fields exist
        if 'meta' not in raw_json:
            raw_json['meta'] = {
                'floors_detected': 1,
                'plan_type': 'unknown',
                'units': 'unknown',
                'notes': ''
            }

        # 2. Ensure all main sections exist
        for section in ['doors', 'windows', 'kitchen', 'bathrooms', 'other_fixtures', 'review']:
            if section not in raw_json:
                raw_json[section] = {
                    'total': 0,
                    'confidence': 'low',
                    'evidence': []
                }

        # 3. Fix negative numbers (set to 0)
        for section in ['doors', 'windows', 'kitchen', 'bathrooms', 'other_fixtures']:
            if section in raw_json:
                for key, value in raw_json[section].items():
                    if isinstance(value, (int, float)) and value < 0:
                        logger.warning(f"Fixed negative value in {section}.{key}: {value} -> 0")
                        raw_json[section][key] = 0

        # 4. Ensure confidence is valid
        valid_confidence = ['low', 'medium', 'high']
        for section in ['doors', 'windows', 'kitchen', 'bathrooms', 'other_fixtures']:
            if section in raw_json:
                conf = raw_json[section].get('confidence', 'low')
                if conf not in valid_confidence:
                    raw_json[section]['confidence'] = 'low'

        # 5. Ensure review section exists
        if 'review' not in raw_json:
            raw_json['review'] = {
                'needs_review': True,
                'flags': ['Auto-repaired from validation errors'],
                'assumptions': []
            }
        else:
            # Add repair flag
            if 'flags' not in raw_json['review']:
                raw_json['review']['flags'] = []
            raw_json['review']['flags'].append('Auto-repaired from validation errors')

        # Try validation again
        return validate_extraction(raw_json)

    except Exception as e:
        logger.error(f"Repair failed: {e}")
        return None


def validate_with_repair(raw_json: Dict) -> Dict:
    """
    Validate extraction, with automatic repair attempt if validation fails

    Args:
        raw_json: Raw JSON dict from OpenAI

    Returns:
        Validated dict

    Raises:
        ValueError: If validation and repair both fail
    """
    try:
        return validate_extraction(raw_json)
    except ValueError as e:
        logger.warning(f"Initial validation failed, attempting repair: {e}")
        repaired = repair_extraction(raw_json)

        if repaired is None:
            raise ValueError(f"Validation and repair both failed: {e}")

        return repaired
