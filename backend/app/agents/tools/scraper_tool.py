from app.services.scraper_service import scrape_url, ScrapedData
from typing import Optional

async def run_scraper_tool(url: str) -> dict:
    """
    Tool: Scrape a URL and return structured product/page data.
    Called by the Orchestrator when a source_url is provided.
    Returns a dict with scraped data or an error flag.
    """
    result: ScrapedData = await scrape_url(url)
    if not result.success:
        return {
            "success": False,
            "error": result.error,
            "title": None,
            "description": None,
            "price": None,
            "image_url": None,
            "raw_text": None
        }
    return {
        "success": True,
        "title": result.title,
        "description": result.description,
        "price": result.price,
        "image_url": result.image_url,
        "raw_text": result.raw_text
    }
