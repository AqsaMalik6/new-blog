from app.agents.llm_client import call_llm

SEO_SYSTEM_PROMPT = """You are an expert SEO strategist with 10+ years of experience.
Your job is to create a complete SEO strategy document for a blog post.
You understand Google's ranking factors: keyword placement, heading hierarchy, semantic relevance, E-E-A-T signals, and user intent matching.
Output structured data only — no conversational text."""

async def run_seo_agent(
    topic: str,
    keywords: list[str],
    brand_name: str,
    scraped_data: dict = None
) -> dict:
    """
    SEO Agent: Creates SEO strategy for the blog.
    Returns: title, meta_description, heading_structure, keyword_placement_notes
    """
    primary_keyword = keywords[0] if keywords else topic
    secondary_keywords = keywords[1:5] if len(keywords) > 1 else []
    longtail_keywords = keywords[5:] if len(keywords) > 5 else []

    scraped_context = ""
    if scraped_data and scraped_data.get("success"):
        scraped_context = f"""
Product/Page Details:
- Title: {scraped_data.get('title', 'N/A')}
- Description: {scraped_data.get('description', 'N/A')}
- Price: {scraped_data.get('price', 'N/A')}
- Additional context: {scraped_data.get('raw_text', '')[:500]}
"""

    user_prompt = f"""Create a complete SEO strategy for a blog post with these details:

Topic: {topic}
Brand: {brand_name}
Primary Keyword: {primary_keyword}
Secondary Keywords: {', '.join(secondary_keywords)}
Long-tail Keywords: {', '.join(longtail_keywords)}
{scraped_context}

Provide:
1. SEO-optimised H1 title (60-70 characters, includes primary keyword)
2. Meta description (150-160 characters, includes primary keyword, has a call to action)
3. Recommended heading structure (H2 and H3 headings for the full blog)
4. Keyword placement notes (where to use each keyword in the blog)
5. Internal link placeholder suggestions (2-3 anchor text suggestions for internal links)

Format as clear sections with labels."""

    response = await call_llm(user_prompt, SEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "seo_strategy": response,
        "primary_keyword": primary_keyword,
        "all_keywords": keywords
    }
