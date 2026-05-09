# fixes-readme.md — Bug Fixes & Improvements
## AI Blog Generator — Issues Found After Testing

**Date:** May 8, 2026  
**Priority:** High — All fixes required before production  
**Instruction:** Apply ONLY these fixes. Do not change anything else in the project.

---

## ISSUE 1 — BLOG CARD IMAGE IS BLANK (Dark Blue Box Showing Instead of Product Image)

### What is happening
When a user pastes a Shopify/e-commerce URL (like Sapphire's product page), the scraped `og:image` URL is saved in the database. But when Next.js tries to render it with `<Image />`, it fails silently and shows a blank/dark box because:
- The external image domain is not whitelisted in `next.config.ts`
- OR the product site blocks hotlinking (Sapphire blocks direct `<img src>` from other domains)
- OR the `image_url` saved in DB is `null` because the scraper did not find `og:image`

### Fix — Part A: Backend scraper_service.py (Multiple image extraction strategies)

**File:** `backend/app/services/scraper_service.py`

Replace the image extraction block with this improved version that tries multiple strategies:

```python
# Extract image — try multiple strategies in order
image_url = None

# Strategy 1: og:image meta tag
og_image = soup.find("meta", property="og:image")
if og_image and og_image.get("content"):
    image_url = og_image.get("content")

# Strategy 2: twitter:image meta tag
if not image_url:
    tw_image = soup.find("meta", attrs={"name": "twitter:image"})
    if tw_image and tw_image.get("content"):
        image_url = tw_image.get("content")

# Strategy 3: First large <img> tag in the page body (skip icons/logos)
if not image_url:
    all_imgs = soup.find_all("img", src=True)
    for img in all_imgs:
        src = img.get("src", "")
        # Skip tiny icons, SVGs, base64, tracking pixels
        if any(skip in src for skip in ["icon", "logo", "svg", "pixel", "data:image", "1x1"]):
            continue
        # Must look like a real product image URL
        if src.startswith("http") and any(ext in src.lower() for ext in [".jpg", ".jpeg", ".png", ".webp"]):
            image_url = src
            break

# Strategy 4: Shopify product image pattern (works for Sapphire and most Shopify stores)
if not image_url:
    shopify_img = soup.find("img", class_=lambda c: c and any(
        kw in str(c).lower() for kw in ["product", "featured", "main", "hero"]
    ))
    if shopify_img and shopify_img.get("src"):
        src = shopify_img.get("src")
        if src.startswith("//"):
            src = "https:" + src
        image_url = src

# Strategy 5: JSON-LD structured data (most reliable for e-commerce)
if not image_url:
    import json
    json_ld_tags = soup.find_all("script", type="application/ld+json")
    for tag in json_ld_tags:
        try:
            data = json.loads(tag.string or "")
            # Handle both single object and list
            if isinstance(data, list):
                data = data[0]
            if isinstance(data, dict):
                img = data.get("image")
                if isinstance(img, list) and img:
                    image_url = img[0] if isinstance(img[0], str) else img[0].get("url")
                elif isinstance(img, str):
                    image_url = img
                elif isinstance(img, dict):
                    image_url = img.get("url")
            if image_url:
                break
        except Exception:
            continue

# Fix protocol-relative URLs
if image_url and image_url.startswith("//"):
    image_url = "https:" + image_url
```

### Fix — Part B: next.config.ts — Allow all external image domains

**File:** `frontend/next.config.ts`

Replace or update the images config to allow all external hostnames:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",  // Allow ALL external image domains
      },
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
```

### Fix — Part C: BlogCard.tsx — Use <img> instead of Next.js <Image> for external URLs + proper fallback

**File:** `frontend/src/components/workspace/BlogCard.tsx`

The image section of BlogCard must use a regular `<img>` tag with an `onError` fallback. Next.js `<Image>` with `fill` fails silently on blocked domains.

Replace the image rendering section in BlogCard with:

```tsx
{/* Image Section — top 55% of card */}
<div className="relative w-full h-[180px] overflow-hidden rounded-t-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
  {blog.image_url ? (
    <img
      src={blog.image_url}
      alt={blog.title}
      className="w-full h-full object-cover"
      onError={(e) => {
        // If image fails to load, hide it and show gradient fallback
        const target = e.currentTarget;
        target.style.display = "none";
        const parent = target.parentElement;
        if (parent) {
          parent.classList.add("show-fallback");
        }
      }}
    />
  ) : null}
  {/* Fallback — always rendered behind image, visible when image fails */}
  <div className="absolute inset-0 flex items-center justify-center">
    <span className="text-4xl font-bold text-white/20 select-none">
      {blog.title.charAt(0).toUpperCase()}
    </span>
  </div>
