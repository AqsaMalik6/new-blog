# skill-agent.md — AI Agent Pipeline Build Instructions
## AI Blog Generator SaaS Platform

---

## OVERVIEW

Build a multi-agent pipeline using the OpenAI Agents SDK. The pipeline uses Google Gemini (free tier, gemini-1.5-flash) as the primary LLM with automatic fallback to Groq (llama3-70b-8192) when Gemini quota is exceeded. Agents hand off to each other in sequence. A guardrail validator runs at the end and can trigger a retry. All of this runs server-side in the FastAPI backend.

---

## AGENT PIPELINE ORDER

```
User Query + Optional URL
          ↓
  [Orchestrator Agent]
          ↓
  [URL Scraper Tool]        ← runs only if source_url is provided
  [Keyword Research Tool]   ← runs always
          ↓
  [SEO Agent]               ← handoff from orchestrator
          ↓
  [AEO Agent]               ← handoff from SEO Agent
          ↓
  [GEO Agent]               ← handoff from AEO Agent
          ↓
  [Blog Writer Agent]       ← handoff from GEO Agent
          ↓
  [Guardrail Validator]     ← validates output
          ↓
  Final Blog Dict → saved to DB
```

---

## STEP 1 — LLM CLIENT WITH GEMINI + GROQ FALLBACK

### `app/agents/llm_client.py`

This is the most critical file. It must handle Gemini quota errors silently and fall back to Groq.

```python
import google.generativeai as genai
from groq import Groq
from app.config import settings
import logging

logger = logging.getLogger(__name__)

# Initialise Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)

# Initialise Groq client
groq_client = Groq(api_key=settings.GROQ_API_KEY)

GEMINI_MODEL = "gemini-1.5-flash"
GROQ_MODEL = "llama3-70b-8192"

# These are the error types that indicate Gemini quota exceeded
GEMINI_QUOTA_ERRORS = [
    "429",
    "quota",
    "RESOURCE_EXHAUSTED",
    "rate limit",
    "exceeded"
]

def _is_quota_error(error_str: str) -> bool:
    error_lower = error_str.lower()
    return any(keyword in error_lower for keyword in GEMINI_QUOTA_ERRORS)

async def call_llm(prompt: str, system_prompt: str = "", max_tokens: int = 4000) -> str:
    """
    Call Gemini first. If quota error, automatically fall back to Groq.
    Returns the text content of the response.
    """
    # Try Gemini first
    try:
        model = genai.GenerativeModel(
            model_name=GEMINI_MODEL,
            system_instruction=system_prompt if system_prompt else None
        )
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=0.7
            )
        )
        return response.text

    except Exception as gemini_error:
        error_str = str(gemini_error)

        if _is_quota_error(error_str):
            logger.warning("Gemini quota exceeded. Falling back to Groq.")
            return await _call_groq(prompt, system_prompt, max_tokens)
        else:
            logger.error(f"Gemini error (non-quota): {error_str}")
            # For non-quota errors, also fall back to Groq to be safe
            logger.warning("Falling back to Groq due to Gemini error.")
            return await _call_groq(prompt, system_prompt, max_tokens)

async def _call_groq(prompt: str, system_prompt: str, max_tokens: int) -> str:
    """Call Groq as fallback LLM."""
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            max_tokens=max_tokens,
            temperature=0.7
        )
        return response.choices[0].message.content
    except Exception as groq_error:
        logger.error(f"Groq also failed: {groq_error}")
        raise RuntimeError(f"Both Gemini and Groq failed. Last error: {groq_error}")
```

---

## STEP 2 — URL SCRAPER TOOL

### `app/agents/tools/scraper_tool.py`

This wraps the scraper service as an agent-callable tool.

```python
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
```

---

## STEP 3 — KEYWORD RESEARCH TOOL

### `app/agents/tools/keyword_tool.py`

