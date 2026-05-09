import re
from app.agents.llm_client import call_llm
from app.agents.tools.scraper_tool import run_scraper_tool
from app.agents.tools.keyword_tool import run_keyword_tool
from app.agents.seo_agent import run_seo_agent
from app.agents.aeo_agent import run_aeo_agent
from app.agents.geo_agent import run_geo_agent
from app.agents.writer_agent import run_writer_agent
from app.agents.guardrail import validate_blog, build_retry_prompt
import logging

logger = logging.getLogger(__name__)

MAX_RETRIES = 2

async def run_blog_generation(
    query: str,
    source_url: str = None,
    brand_name: str = "the brand"
) -> dict:
    """
    Master orchestrator: runs the full agent pipeline and returns a dict
    """
    # Auto-extract brand from URL strictly
    if source_url:
        domain_match = re.search(r'https?://(?:www\.)?([^/.]+)', source_url)
        if domain_match:
            brand_name = domain_match.group(1).capitalize()
            logger.info(f"STRICT brand detection: {brand_name}")

    logger.info(f"Starting blog generation for query: {query[:80]}")

    # Step 1: Scrape URL if provided
    scraped_data = None
    scraped_image_url = None
    if source_url:
        logger.info(f"Scraping URL: {source_url}")
        scraped_data = await run_scraper_tool(source_url)
        if scraped_data.get("success"):
            scraped_image_url = scraped_data.get("image_url")
            logger.info("URL scraping successful")
        else:
            logger.warning(f"URL scraping failed: {scraped_data.get('error')}")

    # Step 2: Keyword research
    logger.info("Running keyword research tool")
    keywords = await run_keyword_tool(
        topic=query,
        scraped_title=scraped_data.get("title") if scraped_data else None,
        scraped_description=scraped_data.get("description") if scraped_data else None
    )
    logger.info(f"Keywords generated: {keywords}")

    # Step 3: SEO Agent
    logger.info("Running SEO Agent")
    seo_data = await run_seo_agent(
        topic=query,
        keywords=keywords,
        brand_name=brand_name,
        scraped_data=scraped_data
    )

    # Step 4: AEO Agent
    logger.info("Running AEO Agent")
    aeo_data = await run_aeo_agent(
        topic=query,
        primary_keyword=seo_data.get("primary_keyword", keywords[0] if keywords else query),
        seo_strategy=seo_data.get("seo_strategy", ""),
        scraped_data=scraped_data
    )

    # Step 5: GEO Agent
    logger.info("Running GEO Agent")
    geo_data = await run_geo_agent(
        topic=query,
        brand_name=brand_name,
        primary_keyword=seo_data.get("primary_keyword", query),
        seo_strategy=seo_data.get("seo_strategy", ""),
        aeo_content=aeo_data.get("aeo_content", "")
    )

    # Step 6: Blog Writer Agent (with retry logic)
    logger.info("Running Blog Writer Agent")
    blog_content = None
    last_failures = []

    for attempt in range(MAX_RETRIES + 1):
        if attempt == 0:
            blog_content = await run_writer_agent(
                topic=query,
                brand_name=brand_name,
                query=query,
                seo_data=seo_data,
                aeo_data=aeo_data,
                geo_data=geo_data,
                scraped_data=scraped_data,
                keywords=keywords
            )
        else:
            # Retry with corrective prompt
            logger.warning(f"Guardrail failed. Retry attempt {attempt}/{MAX_RETRIES}")
            retry_instruction = build_retry_prompt(last_failures)
            blog_content = await run_writer_agent(
                topic=query,
                brand_name=brand_name,
                query=f"{query}\n\n{retry_instruction}",
                seo_data=seo_data,
                aeo_data=aeo_data,
                geo_data=geo_data,
                scraped_data=scraped_data,
                keywords=keywords
            )

        # Step 7: Guardrail validation
        validation = validate_blog(blog_content)
        if validation.passed:
            logger.info(f"Guardrail passed. Word count: {validation.word_count}")
            break
        else:
            last_failures = validation.failures
            logger.warning(f"Guardrail failures: {validation.failures}")
            if attempt == MAX_RETRIES:
                logger.error(f"Blog generation failed quality check after {MAX_RETRIES} retries.")
                # We still return it but it failed quality
                break

    # Step 8: Extract structured fields from blog content
    title = _extract_title(blog_content)
    meta_description = _extract_meta_description(blog_content)
    word_count = len(blog_content.split())

    return {
        "title": title,
        "content": blog_content,
        "meta_description": meta_description,
        "image_url": scraped_image_url,
        "source_url": source_url,
        "keyword_targets": keywords,
        "word_count": word_count
    }


def _extract_title(content: str) -> str:
    """Extract H1 title from blog markdown."""
    match = re.search(r'^# (.+)', content, re.MULTILINE)
    if match:
        return match.group(1).strip()
    # Fallback: first non-empty line
    for line in content.split('\n'):
        line = line.strip().lstrip('#').strip()
        if line:
            return line[:200]
    return "Untitled Blog"


def _extract_meta_description(content: str) -> str:
    """Extract meta description from blog content."""
    # Try bold format: **Meta Description:** text
    match = re.search(r'\*\*Meta Description:\*\*\s*(.+)', content)
    if match:
        return match.group(1).strip()[:160]
    # Try plain format: Meta Description: text
    match = re.search(r'Meta Description:\s*(.+)', content)
    if match:
        return match.group(1).strip()[:160]
    # Fallback: first paragraph text
    paragraphs = [p.strip() for p in content.split('\n\n') if p.strip() and not p.startswith('#')]
    if paragraphs:
        return paragraphs[0][:160]
    return ""
