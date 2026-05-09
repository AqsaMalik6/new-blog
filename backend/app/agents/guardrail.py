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
