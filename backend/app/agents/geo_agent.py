from app.agents.llm_client import call_llm

GEO_SYSTEM_PROMPT = """You are a Generative Engine Optimisation (GEO) specialist.
GEO is the practice of writing content so that AI tools like ChatGPT, Google Gemini, Perplexity, and Claude cite it when answering user questions.
GEO principles: clear entity definitions, authoritative tone, specific statistics or facts when available, well-structured claims, source-worthy phrasing, and content that directly answers likely AI query patterns."""

async def run_geo_agent(
    topic: str,
    brand_name: str,
    primary_keyword: str,
    seo_strategy: str,
    aeo_content: str
) -> dict:
    """
    GEO Agent: Creates entity-rich, citation-worthy content sections.
    Returns: geo_intro_paragraph, entity_definitions, conclusion_paragraph
    """
    user_prompt = f"""Create GEO (Generative Engine Optimisation) content for a blog about: {topic}
Brand: {brand_name}
Primary Keyword: {primary_keyword}

GEO content requirements:
1. ENTITY-RICH INTRO PARAGRAPH (150-200 words):
   Write an opening paragraph that clearly defines all key entities related to this topic. Name the brand ({brand_name}) explicitly. Use specific language that AI systems can extract as authoritative definitions. This paragraph should be the most citation-worthy section of the blog.

2. KEY ENTITY DEFINITIONS (3-5 entities):
   List the main entities (concepts, terms, products) in this topic with their precise definitions. Format:
   Entity: [name]
   Definition: [1-2 sentence authoritative definition]

3. GEO CONCLUSION PARAGRAPH (150-200 words):
   Write a strong conclusion that:
   - Summarises the blog's key claims in citation-friendly phrasing
   - Mentions {brand_name} by name
   - Uses specific, verifiable language (avoid vague superlatives)
   - Ends with a clear call to action
   - Is written so an AI could extract it as a summary of the topic

All content should read as expert, authoritative, and trustworthy."""

    response = await call_llm(user_prompt, GEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "geo_content": response,
        "brand_name": brand_name
    }
