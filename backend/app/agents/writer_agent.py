from app.agents.llm_client import call_llm

WRITER_SYSTEM_PROMPT = """You are a high-level expert content writer and SEO strategist. 
Your goal is to generate a blog post that feels genuinely written by a subject matter expert, not an AI.

STRICT FORMATTING & STYLE RULES:
1. **H1 TITLE**: The very first line must be the Title. Do NOT use any asterisks (**), bolding, or special characters. Just plain text. No metadata on this line.
2. **BOLD METADATA**: 
   - The second line must be **Meta Description:** followed by the text.
   - The third line must be **Target Keywords:** followed by the text.
   - Both labels MUST be bold.
3. **BOLD HEADINGS**: Every H2 and H3 heading MUST be bolded using the format: ## **Your Heading** or ### **Your Subheading**.
4. **NO SKUs/CODES**: Never use internal codes or numbers like "PF614201" or "G40010". Replace them entirely with the actual product name (e.g., "Embellished Lawn Suit").
5. **PRICE INTEGRATION**: You MUST mention the product price naturally within the blog body (e.g., in features or conclusion).
6. **FAQ FORMATTING**:
   - Add exactly TWO blank lines before "## **Frequently Asked Questions**".
   - The answer (**A:**) MUST start on a NEW LINE below the question. 
   - Never put "A:" on the same line as the question.
7. **NO REPETITION**: Every section must provide NEW value. Do not rephrase the same point.
8. **HUMAN FLOW**: Use natural transitions. Avoid robotic sentence patterns.
9. **WORD COUNT**: Minimum 1200 words. Provide deep insights and examples.
"""

async def run_writer_agent(
    topic: str,
    brand_name: str,
    query: str,
    seo_data: dict,
    aeo_data: dict,
    geo_data: dict,
    scraped_data: dict = None,
    keywords: list = None
) -> str:
    """
    Blog Writer Agent: Assembles the final high-quality blog post.
    """
    scraped_section = ""
    if scraped_data and scraped_data.get("success"):
        scraped_section = f"""
SOURCE DATA (Use these facts to build authority — do not fabricate):
- Product Name: {scraped_data.get('title', 'N/A')}
- Price: {scraped_data.get('price', 'N/A') or 'See website for details'}
- Details: {scraped_data.get('description', 'N/A')}
- Full Context: {scraped_data.get('raw_text', '')[:1200]}
"""

    user_prompt = f"""Write a high-quality, human-like SEO blog post.

TOPIC: {topic}
BRAND: {brand_name}
USER CONTEXT: {query}

SEO STRATEGY (Heading Hierarchy & Keywords):
{seo_data.get('seo_strategy', '')}

AEO CONTENT (Featured Snippets & FAQ base):
{aeo_data.get('aeo_content', '')}

GEO CONTENT (Entity definitions & AI optimization):
{geo_data.get('geo_content', '')}

{scraped_section}

CORE INSTRUCTIONS:
1. **Plain Text Title**: Write the H1 Title as plain text on line 1. No ** asterisks.
2. **Bold Metadata**: 
   - Line 2: **Meta Description:** [text]
   - Line 3: **Target Keywords:** {', '.join(keywords or [])}
3. **Bold Headings**: Every H2 and H3 heading must be wrapped in double asterisks, e.g., ## **The Importance of Quality**.
4. **Eliminate SKUs**: Completely remove any alphanumeric codes like "PF614201" from the text. Use the descriptive name from the Title instead.
5. **Mention Price**: You MUST include the price of Rs.{scraped_data.get('price', '5,000')} in the text.
6. **FAQ Structure**: 
   - ## **Frequently Asked Questions**
   - **Q: [Question]?**
   - **A:** [Answer on this new line]
7. **Length**: 1200+ words. Provide detailed comparisons and use-case scenarios.

OUTPUT: Full Markdown content only. Start directly with the H1 Title.
"""

    blog_content = await call_llm(user_prompt, WRITER_SYSTEM_PROMPT, max_tokens=4000)
    return blog_content
