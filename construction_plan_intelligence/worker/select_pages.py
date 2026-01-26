"""
Page Selection Module
Identifies relevant pages (schedules, legends, floor plans) using keyword-based heuristics
"""

import logging
from typing import List, Dict, Set

from config import PAGE_KEYWORDS

logger = logging.getLogger(__name__)


def select_relevant_pages(
    page_texts: Dict[int, str],
    rendered_pages: List[tuple]
) -> Dict[str, List[int]]:
    """
    Select relevant pages using keyword-based heuristics

    Args:
        page_texts: Dictionary mapping page_number -> extracted_text
        rendered_pages: List of (page_number, image_path) tuples

    Returns:
        Dictionary with categorized pages:
        {
            "schedule": [page_numbers],
            "legend": [page_numbers],
            "floor_plan": [page_numbers],
            "all_relevant": [page_numbers]
        }
    """
    logger.info("Selecting relevant pages using keyword matching")

    categorized_pages = {
        "schedule": [],
        "legend": [],
        "floor_plan": [],
    }

    for page_num, text in page_texts.items():
        text_lower = text.lower()

        # Check for schedules
        for keyword in PAGE_KEYWORDS["schedule"]:
            if keyword.lower() in text_lower:
                categorized_pages["schedule"].append(page_num)
                logger.info(f"Page {page_num}: Found schedule keyword '{keyword}'")
                break

        # Check for legends
        for keyword in PAGE_KEYWORDS["legend"]:
            if keyword.lower() in text_lower:
                categorized_pages["legend"].append(page_num)
                logger.info(f"Page {page_num}: Found legend keyword '{keyword}'")
                break

        # Check for floor plans
        for keyword in PAGE_KEYWORDS["floor_plan"]:
            if keyword.lower() in text_lower:
                categorized_pages["floor_plan"].append(page_num)
                logger.info(f"Page {page_num}: Found floor plan keyword '{keyword}'")
                break

    # Remove duplicates (page might match multiple categories)
    for category in categorized_pages:
        categorized_pages[category] = sorted(list(set(categorized_pages[category])))

    # Get all relevant pages (union of all categories)
    all_relevant = set()
    for pages in categorized_pages.values():
        all_relevant.update(pages)
    categorized_pages["all_relevant"] = sorted(list(all_relevant))

    logger.info(
        f"Selected pages - Schedules: {len(categorized_pages['schedule'])}, "
        f"Legends: {len(categorized_pages['legend'])}, "
        f"Floor Plans: {len(categorized_pages['floor_plan'])}, "
        f"Total Relevant: {len(categorized_pages['all_relevant'])}"
    )

    return categorized_pages


def get_page_priority(categorized_pages: Dict[str, List[int]]) -> List[int]:
    """
    Get pages in priority order for processing
    Priority: schedules > legends > floor plans

    Args:
        categorized_pages: Output from select_relevant_pages()

    Returns:
        List of page numbers in priority order
    """
    priority_order = []

    # Add schedules first (most accurate)
    priority_order.extend(categorized_pages.get("schedule", []))

    # Add legends (interpretation help)
    for page in categorized_pages.get("legend", []):
        if page not in priority_order:
            priority_order.append(page)

    # Add floor plans (for symbol counting)
    for page in categorized_pages.get("floor_plan", []):
        if page not in priority_order:
            priority_order.append(page)

    logger.info(f"Page processing priority: {priority_order}")

    return priority_order


def should_process_all_pages(categorized_pages: Dict[str, List[int]]) -> bool:
    """
    Determine if we should process all pages (fallback if no relevant pages found)

    Args:
        categorized_pages: Output from select_relevant_pages()

    Returns:
        True if we should process all pages, False otherwise
    """
    all_relevant = categorized_pages.get("all_relevant", [])

    if len(all_relevant) == 0:
        logger.warning("No relevant pages found using keywords. Will process all pages.")
        return True

    return False
