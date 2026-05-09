from app.agents.llm_client import call_llm

WRITER_SYSTEM_PROMPT = """You are a professional content writer who writes long-form, structured blog posts.

STRICT FORMATTING RULES — Follow exactly:
1. **TITLE BOLDING**: The H1 Title at the top must be **BOLD**.
2. **BOLD HEADINGS**: Every section heading (H2, H3) and metadata line MUST BE BOLD. Specifically bold these: "**Meta Description:**", "**Target Keywords:**", "**Introduction to...**", "**Benefits of...**", "**How to Choose...**", "**Features of...**", "**Why Our...**", "**Frequently Asked Questions**", and "**Conclusion**".
3. **TARGET KEYWORDS**: The "**Target Keywords:**" heading must be on its own **NEW LINE**.
4. **NO SKUs/STRINGS**: Never use internal codes like G40010 or U3PEJQS. Replace them with the actual cloth/product name (e.g. "Ladies Sunglasses" or "Unstitched Suit").
5. **FAQ SPACING**: Add exactly **TWO blank lines** (two enters) before starting the "## Frequently Asked Questions" section.
6. **FAQ STRUCTURE**: The Question (**Q:**) must be on one line, and the Answer (**A:**) MUST start on the **NEXT LINE** below it.
7. **BLUE LINKS**: Use standard Markdown links `[Text](URL)` for all external links so they appear blue on the frontend.
8. Every H2 section must have at least 2-3 paragraphs.
9. Never write paragraphs longer than 4 sentences.
10. Minimum 1200 words — count carefully.
   - H1 Title
   - Meta Description line
   - Target Keywords line
   - Horizontal rule (---)
   - Introduction (no heading, just paragraphs)
   - Multiple ## H2 sections
   - ## Frequently Asked Questions
   - ## Conclusion
9. Minimum 1200 words — count carefully
10. Write in professional, authoritative, engaging English"""

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
    Blog Writer Agent: Assembles the final complete blog post.
    Returns: full blog content as markdown string (minimum 1200 words)
    """
    scraped_section = ""
    if scraped_data and scraped_data.get("success"):
        scraped_section = f"""
PRODUCT/PAGE DATA (use these exact details in the blog — do not fabricate):
- Title: {scraped_data.get('title', 'N/A')}
- Description: {scraped_data.get('description', 'N/A')}
- Price: {scraped_data.get('price', 'N/A') or 'Not provided'}
- Page context: {scraped_data.get('raw_text', '')[:800]}
"""

    user_prompt = f"""Write a complete, professional blog post using the following materials. Assemble everything into one cohesive blog post in Markdown format.

TOPIC: {topic}
BRAND: {brand_name}
USER REQUEST: {query}

SEO STRATEGY TO FOLLOW:
{seo_data.get('seo_strategy', '')}

AEO CONTENT TO INCLUDE (insert FAQ section and direct answer content):
{aeo_data.get('aeo_content', '')}

GEO CONTENT TO INCLUDE (use entity definitions and GEO conclusion):
{geo_data.get('geo_content', '')}

KEYWORDS TO NATURALLY INCLUDE: {', '.join(keywords or [])}

CRITICAL STRUCTURE REQUIREMENT:
The blog MUST contain these three clearly labeled sections:

<!-- SEO SECTION -->
The introduction must naturally include the primary keyword in the first 2 sentences.
Every H2 heading must include a secondary keyword naturally.
Include internal link placeholders formatted as [INTERNAL LINK: anchor text here].

<!-- AEO SECTION -->
The FAQ section MUST start with exactly this heading: ## Frequently Asked Questions
Each Q must be a real question people search on Google.
Each A must be 2-4 sentences, starting with a direct answer.
Format: **Q: [question]?**
**A:** [answer]

<!-- GEO SECTION -->
The Conclusion MUST mention the brand/product by name.
Use entity-rich language: define what the product IS in one authoritative sentence.
Include at least one specific fact (price, material, product code) from the scraped data.
End with a citation-friendly summary sentence structured as: "[Brand] [product] is [definitive description]."

{scraped_section}

BLOG REQUIREMENTS:
1. Minimum 1200 words (count carefully — do not submit under 1200 words)
2. Begin with the H1 title from the SEO strategy
3. Add "Meta Description: [text]" on the second line
4. Add "Target Keywords: [comma-separated]" on the third line
5. Add a horizontal rule (---) after the keywords line
6. Write a compelling introduction that includes the direct answer intro from AEO content
7. Use the heading structure from the SEO strategy
8. Include the FAQ section from AEO content (with heading "## Frequently Asked Questions")
9. Use the GEO entity-rich intro paragraph in the introduction area
10. End with the GEO conclusion paragraph under a "## Conclusion" heading
11. Write in a professional, authoritative, yet accessible tone
12. Every keyword must appear naturally in the text — never forced
13. Do not use filler phrases like "In today's fast-paced world" or "In conclusion, we can see"
14. Include internal link placeholders in final output — only the anchor text if relevant

OUTPUT: The full blog in Markdown format only. No preamble. No commentary. Start directly with # H1 Title.
"""

    blog_content = await call_llm(user_prompt, WRITER_SYSTEM_PROMPT, max_tokens=4000)
    return blog_content
