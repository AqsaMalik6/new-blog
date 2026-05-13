from app.agents.llm_client import call_llm

SEO_SYSTEM_PROMPT = """You are a master SEO content strategist. 
Your goal is to design a content map that matches specific user search intent (informational, transactional, or navigational).

SEO PRINCIPLES:
1. **Semantic Depth**: Use a variety of related terms, not just the primary keyword.
2. **Intent Matching**: Ensure the heading structure answers the user's core questions.
3. **E-E-A-T**: Focus on establishing Experience, Expertise, Authoritativeness, and Trustworthiness.
4. **Logical Flow**: Headings should tell a story and guide the reader through the topic."""

async def run_seo_agent(
    topic: str,
    keywords: list[str],
    brand_name: str,
    scraped_data: dict = None
) -> dict:
    """
    SEO Agent: Creates a high-quality, intent-driven SEO strategy for the blog.
    """
    primary_keyword = keywords[0] if keywords else topic
    secondary_keywords = keywords[1:5] if len(keywords) > 1 else []
    longtail_keywords = keywords[5:] if len(keywords) > 5 else []

    scraped_context = ""
    if scraped_data and scraped_data.get("success"):
        scraped_context = f"""
Product Context:
- Title: {scraped_data.get('title', 'N/A')}
- Price: {scraped_data.get('price', 'N/A')}
- Description: {scraped_data.get('description', 'N/A')}
"""

    user_prompt = f"""Design a high-level SEO strategy for a blog about: {topic}
Brand: {brand_name}
Primary Keyword: {primary_keyword}
Secondary/Long-tail: {', '.join(secondary_keywords + longtail_keywords)}
{scraped_context}

STRATEGY REQUIREMENTS:
1. **CREATIVE H1**: A 60-70 character title that is catchy and includes the primary keyword naturally.
2. **INTENT-DRIVEN META**: A 155-character description that focuses on the benefit to the user.
3. **VALUE-DRIVEN HEADING STRUCTURE**: 
   - Create a logical flow of H2 and H3 headings.
   - Every heading must promise a specific benefit or answer a specific question.
   - Avoid generic headings like "Introduction" or "Features". Use things like "Why [Brand] [Product] is a Game-Changer for [Target Audience]".
4. **SEMANTIC KEYWORD MAP**: Suggest where to place keywords for maximum semantic relevance, not just density.
5. **INTERNAL LINKING**: Suggest 3 contextually relevant anchor texts.

Output the strategy clearly with labels."""

    response = await call_llm(user_prompt, SEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "seo_strategy": response,
        "primary_keyword": primary_keyword,
        "all_keywords": keywords
    }