```python
from app.agents.llm_client import call_llm
import json
import re

async def run_keyword_tool(topic: str, scraped_title: str = None, scraped_description: str = None) -> list[str]:
    """
    Tool: Generate a list of 8-10 SEO keyword targets for the given topic.
    Returns a list of keyword strings.
    """
    context = f"Topic: {topic}"
    if scraped_title:
        context += f"\nProduct/Page Title: {scraped_title}"
    if scraped_description:
        context += f"\nProduct/Page Description: {scraped_description}"

    system_prompt = """You are an expert SEO keyword researcher.
Your task is to generate keyword targets for blog content.
Always respond with a valid JSON array of strings. No other text. No markdown. No explanation.
Example: ["keyword one", "keyword two", "keyword three"]"""

    user_prompt = f"""Based on this context, generate 8-10 SEO keyword targets.
Include: 1 primary keyword, 3-4 secondary keywords, 3-4 long-tail keywords.
{context}

Respond ONLY with a JSON array of keyword strings."""

    response = await call_llm(user_prompt, system_prompt, max_tokens=500)

    # Extract JSON array from response
    try:
        # Try to parse directly
        keywords = json.loads(response.strip())
        if isinstance(keywords, list):
            return [str(k) for k in keywords[:10]]
    except json.JSONDecodeError:
        pass

    # Fallback: extract with regex
    match = re.search(r'\[.*?\]', response, re.DOTALL)
    if match:
        try:
            keywords = json.loads(match.group())
            return [str(k) for k in keywords[:10]]
        except:
            pass

    # Last resort: split by newlines or commas
    lines = [line.strip().strip('"').strip("'").strip(',') for line in response.split('\n') if line.strip()]
    return [l for l in lines if l][:10]
```

---

## STEP 4 — SEO AGENT

### `app/agents/seo_agent.py`

```python
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
```

---

## STEP 5 — AEO AGENT

### `app/agents/aeo_agent.py`

```python
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
```

---

## STEP 6 — GEO AGENT

### `app/agents/geo_agent.py`

```python
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
```

---

## STEP 7 — BLOG WRITER AGENT

### `app/agents/writer_agent.py`

```python
from app.agents.llm_client import call_llm

WRITER_SYSTEM_PROMPT = """You are a professional content writer and blog specialist.
You write long-form, professional blog posts that are engaging, authoritative, and publish-ready.
You follow SEO best practices naturally — keywords appear organically, headings are logical, content is thorough.
You write a minimum of 1200 words per blog. You never use filler content or padding.
Every sentence must provide value to the reader."""

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
14. Do not include internal link placeholders in final output — only the anchor text if relevant

OUTPUT: The full blog in Markdown format only. No preamble. No commentary. Start directly with # H1 Title."""

    blog_content = await call_llm(user_prompt, WRITER_SYSTEM_PROMPT, max_tokens=4000)
    return blog_content
```

---

## STEP 8 — GUARDRAIL VALIDATOR

### `app/agents/guardrail.py`

```python
import re
from dataclasses import dataclass
from typing import List

@dataclass
class GuardrailResult:
    passed: bool
    failures: List[str]
    word_count: int

def validate_blog(content: str) -> GuardrailResult:
    """
    Validates blog content against all quality requirements.
    Returns GuardrailResult with pass/fail status and list of failures.
    """
    failures = []

    # 1. Word count check
    word_count = len(content.split())
    if word_count < 1200:
        failures.append(f"WORD_COUNT: Blog has {word_count} words. Minimum is 1200. Must expand content.")

    # 2. H1 check — exactly one H1
    h1_matches = re.findall(r'^# .+', content, re.MULTILINE)
    if len(h1_matches) == 0:
        failures.append("NO_H1: Blog is missing an H1 title. Must start with # Title.")
    elif len(h1_matches) > 1:
        failures.append(f"MULTIPLE_H1: Blog has {len(h1_matches)} H1 headings. Must have exactly one.")

    # 3. FAQ section check
    if "frequently asked questions" not in content.lower() and "## faq" not in content.lower():
        failures.append("NO_FAQ: Blog is missing a Frequently Asked Questions section.")

    # 4. Meta description check
    meta_match = re.search(r'\*\*Meta Description:\*\*\s*(.+)', content) or \
                 re.search(r'Meta Description:\s*(.+)', content)
    if not meta_match:
        failures.append("NO_META: Blog is missing a Meta Description line.")
    else:
        meta_text = meta_match.group(1).strip()
        if len(meta_text) < 120:
            failures.append(f"META_TOO_SHORT: Meta description is {len(meta_text)} chars. Minimum 120.")
        elif len(meta_text) > 160:
            failures.append(f"META_TOO_LONG: Meta description is {len(meta_text)} chars. Maximum 160.")

    # 5. Placeholder content check
    forbidden_phrases = ["lorem ipsum", "[insert", "todo:", "placeholder", "[your", "add content here"]
    content_lower = content.lower()
    for phrase in forbidden_phrases:
        if phrase in content_lower:
            failures.append(f"PLACEHOLDER_TEXT: Blog contains forbidden placeholder: '{phrase}'")
            break

    # 6. Conclusion check
    if "## conclusion" not in content.lower() and "## summary" not in content.lower():
        failures.append("NO_CONCLUSION: Blog is missing a Conclusion or Summary section.")

    return GuardrailResult(
        passed=len(failures) == 0,
        failures=failures,
        word_count=word_count
    )


def build_retry_prompt(failures: List[str]) -> str:
    """Build a corrective instruction prompt for the Writer Agent retry."""
    instructions = "\n".join(f"- {f}" for f in failures)
    return f"""The previous blog failed quality validation. Fix ALL of the following issues and regenerate the complete blog:

{instructions}

Regenerate the ENTIRE blog from scratch incorporating all fixes. Do not just patch — rewrite fully."""
```