</div>
```

### Fix — Part D: Blog Detail Page — Same image fix

**File:** `frontend/src/app/workspace/blogs/[id]/page.tsx`

Replace the header image section with:

```tsx
{/* Header Image */}
<div className="relative w-full h-[400px] md:h-[350px] sm:h-[220px] overflow-hidden rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 mb-8">
  {blog.image_url && (
    <img
      src={blog.image_url}
      alt={blog.title}
      className="w-full h-full object-cover"
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  )}
</div>
```

---

## ISSUE 2 — BLOG CONTENT IS UNSTRUCTURED (Not Properly SEO/AEO/GEO Formatted)

### What is happening
The generated blog content lacks visual structure. Headings exist in markdown but they all look like plain text. The blog needs:
- Bold, visually distinct H2/H3 headings
- Clear SEO metadata section at top
- AEO FAQ section visually separated
- GEO entity section highlighted

### Fix — Part A: Blog Detail Page Markdown Rendering Styles

**File:** `frontend/src/app/workspace/blogs/[id]/page.tsx`

Add these Tailwind prose styles to the `react-markdown` container div:

```tsx
<div className="
  prose prose-invert max-w-none
  prose-h1:text-3xl prose-h1:font-bold prose-h1:text-white prose-h1:mt-8 prose-h1:mb-4
  prose-h2:text-2xl prose-h2:font-bold prose-h2:text-white prose-h2:mt-10 prose-h2:mb-4
  prose-h2:border-b prose-h2:border-slate-700 prose-h2:pb-2
  prose-h3:text-xl prose-h3:font-semibold prose-h3:text-slate-200 prose-h3:mt-6 prose-h3:mb-3
  prose-p:text-slate-300 prose-p:leading-[1.85] prose-p:text-[17px] prose-p:mb-4
  prose-strong:text-white prose-strong:font-bold
  prose-ul:text-slate-300 prose-ul:space-y-2
  prose-ol:text-slate-300 prose-ol:space-y-2
  prose-li:text-slate-300
  prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-slate-400
  prose-hr:border-slate-700
  prose-a:text-primary prose-a:underline
">
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {blog.content}
  </ReactMarkdown>
