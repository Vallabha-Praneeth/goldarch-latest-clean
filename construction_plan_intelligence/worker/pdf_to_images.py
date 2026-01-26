"""
PDF to Images Module
Renders PDF pages as high-quality images for analysis
"""

import fitz  # PyMuPDF
from PIL import Image
import io
from typing import List, Tuple
from pathlib import Path
import logging

from config import PDF_DPI, PDF_FORMAT, MAX_PAGES

logger = logging.getLogger(__name__)


def render_pdf_pages(
    pdf_path: str,
    output_dir: str,
    dpi: int = PDF_DPI
) -> List[Tuple[int, str]]:
    """
    Render PDF pages as images

    Args:
        pdf_path: Path to PDF file
        output_dir: Directory to save rendered images
        dpi: Resolution in DPI (default: 300)

    Returns:
        List of tuples: (page_number, image_path)
    """
    logger.info(f"Rendering PDF: {pdf_path} at {dpi} DPI")

    # Create output directory
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Open PDF
    doc = fitz.open(pdf_path)
    total_pages = len(doc)

    logger.info(f"PDF has {total_pages} pages")

    if total_pages > MAX_PAGES:
        logger.warning(f"PDF has {total_pages} pages, limiting to {MAX_PAGES}")
        total_pages = MAX_PAGES

    rendered_pages = []

    # Calculate zoom factor for desired DPI
    # PyMuPDF default is 72 DPI, so zoom = desired_dpi / 72
    zoom = dpi / 72.0
    mat = fitz.Matrix(zoom, zoom)

    for page_num in range(total_pages):
        try:
            page = doc[page_num]

            # Render page to pixmap
            pix = page.get_pixmap(matrix=mat)

            # Convert to PIL Image
            img_data = pix.tobytes("png")
            img = Image.open(io.BytesIO(img_data))

            # Save image
            output_filename = f"page_{page_num:03d}.png"
            output_filepath = output_path / output_filename
            img.save(output_filepath, PDF_FORMAT)

            rendered_pages.append((page_num, str(output_filepath)))
            logger.info(f"Rendered page {page_num + 1}/{total_pages}")

        except Exception as e:
            logger.error(f"Failed to render page {page_num}: {e}")
            continue

    doc.close()
    logger.info(f"Successfully rendered {len(rendered_pages)} pages")

    return rendered_pages


def extract_text_from_pdf(pdf_path: str) -> dict:
    """
    Extract text from PDF (useful for keyword search)

    Args:
        pdf_path: Path to PDF file

    Returns:
        Dictionary mapping page_number -> extracted_text
    """
    logger.info(f"Extracting text from PDF: {pdf_path}")

    doc = fitz.open(pdf_path)
    total_pages = min(len(doc), MAX_PAGES)

    page_texts = {}

    for page_num in range(total_pages):
        try:
            page = doc[page_num]
            text = page.get_text()
            page_texts[page_num] = text

        except Exception as e:
            logger.error(f"Failed to extract text from page {page_num}: {e}")
            page_texts[page_num] = ""

    doc.close()
    logger.info(f"Extracted text from {len(page_texts)} pages")

    return page_texts


def get_pdf_metadata(pdf_path: str) -> dict:
    """
    Extract metadata from PDF

    Args:
        pdf_path: Path to PDF file

    Returns:
        Dictionary with metadata (page_count, title, author, etc.)
    """
    doc = fitz.open(pdf_path)

    metadata = {
        "page_count": len(doc),
        "title": doc.metadata.get("title", ""),
        "author": doc.metadata.get("author", ""),
        "subject": doc.metadata.get("subject", ""),
        "creator": doc.metadata.get("creator", ""),
    }

    doc.close()
    return metadata