---

## STEP 9 — ORCHESTRATOR AGENT

### `app/agents/orchestrator.py`

This is the master coordinator. It calls all agents in sequence, runs the guardrail, and handles retries.

```python
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
    ready to be saved to the database.

    Returns:
        dict with keys: title, content, meta_description, image_url,
                        source_url, keyword_targets, word_count
    """
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

    # Determine topic from query + scraped data
    topic = query
    if scraped_data and scraped_data.get("title"):
        topic = f"{query} — {scraped_data['title']}"

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
                raise RuntimeError(
                    f"Blog generation failed quality check after {MAX_RETRIES} retries. "
                    f"Failures: {validation.failures}"
                )

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
```

---

## STEP 10 — AGENT PIPELINE TESTING

Test the full pipeline independently before connecting to the blog router:

```python
# test_pipeline.py (run in backend root)
import asyncio
from app.agents.orchestrator import run_blog_generation

async def test():
    # Test 1: Topic only
    result = await run_blog_generation(
        query="Benefits of using AI for content marketing",
        brand_name="TestBrand"
    )
    print("=== TEST 1: Topic only ===")
    print(f"Title: {result['title']}")
    print(f"Word count: {result['word_count']}")
    print(f"Meta: {result['meta_description']}")
    print(f"Keywords: {result['keyword_targets']}")
    print()

    # Test 2: With URL
    result2 = await run_blog_generation(
        query="Write a blog about this product",
        source_url="https://example.com",
        brand_name="TestBrand"
    )
    print("=== TEST 2: With URL ===")
    print(f"Title: {result2['title']}")
    print(f"Image URL: {result2['image_url']}")
    print(f"Word count: {result2['word_count']}")

asyncio.run(test())
```

Expected results:
- Word count ≥ 1200 for both tests
- Title extracted correctly
- Meta description 120-160 characters
- Keywords list has 8-10 items
- Test 2 image_url populated if OG image found on example.com

---

## STEP 11 — AGENT QUALITY CHECKLIST

- [ ] Gemini API call works with a simple prompt
- [ ] Groq fallback triggers correctly when `GEMINI_API_KEY` is invalid (test by passing a bad key)
- [ ] Keyword tool returns a valid list of strings (not raw JSON text)
- [ ] SEO Agent returns a non-empty seo_strategy string
- [ ] AEO Agent returns content with "Q:" and "A:" patterns
- [ ] GEO Agent returns content with entity definitions
- [ ] Blog Writer produces output ≥ 1200 words
- [ ] Guardrail correctly identifies a short blog (< 1200 words) as failing
- [ ] Guardrail correctly identifies a blog without FAQ as failing
- [ ] Retry mechanism triggers and produces a corrected blog
- [ ] `_extract_title()` correctly returns the H1 text without the `#` character
- [ ] `_extract_meta_description()` returns 120-160 chars
- [ ] Full orchestrator `run_blog_generation()` returns a dict with all required keys
- [ ] No API keys appear in any log output
- [ ] URL scraping succeeds on a real public URL (test with https://www.apple.com)
- [ ] URL scraping fails gracefully on an invalid URL (returns success=False, blog still generates)