</div>
```

Also install the Tailwind typography plugin if not already installed:
```bash
npm install @tailwindcss/typography
```

Add to `tailwind.config.ts`:
```typescript
plugins: [require("@tailwindcss/typography")],
```

### Fix — Part B: Blog Agent Prompt — Enforce Strict Structural Format

**File:** `backend/app/agents/writer_agent.py`

In the `WRITER_SYSTEM_PROMPT`, replace with:

```python
WRITER_SYSTEM_PROMPT = """You are a professional content writer who writes long-form, structured blog posts.

STRICT FORMATTING RULES — Follow exactly:
1. Use ## for all main section headings (H2) — these must be bold and clear
2. Use ### for subsection headings (H3)
3. Every H2 section must have at least 2-3 paragraphs
4. FAQ questions must use **Q:** and **A:** bold format
5. Never write paragraphs longer than 4 sentences
6. Use bullet points (-) for lists of 3 or more items
7. Bold (**text**) important terms, product names, brand names, and key concepts
8. The blog must have these exact sections in this order:
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
```

### Fix — Part C: Blog Agent Prompt — SEO/AEO/GEO Tags in Content

**File:** `backend/app/agents/writer_agent.py`

In the `run_writer_agent` function, add this to the user_prompt after the KEYWORDS line:

```python
"""
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
"""
```

---

## ISSUE 3 — ADD GEO CITATION BUTTON ON BLOG CARD

### What is needed
Each blog card must have a button in the bottom-right corner labeled "GEO Insight" (or similar). When clicked, it opens a modal/overlay showing a GEO citability analysis of the blog — similar to the "Neural GEO Insight" panel in the screenshot provided.

The GEO score is calculated on the frontend by analyzing the blog content. No extra API call needed.

### Fix — Step 1: Create GEO Score Calculator Utility

**File:** `frontend/src/lib/geoScore.ts` (create this new file)

```typescript
export interface GEOCluster {
  name: string;
  icon: string;
  score: number;
  maxScore: number;
  description: string;
}

export interface GEOAnalysis {
  citabilityIndex: number;
  contextWeight: "LOW" | "MODERATE" | "HIGH" | "VERY HIGH";
  contextWeightColor: string;
  contextWeightNote: string;
  clusters: GEOCluster[];
  optimizationRoadmap: string[];
  retrievalIntentAnchors: string[];
}

export function analyzeGEO(content: string, title: string, keywords: string[]): GEOAnalysis {
  const wordCount = content.split(/\s+/).length;
  const contentLower = content.toLowerCase();

  // --- Cluster Scores ---

  // 1. FAQ Coverage (0-10): Does it have FAQ with Q&A pairs?
  const faqHeading = contentLower.includes("frequently asked questions") || contentLower.includes("## faq");
  const qCount = (content.match(/\*\*Q:/gi) || content.match(/^Q:/gim) || []).length;
  const faqScore = faqHeading ? Math.min(10, 5 + qCount) : qCount > 0 ? 4 : 2;

  // 2. User Intent (0-10): Does the intro answer what the user wants?
  const hasDirectAnswer = contentLower.includes(" is a ") || contentLower.includes(" refers to ") || contentLower.includes(" are ");
  const hasIntro = wordCount > 200;
  const userIntentScore = hasDirectAnswer && hasIntro ? 8 : hasIntro ? 6 : 4;

  // 3. Styling / Recommendations (0-10): Lists, tips, how-to
  const bulletCount = (content.match(/^[-*]\s/gm) || []).length;
  const stylingScore = bulletCount >= 5 ? 9 : bulletCount >= 3 ? 7 : bulletCount >= 1 ? 5 : 3;

  // 4. Occasion Context (0-10): Mentions use cases or occasions
  const occasionWords = ["occasion", "event", "wedding", "casual", "formal", "summer", "winter", "party", "office", "daily"];
  const occasionCount = occasionWords.filter(w => contentLower.includes(w)).length;
  const occasionScore = Math.min(10, 5 + occasionCount);

  // 5. Expert Depth (0-10): Does it have expert insights, specific facts, data?
  const hasPrices = /rs\.?\s?\d+|pkr\s?\d+|\$\d+/i.test(content);
  const hasProductCode = /[A-Z0-9]{6,}/g.test(content);
  const hasSpecificFacts = hasPrices || hasProductCode;
  const expertScore = hasSpecificFacts ? 8 : wordCount > 1000 ? 7 : 5;

  // 6. Comparative Weight (0-10): Does it compare to alternatives?
  const compareWords = ["compared to", "vs", "versus", "better than", "alternative", "unlike", "similar to"];
  const compareCount = compareWords.filter(w => contentLower.includes(w)).length;
  const compareScore = compareCount >= 2 ? 9 : compareCount === 1 ? 7 : 5;

  // 7. RAG Compatibility (0-10): Is content chunked, structured, easy for AI to extract?
  const h2Count = (content.match(/^## /gm) || []).length;
  const ragScore = h2Count >= 4 ? 9 : h2Count >= 2 ? 7 : h2Count >= 1 ? 5 : 3;

  // 8. Contextual Grounding (0-10): Real-world details, brand mentions
  const brandKeywords = keywords.slice(0, 3);
  const brandMentions = brandKeywords.reduce((acc, kw) => acc + (contentLower.split(kw.toLowerCase()).length - 1), 0);
  const groundingScore = Math.min(10, 4 + brandMentions);

  // 9. Entity Linking (0-10): Named entities clearly defined
  const entityPatterns = [" is a ", " is the ", " refers to ", " defined as ", " known as "];
  const entityCount = entityPatterns.reduce((acc, p) => acc + (contentLower.split(p).length - 1), 0);
  const entityScore = Math.min(10, 4 + entityCount * 2);

  const clusters: GEOCluster[] = [
    { name: "FAQ Coverage", icon: "❓", score: faqScore, maxScore: 10, description: faqScore >= 8 ? "FAQ section is comprehensive and well-structured." : "FAQ section present but could use more targeted questions." },
    { name: "User Intent", icon: "🎯", score: userIntentScore, maxScore: 10, description: userIntentScore >= 8 ? "Blog addresses user intent clearly." : "Content addresses user intent but some sections could be more direct." },
    { name: "Styling Recs", icon: "✨", score: stylingScore, maxScore: 10, description: stylingScore >= 8 ? "Styling recommendations are clear and visual." : "More specific styling examples with product images would help." },
    { name: "Occasion Context", icon: "🎀", score: occasionScore, maxScore: 10, description: occasionScore >= 8 ? "Covers occasions well." : "Could be more specific about formal event types." },
    { name: "Expert Depth", icon: "⚖️", score: expertScore, maxScore: 10, description: expertScore >= 8 ? "Expert insights and specific facts are prominent." : "Include more specific product details and expert insights." },
    { name: "Comparative Weight", icon: "🔮", score: compareScore, maxScore: 10, description: compareScore >= 8 ? "Strong comparisons to alternatives." : "Comparison to standard options could be more detailed." },
    { name: "RAG Compatibility", icon: "💬", score: ragScore, maxScore: 10, description: ragScore >= 8 ? "Content is well-chunked for AI retrieval." : "Breaking content into more sections improves AI extraction." },
    { name: "Contextual Grounding", icon: "🌐", score: groundingScore, maxScore: 10, description: groundingScore >= 8 ? "Real-world context is strong." : "Could be more specific and detailed with brand context." },
    { name: "Entity Linking", icon: "🔗", score: entityScore, maxScore: 10, description: entityScore >= 8 ? "Entity relationships are clear." : "Entity definitions could be more prominent throughout." },
  ];

  const totalScore = clusters.reduce((acc, c) => acc + c.score, 0);
  const maxTotal = clusters.reduce((acc, c) => acc + c.maxScore, 0);
  const citabilityIndex = Math.round((totalScore / maxTotal) * 100);

  let contextWeight: GEOAnalysis["contextWeight"];
  let contextWeightColor: string;
  let contextWeightNote: string;

  if (citabilityIndex >= 80) {
    contextWeight = "HIGH";
    contextWeightColor = "#22c55e";
    contextWeightNote = "Content is highly citable by AI engines with strong factual grounding.";
  } else if (citabilityIndex >= 65) {
    contextWeight = "MODERATE";
    contextWeightColor = "#eab308";
    contextWeightNote = "Content is primarily promotional and may be considered citable, but could benefit from more expert insights and factual information.";
  } else if (citabilityIndex >= 50) {
    contextWeight = "LOW";
    contextWeightColor = "#f97316";
    contextWeightNote = "Content needs significant improvement to be cited by AI engines.";
  } else {
    contextWeight = "LOW";
    contextWeightColor = "#ef4444";
    contextWeightNote = "Content is unlikely to be cited by AI engines without major restructuring.";
  }

  // Generate optimization roadmap from failing clusters
  const roadmap: string[] = [];
  const sortedClusters = [...clusters].sort((a, b) => a.score - b.score);
  sortedClusters.slice(0, 5).forEach(c => {
    if (c.score < 8) {
      roadmap.push(c.description);
    }
  });

  // Retrieval intent anchors = top keywords
  const retrievalIntentAnchors = keywords.slice(0, 5);

  return {
    citabilityIndex,
    contextWeight,
    contextWeightColor,
    contextWeightNote,
    clusters,
    optimizationRoadmap: roadmap,
    retrievalIntentAnchors,
  };
}
```

### Fix — Step 2: Create GEO Insight Modal Component

**File:** `frontend/src/components/workspace/GEOInsightModal.tsx` (create this new file)

```tsx
"use client";
import { GEOAnalysis } from "@/lib/geoScore";
import { X } from "lucide-react";

interface Props {
  analysis: GEOAnalysis;
  onClose: () => void;
}

export default function GEOInsightModal({ analysis, onClose }: Props) {
  const progressPercent = (score: number, max: number) => Math.round((score / max) * 100);

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Modal Panel */}
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-[#0d1117] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 rounded-t-2xl bg-gradient-to-r from-purple-900/80 via-indigo-900/80 to-slate-900/80 backdrop-blur-md px-6 py-4 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-2xl">⚡</div>
              <div>
                <h2 className="text-white font-bold text-lg tracking-wide">Neural GEO Insight</h2>
                <p className="text-slate-400 text-xs uppercase tracking-widest">Advanced 9-Cluster Retrieval Analytics</p>
              </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Citability Index + Context Weight */}
          <div className="flex gap-6 items-start">
            <div className="text-center min-w-[100px]">
              <div className="text-6xl font-black text-purple-400">{analysis.citabilityIndex}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest mt-1">Citability Index</div>
            </div>
            <div className="flex-1">
              <div
                className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2"
                style={{ backgroundColor: analysis.contextWeightColor + "22", color: analysis.contextWeightColor }}
              >
                {analysis.contextWeight} Contextual Weight
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 bg-slate-800 rounded-full mb-3">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${analysis.citabilityIndex}%`, backgroundColor: analysis.contextWeightColor }}
                />
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">{analysis.contextWeightNote}</p>
            </div>
          </div>

          {/* Cluster Grid */}
          <div>
            <h3 className="text-purple-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <span>⚡</span> Semantic Cluster Performance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {analysis.clusters.map((cluster) => (
                <div key={cluster.name} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{cluster.icon}</span>
                      <span className="text-slate-200 text-sm font-semibold">{cluster.name}</span>
                    </div>
                    <span className="text-green-400 text-sm font-bold">{cluster.score}/{cluster.maxScore}</span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-1.5 bg-slate-700 rounded-full mb-2">
                    <div
                      className="h-1.5 rounded-full bg-green-400 transition-all duration-500"
                      style={{ width: `${progressPercent(cluster.score, cluster.maxScore)}%` }}
                    />
                  </div>
                  <p className="text-slate-500 text-xs leading-relaxed">{cluster.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Optimization Roadmap */}
          {analysis.optimizationRoadmap.length > 0 && (
            <div>
              <h3 className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🎯</span> Optimization Roadmap
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analysis.optimizationRoadmap.map((item, i) => (
                  <div key={i} className="flex gap-3 items-start bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                    <span className="w-6 h-6 rounded-full bg-green-500/20 text-green-400 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <p className="text-slate-300 text-xs leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Retrieval Intent Anchors */}
          {analysis.retrievalIntentAnchors.length > 0 && (
            <div>
              <h3 className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🔍</span> Retrieval Intent Anchors
              </h3>
              <div className="flex flex-wrap gap-2">
                {analysis.retrievalIntentAnchors.map((anchor, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs rounded-lg font-medium"
                  >
                    {anchor}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

### Fix — Step 3: Add GEO Button to BlogCard.tsx

**File:** `frontend/src/components/workspace/BlogCard.tsx`

Update the BlogCard component to include the GEO Insight button and modal:

```tsx
"use client";
import { useState } from "react";
import { BlogListItem } from "@/types/blog";
import { useRouter } from "next/navigation";
import { analyzeGEO } from "@/lib/geoScore";
import GEOInsightModal from "./GEOInsightModal";

interface Props {
  blog: BlogListItem & { content?: string; keyword_targets?: string[] };
}

export default function BlogCard({ blog }: Props) {
  const router = useRouter();
  const [showGEO, setShowGEO] = useState(false);

  // Calculate GEO analysis (only when modal is opened)
  const handleGEOClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    setShowGEO(true);
  };

  const geoAnalysis = showGEO
    ? analyzeGEO(
        blog.content || blog.meta_description || blog.title,
        blog.title,
        blog.keyword_targets || []
      )
    : null;

  return (
    <>
      {/* Card */}
      <div
        className="relative group cursor-pointer rounded-xl border border-slate-700/50 bg-slate-800/40 hover:bg-slate-800/70 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-black/30 overflow-hidden"
        onClick={() => router.push(`/workspace/blogs/${blog.id}`)}
      >
        {/* Image Area */}
        <div className="relative w-full h-[180px] overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
          {blog.image_url ? (
            <img
              src={blog.image_url}
              alt={blog.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
          {/* Fallback letter */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-5xl font-black text-white/10 select-none">
              {blog.title.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 pb-12">
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
            {blog.title}
          </h3>
          {blog.meta_description && (
            <p className="text-slate-400 text-xs leading-relaxed line-clamp-2 mb-3">
              {blog.meta_description}
            </p>
          )}
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <span>{new Date(blog.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            <span>·</span>
            <span>{blog.word_count?.toLocaleString() || "—"} words</span>
          </div>
        </div>

        {/* GEO Insight Button — bottom right, always visible */}
        <button
          onClick={handleGEOClick}
          className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-semibold transition-all duration-200 z-10"
        >
          <span>⚡</span>
          <span>GEO Insight</span>
        </button>
      </div>

      {/* GEO Modal */}
      {showGEO && geoAnalysis && (
        <GEOInsightModal
          analysis={geoAnalysis}
          onClose={() => setShowGEO(false)}
        />
      )}
    </>
  );
}
```

**IMPORTANT:** The blog list API (`GET /api/blog/list`) currently returns `BlogListItem` which does NOT include `content` field. To make GEO scoring work properly, update the `BlogListResponse` to include a `content_preview` field (first 2000 chars of content) OR update the card to fetch the full blog on GEO button click.

**Recommended approach — fetch full blog on GEO click:**

Update `handleGEOClick` in `BlogCard.tsx`:
```tsx
const [geoAnalysis, setGeoAnalysis] = useState<GEOAnalysis | null>(null);
const [geoLoading, setGeoLoading] = useState(false);

const handleGEOClick = async (e: React.MouseEvent) => {
  e.stopPropagation();
  if (geoAnalysis) { setShowGEO(true); return; } // Use cached result
  setGeoLoading(true);
  try {
    const fullBlog = await blogAPI.getById(blog.id);
    const analysis = analyzeGEO(fullBlog.content, fullBlog.title, fullBlog.keyword_targets || []);
    setGeoAnalysis(analysis);
    setShowGEO(true);
  } catch (err) {
    console.error("GEO analysis failed", err);
  } finally {
    setGeoLoading(false);
  }
};
```

Update the button to show loading:
```tsx
<button
  onClick={handleGEOClick}
  disabled={geoLoading}
  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 text-xs font-semibold transition-all duration-200 z-10 disabled:opacity-50"
>
  <span>{geoLoading ? "..." : "⚡"}</span>
  <span>{geoLoading ? "Analysing..." : "GEO Insight"}</span>
</button>
```

---

## SUMMARY OF ALL FILES TO CHANGE

| File | Change Type | Issue Fixed |
|---|---|---|
| `backend/app/services/scraper_service.py` | Edit | Image extraction — 5 strategies |
| `frontend/next.config.ts` | Edit | Allow all external image domains |
| `frontend/src/components/workspace/BlogCard.tsx` | Full Rewrite | Image fallback + GEO button |
| `frontend/src/app/workspace/blogs/[id]/page.tsx` | Edit | Image fallback + markdown styles |
| `frontend/tailwind.config.ts` | Edit | Add typography plugin |
| `backend/app/agents/writer_agent.py` | Edit | Blog structure prompt |
| `frontend/src/lib/geoScore.ts` | NEW FILE | GEO score calculator |
| `frontend/src/components/workspace/GEOInsightModal.tsx` | NEW FILE | GEO modal panel |

---

## INSTALL COMMANDS REQUIRED

```bash
# Frontend
cd frontend
npm install @tailwindcss/typography

# No new backend packages needed
```

---

## TESTING CHECKLIST AFTER APPLYING FIXES

- [ ] Paste Sapphire URL: `https://pk.sapphireonline.pk/collections/unstitched/products/3PEJQS26V411.html` — image must appear on card and blog detail page
- [ ] If image still blocked by Sapphire hotlink protection: fallback letter shows (no blank dark box)
- [ ] Generated blog has bold H2/H3 headings with visual separation
- [ ] Generated blog has `## Frequently Asked Questions` section
- [ ] Generated blog has `## Conclusion` section
- [ ] Word count ≥ 1200 words
- [ ] "⚡ GEO Insight" button visible on every blog card (bottom-right)
- [ ] Clicking GEO button shows loading "..." state then opens modal
- [ ] GEO modal shows 9 cluster scores with progress bars
- [ ] GEO modal shows Optimization Roadmap
- [ ] GEO modal shows Retrieval Intent Anchors (keywords)
- [ ] Clicking backdrop or X closes the GEO modal
- [ ] GEO button click does NOT navigate to blog detail page (stopPropagation works)

---

## NOTE ON SAPPHIRE IMAGE HOTLINK BLOCKING

Sapphire's CDN (Shopify) blocks direct image hotlinking from other domains. This means even if `og:image` is correctly scraped and saved in the database, the `<img src="...">` will fail in the browser (403 Forbidden or broken image).

**The fix already applied above** uses `onError` to silently hide the broken image and show the letter fallback. This is the correct behaviour — do NOT show a blank dark box, show the first letter of the blog title instead.

If the product owner wants actual product images to display, a future enhancement would be to proxy/download the image server-side and store it in a cloud bucket (S3/Cloudflare R2). That is out of scope for this fix batch.
