"""
Supabase I/O Module
Handles database and storage operations
"""

import logging
from typing import Optional, List, Dict
from supabase import create_client, Client
from pathlib import Path

from config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

logger = logging.getLogger(__name__)

# Initialize Supabase client with service role (bypass RLS)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


# ============================================================================
# JOB OPERATIONS
# ============================================================================

def update_job_status(
    job_id: str,
    status: str,
    error: Optional[str] = None
) -> bool:
    """
    Update job status

    Args:
        job_id: UUID of the job
        status: New status (queued|processing|needs_review|completed|failed)
        error: Optional error message if status is 'failed'

    Returns:
        True if successful
    """
    logger.info(f"Updating job {job_id} status to: {status}")

    try:
        update_data = {"status": status}
        if error:
            update_data["error"] = error

        supabase.table("plan_jobs").update(update_data).eq("id", job_id).execute()

        return True

    except Exception as e:
        logger.error(f"Failed to update job status: {e}")
        return False


def get_next_job() -> Optional[Dict]:
    """
    Get the next queued job to process

    Returns:
        Job dict or None if no jobs available
    """
    try:
        response = supabase.table("plan_jobs") \
            .select("*") \
            .eq("status", "queued") \
            .order("created_at") \
            .limit(1) \
            .execute()

        if response.data and len(response.data) > 0:
            job = response.data[0]
            logger.info(f"Found queued job: {job['id']}")

            # Immediately mark as processing to prevent duplicate processing
            update_job_status(job['id'], 'processing')

            return job

        return None

    except Exception as e:
        logger.error(f"Failed to get next job: {e}")
        return None


# ============================================================================
# STORAGE OPERATIONS
# ============================================================================

def download_file(file_path: str, local_path: str) -> bool:
    """
    Download file from Supabase Storage

    Args:
        file_path: Path in storage (e.g., "plans/xxx.pdf")
        local_path: Local path to save file

    Returns:
        True if successful
    """
    logger.info(f"Downloading {file_path} to {local_path}")

    try:
        # File path is stored without bucket prefix (e.g., "user_id/filename.pdf")
        # Always use "plans" bucket
        bucket = "plans"
        path_in_bucket = file_path

        # Download file
        logger.info(f"Downloading from bucket '{bucket}', path: '{path_in_bucket}'")
        response = supabase.storage.from_(bucket).download(path_in_bucket)

        # Save to local file
        Path(local_path).parent.mkdir(parents=True, exist_ok=True)
        with open(local_path, "wb") as f:
            f.write(response)

        logger.info(f"Successfully downloaded {file_path}")
        return True

    except Exception as e:
        logger.error(f"Failed to download file: {e}")
        return False


def upload_artifact(
    job_id: str,
    kind: str,
    local_file_path: str,
    page_no: Optional[int] = None,
    meta: Optional[Dict] = None
) -> Optional[str]:
    """
    Upload an artifact to storage and create database record

    Args:
        job_id: UUID of the parent job
        kind: Artifact kind (page_image|crop|debug|ocr_text|embedding_ref)
        local_file_path: Path to local file
        page_no: Optional page number
        meta: Optional metadata dict

    Returns:
        Artifact ID if successful, None otherwise
    """
    logger.info(f"Uploading artifact: {kind} for job {job_id}")

    try:
        # Generate storage path
        filename = Path(local_file_path).name
        storage_path = f"artifacts/{job_id}/{kind}/{filename}"

        # Upload file to storage
        with open(local_file_path, "rb") as f:
            supabase.storage.from_("plans").upload(
                storage_path,
                f.read(),
                {"upsert": "false"}
            )

        # Create database record
        artifact_data = {
            "job_id": job_id,
            "kind": kind,
            "artifact_path": storage_path,
            "meta": meta or {}
        }

        if page_no is not None:
            artifact_data["page_no"] = page_no

        response = supabase.table("plan_job_artifacts").insert(artifact_data).execute()

        if response.data and len(response.data) > 0:
            artifact_id = response.data[0]["id"]
            logger.info(f"Artifact uploaded: {artifact_id}")
            return artifact_id

        return None

    except Exception as e:
        logger.error(f"Failed to upload artifact: {e}")
        return None


# ============================================================================
# ANALYSIS OPERATIONS
# ============================================================================

def save_analysis(
    job_id: str,
    model: str,
    quantities: Dict,
    confidence: Dict,
    evidence: Dict,
    needs_review: bool
) -> Optional[str]:
    """
    Save analysis results to database

    Args:
        job_id: UUID of the parent job
        model: Model name used (e.g., "gpt-4o")
        quantities: Validated quantities JSON
        confidence: Confidence scores
        evidence: Evidence pointers
        needs_review: Whether manual review is needed

    Returns:
        Analysis ID if successful, None otherwise
    """
    logger.info(f"Saving analysis for job {job_id}")

    try:
        analysis_data = {
            "job_id": job_id,
            "model": model,
            "quantities": quantities,
            "confidence": confidence,
            "evidence": evidence,
            "needs_review": needs_review
        }

        response = supabase.table("plan_analyses") \
            .upsert(analysis_data) \
            .execute()

        if response.data and len(response.data) > 0:
            analysis_id = response.data[0]["id"]
            logger.info(f"Analysis saved: {analysis_id}")
            return analysis_id

        return None

    except Exception as e:
        logger.error(f"Failed to save analysis: {e}")
        return None


# ============================================================================
# HELPER FUNCTIONS
# ============================================================================

def job_exists(job_id: str) -> bool:
    """Check if a job exists"""
    try:
        response = supabase.table("plan_jobs").select("id").eq("id", job_id).execute()
        return response.data and len(response.data) > 0
    except:
        return False
