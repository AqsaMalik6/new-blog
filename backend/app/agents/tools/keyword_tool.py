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
