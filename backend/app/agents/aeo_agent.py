from app.agents.llm_client import call_llm

AEO_SYSTEM_PROMPT = """You are an Answer Engine Optimisation (AEO) specialist.
Your goal is to create content that wins featured snippets and direct answers in AI search results (Google SGE, Perplexity).

STRICT AEO PRINCIPLES:
1. **Direct Answers**: Start every answer with the most direct information possible. No fluff.
2. **Search Intent**: Identify the 'why' behind the search. Are they looking for a guide, a comparison, or a solution to a problem?
3. **Snippet Optimization**: Structure answers in a way that Google can easily extract (lists, clear definitions, or step-by-step instructions).
4. **No Filler**: Every sentence must provide a new fact or insight."""

async def run_aeo_agent(
    topic: str,
    primary_keyword: str,
    seo_strategy: str,
    scraped_data: dict = None
) -> dict:
    """
    AEO Agent: Creates unique, high-value FAQ content and direct-answer sections.
    """
    scraped_context = ""
    if scraped_data and scraped_data.get("success"):
        scraped_context = f"Product: {scraped_data.get('title', '')}\nContext: {scraped_data.get('description', '')}"

    user_prompt = f"""Create high-value AEO content for a blog about: {topic}
Primary keyword: {primary_keyword}
{scraped_context}

REQUIREMENTS:
1. **FEATURED SNIPPET (Definition)**: A 45-55 word definition of "{primary_keyword}". Must be authoritative and citation-worthy. Start directly with "{primary_keyword} is..."
2. **DIRECT ANSWER INTRO**: A punchy, 2-sentence opening that answers "What is the best way to [topic]?" or similar high-intent query.
3. **HIGH-VALUE FAQ**: Write exactly 5 unique FAQs. 
   - DO NOT write generic questions like "What is it?".
   - DO write questions about use cases, longevity, comparisons, or specific benefits (e.g., "How does [product] compare to [competitor]?", "How to make [fragrance] last longer?").
   - Each answer must be 3-4 sentences of pure expert value.

Format each as:
Q: [Question]
A: [Answer]
"""

    response = await call_llm(user_prompt, AEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "aeo_content": response,
        "topic": topic,
        "primary_keyword": primary_keyword
    }
