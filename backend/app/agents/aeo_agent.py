from app.agents.llm_client import call_llm

AEO_SYSTEM_PROMPT = """You are an Answer Engine Optimisation (AEO) specialist.
AEO is the practice of optimising content to appear in Google's featured snippets, answer boxes, People Also Ask sections, and voice search results.
You write FAQ content that directly answers questions in 2-3 concise sentences.
Your FAQ answers are structured to be extracted by Google as featured snippets."""

async def run_aeo_agent(
    topic: str,
    primary_keyword: str,
    seo_strategy: str,
    scraped_data: dict = None
) -> dict:
    """
    AEO Agent: Creates FAQ content and direct-answer sections.
    Returns: faq_pairs, featured_snippet_paragraph, direct_answer_intro
    """
    scraped_context = ""
    if scraped_data and scraped_data.get("success"):
        scraped_context = f"Product: {scraped_data.get('title', '')}\nDescription: {scraped_data.get('description', '')}"

    user_prompt = f"""Create AEO (Answer Engine Optimisation) content for a blog about: {topic}
Primary keyword: {primary_keyword}
{scraped_context}

Provide:
1. FEATURED SNIPPET PARAGRAPH: A 40-60 word paragraph that directly defines or answers what "{primary_keyword}" is. Written to be extracted as a featured snippet. Start with "{primary_keyword} is..." or "{primary_keyword} refers to..."

2. DIRECT ANSWER INTRO: A 2-sentence direct answer to "What is {topic}?" — used as the opening of the blog introduction.

3. FAQ SECTION: Write exactly 5 frequently asked questions about this topic with direct, concise answers.
   - Each answer must be 2-4 sentences maximum
   - Questions must match real search intent (what people actually type into Google)
   - Answers must be factual and authoritative
   - Format each as:
     Q: [question]
     A: [answer]

All content must be ready to paste directly into the blog."""

    response = await call_llm(user_prompt, AEO_SYSTEM_PROMPT, max_tokens=1500)

    return {
        "aeo_content": response,
        "topic": topic,
        "primary_keyword": primary_keyword
    }
