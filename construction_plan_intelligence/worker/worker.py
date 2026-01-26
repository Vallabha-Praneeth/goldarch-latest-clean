"""
Construction Plan Intelligence - Main Worker
Orchestrates the complete PDF → Extraction → Quote pipeline
"""

import logging
import time
import tempfile
import shutil
from pathlib import Path
from typing import Dict, Optional

# Local modules
import config
import supabase_io as sio
import pdf_to_images
import select_pages
import openai_extract
import validate

# Configure logging
logging.basicConfig(
    level=getattr(logging, config.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PlanProcessor:
    """Process a single plan job"""

    def __init__(self, job: Dict):
        self.job = job
        self.job_id = job['id']
        self.file_path = job['file_path']
        self.file_type = job['file_type']
        self.temp_dir = None

    def setup_workspace(self) -> str:
        """Create temporary workspace for processing"""
        self.temp_dir = tempfile.mkdtemp(prefix=f"plan_{self.job_id}_")
        logger.info(f"Created workspace: {self.temp_dir}")
        return self.temp_dir

    def cleanup_workspace(self):
        """Clean up temporary workspace"""
        if self.temp_dir and Path(self.temp_dir).exists():
            shutil.rmtree(self.temp_dir)
            logger.info(f"Cleaned up workspace: {self.temp_dir}")

    def process(self) -> bool:
        """
        Main processing pipeline

        Returns:
            True if successful, False otherwise
        """
        try:
            logger.info(f"Starting processing for job {self.job_id}")

            # 1. Setup workspace
            workspace = self.setup_workspace()

            # 2. Download file from Supabase Storage
            local_file = Path(workspace) / "input_file"
            if self.file_type == 'pdf':
                local_file = local_file.with_suffix('.pdf')
            else:
                local_file = local_file.with_suffix('.png')

            success = sio.download_file(self.file_path, str(local_file))
            if not success:
                raise Exception("Failed to download file from storage")

            # 3. Process based on file type
            if self.file_type == 'pdf':
                result = self.process_pdf(str(local_file), workspace)
            else:
                result = self.process_image(str(local_file), workspace)

            return result

        except Exception as e:
            logger.error(f"Processing failed for job {self.job_id}: {e}")
            sio.update_job_status(self.job_id, 'failed', str(e))
            return False

        finally:
            # Cleanup
            self.cleanup_workspace()

    def process_pdf(self, pdf_path: str, workspace: str) -> bool:
        """Process PDF file"""

        # 1. Render PDF pages to images
        logger.info("Step 1: Rendering PDF pages")
        output_dir = Path(workspace) / "pages"
        rendered_pages = pdf_to_images.render_pdf_pages(pdf_path, str(output_dir))

        if not rendered_pages:
            raise Exception("No pages rendered from PDF")

        # Upload page images as artifacts
        for page_no, image_path in rendered_pages:
            sio.upload_artifact(
                self.job_id,
                "page_image",
                image_path,
                page_no=page_no,
                meta={"dpi": config.PDF_DPI}
            )

        # 2. Extract text for page selection
        logger.info("Step 2: Extracting text for page selection")
        page_texts = pdf_to_images.extract_text_from_pdf(pdf_path)

        # 3. Select relevant pages
        logger.info("Step 3: Selecting relevant pages")
        categorized_pages = select_pages.select_relevant_pages(page_texts, rendered_pages)
        priority_pages = select_pages.get_page_priority(categorized_pages)

        # If no relevant pages found, use all pages (up to first 10)
        if select_pages.should_process_all_pages(categorized_pages):
            priority_pages = list(range(min(10, len(rendered_pages))))

        # Get image paths for priority pages
        page_dict = {page_no: image_path for page_no, image_path in rendered_pages}
        images_to_analyze = [page_dict[page_no] for page_no in priority_pages if page_no in page_dict]

        if not images_to_analyze:
            raise Exception("No pages selected for analysis")

        logger.info(f"Analyzing {len(images_to_analyze)} pages")

        # 4. OpenAI 2-pass extraction
        logger.info("Step 4: Running OpenAI extraction (2-pass)")

        page_info = {
            "has_schedules": len(categorized_pages.get("schedule", [])) > 0,
            "has_legend": len(categorized_pages.get("legend", [])) > 0,
        }

        raw_extraction = openai_extract.extract_with_2pass(images_to_analyze, page_info)

        # 5. Validate and normalize
        logger.info("Step 5: Validating extraction")
        validated_extraction = validate.validate_with_repair(raw_extraction)

        # 6. Save analysis results
        logger.info("Step 6: Saving analysis")

        needs_review = validated_extraction['review']['needs_review']
        confidence_summary = {
            "doors": validated_extraction['doors']['confidence'],
            "windows": validated_extraction['windows']['confidence'],
            "kitchen": validated_extraction['kitchen']['confidence'],
            "bathrooms": validated_extraction['bathrooms']['confidence'],
            "other_fixtures": validated_extraction['other_fixtures']['confidence'],
        }

        analysis_id = sio.save_analysis(
            job_id=self.job_id,
            model=config.OPENAI_MODEL,
            quantities=validated_extraction,
            confidence=confidence_summary,
            evidence={
                "analyzed_pages": priority_pages,
                "total_pages": len(rendered_pages),
                "page_categorization": categorized_pages
            },
            needs_review=needs_review
        )

        if not analysis_id:
            raise Exception("Failed to save analysis")

        # 7. Update job status
        final_status = 'needs_review' if needs_review else 'completed'
        sio.update_job_status(self.job_id, final_status)

        logger.info(f"Job {self.job_id} completed successfully with status: {final_status}")
        return True

    def process_image(self, image_path: str, workspace: str) -> bool:
        """Process single image file"""

        # Upload image as artifact
        sio.upload_artifact(
            self.job_id,
            "page_image",
            image_path,
            page_no=0,
            meta={"source": "direct_upload"}
        )

        # OpenAI extraction (single image)
        logger.info("Running OpenAI extraction on single image")

        raw_extraction = openai_extract.extract_with_2pass([image_path])

        # Validate
        validated_extraction = validate.validate_with_repair(raw_extraction)

        # Save analysis
        needs_review = validated_extraction['review']['needs_review']
        confidence_summary = {
            "doors": validated_extraction['doors']['confidence'],
            "windows": validated_extraction['windows']['confidence'],
            "kitchen": validated_extraction['kitchen']['confidence'],
            "bathrooms": validated_extraction['bathrooms']['confidence'],
            "other_fixtures": validated_extraction['other_fixtures']['confidence'],
        }

        analysis_id = sio.save_analysis(
            job_id=self.job_id,
            model=config.OPENAI_MODEL,
            quantities=validated_extraction,
            confidence=confidence_summary,
            evidence={"analyzed_pages": [0], "total_pages": 1},
            needs_review=needs_review
        )

        if not analysis_id:
            raise Exception("Failed to save analysis")

        # Update job status
        final_status = 'needs_review' if needs_review else 'completed'
        sio.update_job_status(self.job_id, final_status)

        logger.info(f"Job {self.job_id} completed successfully")
        return True


def main_worker_loop():
    """
    Main worker loop - polls for jobs and processes them
    """
    logger.info("Starting Construction Plan Intelligence Worker")
    logger.info(f"Polling interval: {config.POLL_INTERVAL_SECONDS}s")

    while True:
        try:
            # Get next queued job
            job = sio.get_next_job()

            if job:
                # Process job
                processor = PlanProcessor(job)
                processor.process()

            else:
                # No jobs, sleep
                time.sleep(config.POLL_INTERVAL_SECONDS)

        except KeyboardInterrupt:
            logger.info("Worker stopped by user")
            break

        except Exception as e:
            logger.error(f"Unexpected error in worker loop: {e}")
            time.sleep(config.POLL_INTERVAL_SECONDS)


if __name__ == "__main__":
    main_worker_loop()
