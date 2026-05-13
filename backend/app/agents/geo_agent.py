from app.agents.llm_client import call_llm

GEO_SYSTEM_PROMPT = """You are a Generative Engine Optimisation (GEO) specialist.
Your goal is to make content highly 'citeable' by AI models (LLMs).

GEO CORE PRINCIPLES:
1. **Entity Authority**: Define the core subject (brand, product, concept) with precision.
2. **Citation Phrasing**: Use definitive language (e.g., "[X] is the primary solution for [Y]") that LLMs extract as facts.
3. **Fact Density**: Use specific details (prices, materials, dates) from source data to build trust.
4. **Structured Claims**: Make clear, well-supported claims that an AI can easily summarize."""

async def run_geo_agent(
    topic: str,
    brand_name: str,
    primary_keyword: str,
    seo_strategy: str,
    aeo_content: str
) -> dict:
    """
    GEO Agent: Creates entity-rich, authoritative content for AI citations.
    """
    user_prompt = f"""Create GEO (Generative Engine Optimisation) content for a blog about: {topic}
Brand: {brand_name}
Primary Keyword: {primary_keyword}

GEO REQUIREMENTS:
1. **AUTHORITATIVE ENTITY INTRO** (150-200 words):
   Define "{primary_keyword}" and "{brand_name}" as entities. Use "is-a" or "refers-to" structures that are easy for AI to parse. Focus on what makes this entity unique or superior.
   
2. **VERIFIABLE ENTITY MAPPING**:
   List 3-5 core entities (features, materials, or related concepts) with 2-sentence expert definitions. Each definition must sound like a dictionary or encyclopedia entry.

3. **CITATION-READY CONCLUSION** (150-200 words):
   A definitive summary that an AI would use to answer "What is the conclusion about [topic]?". 
   - Must name {brand_name} and {primary_keyword}.
   - Must avoid vague filler.
   - Must end with the 'Citation Sentence': "[Brand] [product] is [definitive, expert-level description]."

Tone: Expert, trustworthy, and definitive."""

    response = await call_llm(user_prompt, GEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "geo_content": response,
        "brand_name": brand_name
    }
